export type ProgramMeal = {
  id: string;
  time: string;
  /** Nome da refeição (ex.: "Café da manhã"). Opcional nos programas antigos. */
  label?: string;
  description: string;
};

export type ProgramDayType = "liquido" | "ovo" | "maca" | "refeicoes" | "avaliacao";

export type ProgramDay = {
  day: number;
  type: ProgramDayType;
  title: string;
  /** Aviso do dia (check-in semanal, véspera da avaliação etc.). */
  notice?: string;
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

export type ShoppingItem = {
  id: string;
  category: string;
  item: string;
  substitution?: string;
};

export type ShoppingWeek = {
  week: number;
  title: string;
  items: ShoppingItem[];
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
  /** Meta de água em copos de 250 ml (padrão 8). */
  waterGoal?: number;
  /** Dias em que o check-in sugere peso e cintura (padrão: início, meio e fim). */
  measureDays?: number[];
  /** Aba "Evitar" (alimentos e hábitos). */
  avoid?: string[];
  /** Listas de compras por semana. */
  shopping?: ShoppingWeek[];
  /** Aviso extra para quem marcou hipertensão na triagem. */
  hypertensionWarning?: string;
  /** Texto de encerramento ("Depois do desafio"). */
  after?: { title: string; paragraphs: string[]; hashtag?: string };
};
