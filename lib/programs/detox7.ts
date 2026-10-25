import type { Program, ProgramMeal } from "./types";

const LIQUID_DAY_1: ProgramMeal[] = [
  { id: "d1-08:00", time: "08:00", description: "Suco Detox de Acerola e Espinafre" },
  { id: "d1-12:00", time: "12:00", description: "Suco Power de Cenoura e Limão" },
  { id: "d1-15:00", time: "15:00", description: "Suco Detox de Mirtilo, Chia e Linhaça" },
  { id: "d1-18:00", time: "18:00", description: "Sopa Nutritiva de Legumes e Frango" },
  { id: "d1-20:00", time: "20:00", description: "Suco Detox de Tomate e Limão" },
];

// Ids próprios para não misturar com as marcações do dia 1.
const LIQUID_ALTERNATIVE: ProgramMeal[] = LIQUID_DAY_1.map((m) => ({
  ...m,
  id: m.id.replace("d1-", "alt-"),
}));

const EGG_RULES = [
  "Ovos feitos em óleo de coco ou manteiga",
  "Até 20 g de queijo curado por refeição de ovo (opcional)",
  "1º ovo em até 30 min após acordar",
  "Pelo menos 6 ovos no dia",
  "No máximo 5h sem comer ovo",
  "2 ovos às 18h",
  "Última refeição 3h antes de dormir",
  "Beber bastante líquido",
  "Folhas verdes com azeite são permitidas",
];

function eggDay(day: number) {
  return {
    day,
    type: "ovo" as const,
    title: "Dia do ovo",
    counter: { item: "ovos" as const, min: 6 },
    rules: EGG_RULES,
    alerts: {
      maxHoursWithoutEgg: 5,
      fixedTime: [{ time: "18:00", label: "2 ovos" }],
    },
    alternative: {
      label:
        "Você marcou intolerância a ovo. Hoje vale a dieta líquida (mesmos sucos e sopas dos dias 1, 2 e 6).",
      meals: LIQUID_ALTERNATIVE,
    },
  };
}

export const detox7: Program = {
  id: "detox-7",
  title: "Desafio Detox 7 Dias",
  author: "Dr. Juliano Pimentel",
  durationDays: 7,
  level: "restritivo",
  screening: {
    questions: [
      { key: "menor18", label: "Você tem menos de 18 anos?", block: true },
      { key: "gestante", label: "Você está gestante ou amamentando?", block: true },
      { key: "diabetes", label: "Você tem diabetes?", block: true },
      { key: "renal_hepatica", label: "Você tem alguma doença renal ou hepática?", block: true },
      { key: "transtorno", label: "Você tem ou já teve transtorno alimentar?", block: true },
      {
        key: "medicacao",
        label: "Você usa medicação contínua ou está em tratamento de saúde?",
        requiresConfirmation: true,
      },
    ],
    confirmLabel: "Conversei com meu médico/nutricionista",
  },
  liquids: "Água, café e chás sem açúcar ou adoçante, à vontade durante o dia e no jejum.",
  warnings: [
    "Nos primeiros dias podem ocorrer dor de cabeça, mal-estar, irritabilidade e tremedeira. Se piorar ou persistir, pare o desafio e procure um médico.",
    "Vômitos ou diarreia persistentes, dor de cabeça forte, tremedeira ou mal-estar que não passa são sinais de alerta: pare e procure atendimento.",
  ],
  days: [
    {
      day: 1,
      type: "liquido",
      title: "Dieta líquida",
      fasting: { start: "20:00 (véspera)", end: "08:00", hours: 12 },
      meals: LIQUID_DAY_1,
    },
    {
      day: 2,
      type: "liquido",
      title: "Dieta líquida",
      fasting: { start: "20:00 (véspera)", end: "08:00", hours: 12 },
      meals: [
        { id: "d2-08:00", time: "08:00", description: "Suco Detox de Açafrão e Gengibre" },
        { id: "d2-12:00", time: "12:00", description: "Suco Probiótico de Kefir de Água e Limão" },
        { id: "d2-15:00", time: "15:00", description: "Suco Detox de Morango e Hortelã" },
        { id: "d2-18:00", time: "18:00", description: "Sopa de Cebola" },
        { id: "d2-20:00", time: "20:00", description: "Suco Detox de Vinagre de Maçã" },
      ],
    },
    eggDay(3),
    eggDay(4),
    eggDay(5),
    {
      day: 6,
      type: "liquido",
      title: "Dieta líquida",
      fasting: { start: "20:00 (véspera)", end: "08:00", hours: 12 },
      meals: [
        { id: "d6-08:00", time: "08:00", description: "Café Termogênico" },
        { id: "d6-12:00", time: "12:00", description: "Suco Detox de Kiwi e Hortelã" },
        { id: "d6-15:00", time: "15:00", description: "Suco Detox de Café e Frutas Vermelhas" },
        { id: "d6-18:00", time: "18:00", description: "Sopa de Abóbora" },
        { id: "d6-20:00", time: "20:00", description: "Suco Detox de Abacate" },
      ],
    },
    {
      day: 7,
      type: "maca",
      title: "Dia da maçã",
      counter: { item: "macas", goal: 6 },
      fasting: { until: "12:00" },
      rules: [
        "Jejum até as 12h",
        "Uma maçã no almoço",
        "Total de 6 maçãs no dia",
        "Líquidos: água, chás e café sem açúcar",
      ],
    },
  ],
};
