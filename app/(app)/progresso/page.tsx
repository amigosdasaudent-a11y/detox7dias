import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { currentDayNumber, listPrograms, SAFETY_FOOTER } from "@/lib/programs";
import { formatNumber } from "@/lib/imc";

export const dynamic = "force-dynamic";

export default async function ProgressoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const programs = listPrograms();
  const { data: enrollments } = await supabase
    .from("program_enrollments")
    .select("program_id, start_date, status")
    .eq("user_id", user.id);

  const byProgram = new Map((enrollments || []).map((e) => [e.program_id, e]));

  const { data: measures } = await supabase
    .from("program_measures")
    .select("program_id, moment, weight_kg, waist_cm, imc")
    .eq("user_id", user.id);

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 md:px-8">
      <h1 className="text-2xl font-extrabold">📊 Meu progresso</h1>
      <p className="text-sm text-neutral-500">
        Seu histórico fica separado por desafio. Nada é comparado com outras pessoas.
      </p>

      <div className="mt-5 flex flex-col gap-4">
        {programs.map((program) => {
          const enrollment = byProgram.get(program.id);
          const rows = (measures || []).filter((m) => m.program_id === program.id);
          const inicio = rows.find((m) => m.moment === "inicio");
          const fim = rows.find((m) => m.moment === "fim");
          const day = enrollment
            ? currentDayNumber(enrollment.start_date, program.durationDays)
            : 0;
          const pct = enrollment ? Math.round((day / program.durationDays) * 100) : 0;

          return (
            <div key={program.id} className="rounded-3xl bg-white p-5 shadow">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold">{program.title}</h2>
                  <p className="text-xs text-neutral-500">{program.author}</p>
                </div>
                <span className="rounded-full bg-[#FFF0F5] px-3 py-0.5 text-xs font-bold text-[#B3124F]">
                  {!enrollment
                    ? "Não iniciado"
                    : enrollment.status === "concluido"
                      ? "Concluído"
                      : enrollment.status === "pausado"
                        ? "Pausado"
                        : `Dia ${day} de ${program.durationDays}`}
                </span>
              </div>

              {enrollment ? (
                <>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-[#FF4D8D]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-neutral-500">
                    Início em{" "}
                    {new Date(`${enrollment.start_date}T00:00:00`).toLocaleDateString("pt-BR")}
                  </p>
                  {(inicio || fim) && (
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-2xl bg-[#FFF5F7] p-3">
                        <p className="text-xs font-semibold text-neutral-500">Início</p>
                        <p className="font-bold">
                          {formatNumber(inicio?.weight_kg ? Number(inicio.weight_kg) : null)} kg
                        </p>
                        <p className="text-xs text-neutral-500">
                          cintura{" "}
                          {formatNumber(inicio?.waist_cm ? Number(inicio.waist_cm) : null)} cm
                        </p>
                      </div>
                      <div className="rounded-2xl bg-[#FFF5F7] p-3">
                        <p className="text-xs font-semibold text-neutral-500">Fim</p>
                        <p className="font-bold">
                          {formatNumber(fim?.weight_kg ? Number(fim.weight_kg) : null)} kg
                        </p>
                        <p className="text-xs text-neutral-500">
                          cintura {formatNumber(fim?.waist_cm ? Number(fim.waist_cm) : null)} cm
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold">
                    <a
                      href={`/acompanhamento/${program.id}`}
                      className="rounded-full bg-[#FF4D8D] px-5 py-1.5 text-white"
                    >
                      Abrir acompanhamento
                    </a>
                    <a
                      href={`/acompanhamento/${program.id}/resultado`}
                      className="text-[#FF4D8D]"
                    >
                      Ver resultado →
                    </a>
                  </div>
                </>
              ) : (
                <div className="mt-3">
                  <p className="text-sm text-neutral-600">
                    Você ainda não começou este desafio. Ele aparece dentro do produto
                    correspondente em Meus produtos.
                  </p>
                  <a
                    href="/inicio"
                    className="mt-3 inline-block rounded-full bg-[#FF4D8D] px-5 py-1.5 text-sm font-semibold text-white"
                  >
                    Ver meus produtos
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-center text-xs text-neutral-500">{SAFETY_FOOTER}</p>
    </div>
  );
}
