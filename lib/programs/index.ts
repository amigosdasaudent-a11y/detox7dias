import { detox7 } from "./detox7";
import type { Program } from "./types";

export type { Program, ProgramDay, ProgramMeal, ScreeningQuestion } from "./types";

// Programas disponíveis no app. O Detox 15 Dias entra aqui quando o módulo existir.
const PROGRAMS: Record<string, Program> = {
  [detox7.id]: detox7,
};

export function getProgram(id: string | null | undefined): Program | null {
  if (!id) return null;
  return PROGRAMS[id] || null;
}

export function listPrograms(): Program[] {
  return Object.values(PROGRAMS);
}

/** Dia atual (1..duração) a partir da data de início (YYYY-MM-DD). */
export function currentDayNumber(
  startDate: string,
  durationDays: number,
  today: Date = new Date()
): number {
  const start = new Date(`${startDate.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(start.getTime())) return 1;
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = Math.floor((t.getTime() - start.getTime()) / 86_400_000);
  return Math.min(durationDays, Math.max(1, diff + 1));
}

/** Quantos dias faltam para começar (0 = já começou). */
export function daysUntilStart(startDate: string, today: Date = new Date()): number {
  const start = new Date(`${startDate.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(start.getTime())) return 0;
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.max(0, Math.round((start.getTime() - t.getTime()) / 86_400_000));
}

export const SAFETY_FOOTER =
  "Conteúdo informativo. Não substitui médico ou nutricionista. Os resultados variam de pessoa para pessoa.";
