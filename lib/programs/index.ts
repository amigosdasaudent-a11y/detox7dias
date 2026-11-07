import { detox7 } from "./detox7";
import { detox15 } from "./detox15";
import type { Program, ProgramDayType } from "./types";

export type {
  Program,
  ProgramDay,
  ProgramDayType,
  ProgramMeal,
  ScreeningQuestion,
  ShoppingItem,
  ShoppingWeek,
} from "./types";

// Programas disponíveis no app. O id precisa bater com collections.program_id.
const PROGRAMS: Record<string, Program> = {
  [detox7.id]: detox7,
  [detox15.id]: detox15,
};

export function getProgram(id: string | null | undefined): Program | null {
  if (!id) return null;
  return PROGRAMS[id] || null;
}

export function listPrograms(): Program[] {
  return Object.values(PROGRAMS);
}

/** Rótulo curto do tipo do dia (jornada do acompanhamento). */
export function dayTypeLabel(type: ProgramDayType): string {
  switch (type) {
    case "ovo":
      return "Ovo";
    case "maca":
      return "Maçã";
    case "liquido":
      return "Líquido";
    case "avaliacao":
      return "Avaliação";
    default:
      return "Cardápio";
  }
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
