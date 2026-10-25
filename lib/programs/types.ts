export type ProgramMeal = {
  id: string;
  time: string;
  description: string;
};

export type ProgramDayType = "liquido" | "ovo" | "maca";

export type ProgramDay = {
  day: number;
  type: ProgramDayType;
  title: string;
  /** Jejum do dia. `end`/`until` no formato HH:MM. */
  fasting?: { start?: string; end?: string; hours?: number; until?: string };
  meals?: ProgramMeal[];
  counter?: { item: "ovos" | "macas"; min?: number; goal?: number };
  rules?: string[];
  alerts?: {
    maxHoursWithoutEgg?: number;
    fixedTime?: { time: string; label: string }[];
  };
  /** Alternativa para quem tem intolerância a ovo (dias de ovo). */
  alternative?: { label: string; meals: ProgramMeal[] };
};

export type ScreeningQuestion = {
  key: string;
  label: string;
  /** Responder "sim" bloqueia o início. */
  block?: boolean;
  /** Responder "sim" exige a confirmação de que falou com um profissional. */
  requiresConfirmation?: boolean;
};

export type Program = {
  id: string;
  title: string;
  author: string;
  durationDays: number;
  level: "restritivo" | "equilibrado";
  screening: {
    questions: ScreeningQuestion[];
    confirmLabel: string;
  };
  liquids: string;
  warnings: string[];
  days: ProgramDay[];
};
