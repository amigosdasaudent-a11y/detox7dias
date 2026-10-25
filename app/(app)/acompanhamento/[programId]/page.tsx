import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { currentDayNumber, daysUntilStart, SAFETY_FOOTER, getProgram } from "@/lib/programs";
import SafetyButton from "@/components/acompanhamento/SafetyButton";
import ResumeButton from "@/components/acompanhamento/ResumeButton";
import { imcClass, formatNumber } from "@/lib/imc";

export const dynamic = "force-dynamic";

export default async function AcompanhamentoPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;
  const program = getProgram(programId);
  if (!program) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: enrollment } = await supabase
    .from("program_enrollments")
    .select("*")
    .eq("user_id", user.id)
    .eq("program_id", program.id)
    .maybeSingle();

  if (!enrollment) redirect(`/acompanhamento/${program.id}/iniciar`);

  const { data: progress } = await supabase
    .from("program_day_progress")
    .select("day, completed")
    .eq("user_id", user.id)
    .eq("program_id", program.id);
  const progressByDay = new Map(
    (progress || []).map((p) => [Number(p.day), Boolean(p.completed)])
  );

  const { data: measures } = await supabase
    .from("program_measures")
    .select("moment, weight_kg, waist_cm, height_cm, imc")
    .eq("user_id", user.id)
    .eq("program_id", program.id);
  const inicio = (measures || []).find((m) => m.moment === "inicio") || null;
  const fim = (measures || []).find((m) => m.moment === "fim") || null;

  const today = currentDayNumber(enrollment.start_date, program.durationDays);
  const until = daysUntilStart(enrollment.start_date);
  const todayDef = program.days.find((d) => d.day === today);
  const completedCount = [...progressByDay.values()].filter(Boolean).length;
  const pct = Math.round((completedCount / program.durationDays) * 100);

  let streak = 0;
  for (let d = today; d >= 1; d--) {
    if (progressByDay.get(d)) streak++;
    else if (d === today) continue;
    else break;
  }

  const paused = enrollment.status === "pausado";
  const done = enrollment.status === "concluido";
  const canSeeResult = done || Boolean(fim) || today >= program.durationDays;

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 pb-24 pt-6 md:px-8">
      <a href="/inicio" className="text-sm text-neutral-500">
        ← Todos os produtos
      </a>

      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#B3124F]">
            Meu acompanhamento
          </p>
          <h1 className="text-2xl font-extrabold">{program.title}</h1>
          <p className="text-sm text-neutral-500">Baseado no e-book de {program.author}</p>
        </div>
        <span className="rounded-full bg-white px-4 py-1.5 text-sm font-bold shadow">
          {done
            ? "Concluído"
            : paused
              ? "Pausado"
              : until > 0
                ? `Começa em ${until} ${until === 1 ? "dia" : "dias"}`
                : `Dia ${today} de ${program.durationDays}`}
        </span>
      </div>

      {paused && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
          <span>
            Seu desafio está pausado. Se estiver se sentindo bem e liberado por um
            profissional, pode retomar de onde parou.
          </span>
          <ResumeButton programId={program.id} />
        </div>
      )}

      <div className="mt-4 rounded-3xl bg-white p-5 shadow">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">Progresso</span>
          <span className="text-neutral-500">
            {completedCount} de {program.durationDays} dias
          </span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-neutral-100">
          <div className="h-full rounded-full bg-[#FF4D8D]" style={{ width: `${pct}%` }} />
        </div>
        {streak > 0 && (
          <p className="mt-2 text-xs font-semibold text-emerald-700">
            🔥 {streak} {streak === 1 ? "dia seguido" : "dias seguidos"}
          </p>
        )}
      </div>

      {todayDef && !done && (
        <div className="mt-4 rounded-3xl bg-gradient-to-br from-[#FF4D8D] to-[#B3124F] p-6 text-white shadow">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-90">
            Hoje · Dia {today}
          </p>
          <h2 className="mt-1 text-xl font-extrabold">{todayDef.title}</h2>
          <p className="mt-1 text-sm opacity-90">
            {todayDef.meals?.length
              ? `${todayDef.meals.length} refeições para marcar`
              : todayDef.counter
                ? todayDef.counter.item === "ovos"
                  ? `Meta: ${todayDef.counter.min} ovos`
                  : `Meta: ${todayDef.counter.goal} maçãs`
                : "Checklist do dia"}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={`/acompanhamento/${program.id}/dia/${today}`}
              className="rounded-full bg-white px-5 py-2 text-sm font-bold text-[#B3124F]"
            >
              Abrir o dia de hoje
            </a>
            <a
              href={`/acompanhamento/${program.id}/checkin/${today}`}
              className="rounded-full border border-white/60 px-5 py-2 text-sm font-semibold"
            >
              Check-in do dia
            </a>
          </div>
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-lg font-bold">Jornada</h2>
        <p className="text-xs text-neutral-500">
          Toque em qualquer dia para ver o plano e marcar o que ficou para trás.
        </p>
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
          {program.days.map((d) => {
            const isDone = progressByDay.get(d.day);
            const isToday = d.day === today;
            const isMissed = !isDone && !isToday && d.day < today;
            return (
              <a
                key={d.day}
                href={`/acompanhamento/${program.id}/dia/${d.day}`}
                className={`flex flex-col items-center rounded-2xl border p-2 text-center transition-colors ${
                  isDone
                    ? "border-emerald-300 bg-emerald-50"
                    : isToday
                      ? "border-[#FF4D8D] bg-white ring-2 ring-[#FF4D8D]/30"
                      : "border-neutral-200 bg-white"
                }`}
              >
                <span className="text-lg">
                  {isDone ? "✅" : isToday ? "⭐" : isMissed ? "—" : "⚪"}
                </span>
                <span className="text-xs font-bold">Dia {d.day}</span>
                <span className="text-[10px] text-neutral-500">
                  {d.type === "ovo" ? "Ovo" : d.type === "maca" ? "Maçã" : "Líquido"}
                </span>
              </a>
            );
          })}
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl bg-white p-5 shadow">
          <h2 className="font-bold">📏 Minhas medidas</h2>
          {inicio ? (
            <p className="mt-2 text-sm text-neutral-600">
              Início: {formatNumber(Number(inicio.weight_kg))} kg ·{" "}
              {formatNumber(Number(inicio.waist_cm))} cm de cintura
              {inicio.imc ? (
                <span className="block text-xs text-neutral-500">
                  IMC {formatNumber(Number(inicio.imc))} — {imcClass(Number(inicio.imc))}
                </span>
              ) : null}
            </p>
          ) : (
            <p className="mt-2 text-sm text-neutral-500">Medidas iniciais não registradas.</p>
          )}
          <a
            href={`/acompanhamento/${program.id}/resultado`}
            className="mt-3 inline-block text-sm font-semibold text-[#FF4D8D]"
          >
            {canSeeResult ? "Ver resultado e medidas finais →" : "Ver comparativo →"}
          </a>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow">
          <h2 className="font-bold">💧 Líquidos permitidos</h2>
          <p className="mt-2 text-sm text-neutral-600">{program.liquids}</p>
          <p className="mt-2 text-xs text-neutral-500">
            Lembre-se de beber água ao longo do dia.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-3xl bg-white p-5 shadow">
        <h2 className="font-bold">⚠️ Atenção</h2>
        <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm text-neutral-600">
          {program.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      </div>

      <p className="mt-6 text-center text-xs text-neutral-500">{SAFETY_FOOTER}</p>

      <SafetyButton programId={program.id} day={today} />
    </div>
  );
}
