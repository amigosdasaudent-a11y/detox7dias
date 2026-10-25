import { currentDayNumber, daysUntilStart } from "@/lib/programs";
import type { Program } from "@/lib/programs/types";

export default function ProgressCard({
  program,
  enrollment,
}: {
  program: Program;
  enrollment: { start_date: string; status: string } | null;
}) {
  if (!enrollment) {
    return (
      <div className="mt-8 rounded-3xl bg-white p-5 shadow">
        <h2 className="text-lg font-bold">📅 Meu acompanhamento</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Um guia dia a dia do {program.title.toLowerCase()}: plano do dia, lembretes,
          medidas e check-ins.
        </p>
        <a
          href={`/acompanhamento/${program.id}/iniciar`}
          className="mt-3 inline-block rounded-full bg-[#FF4D8D] px-6 py-2 text-sm font-semibold text-white"
        >
          Iniciar meu desafio
        </a>
      </div>
    );
  }

  const day = currentDayNumber(enrollment.start_date, program.durationDays);
  const until = daysUntilStart(enrollment.start_date);
  const pct = Math.round((day / program.durationDays) * 100);
  const done = enrollment.status === "concluido";

  return (
    <div className="mt-8 rounded-3xl bg-white p-5 shadow">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">📅 Meu acompanhamento</h2>
        <span className="rounded-full bg-[#FFF0F5] px-3 py-0.5 text-xs font-bold text-[#B3124F]">
          {done ? "Concluído" : enrollment.status === "pausado" ? "Pausado" : `Dia ${day} de ${program.durationDays}`}
        </span>
      </div>
      {until > 0 && !done && (
        <p className="mt-1 text-xs text-neutral-500">
          Começa em {until} {until === 1 ? "dia" : "dias"}.
        </p>
      )}
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-100">
        <div className="h-full rounded-full bg-[#FF4D8D]" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold">
        <a
          href={done ? `/acompanhamento/${program.id}/resultado` : `/acompanhamento/${program.id}`}
          className="rounded-full bg-[#FF4D8D] px-5 py-1.5 text-white"
        >
          {done ? "Ver resultado" : `Continuar: Dia ${day} de ${program.durationDays}`}
        </a>
        <a href={`/acompanhamento/${program.id}/dia/${day}`} className="text-[#FF4D8D]">
          Abrir o dia de hoje →
        </a>
      </div>
    </div>
  );
}
