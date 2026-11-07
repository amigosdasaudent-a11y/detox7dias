import type { Program, ProgramDay, ProgramMeal, ShoppingWeek } from "./types";

// Ordem das refeições em todos os dias (Apêndice A da especificação).
// Os horários são só uma sugestão de organização do dia.
const SLOTS = [
  { label: "Café da manhã", time: "08:00" },
  { label: "Lanche da manhã", time: "10:00" },
  { label: "Almoço", time: "12:30" },
  { label: "Lanche da tarde", time: "15:30" },
  { label: "Lanche da tarde 2", time: "17:30" },
  { label: "Jantar", time: "19:30" },
  { label: "Ceia", time: "21:30" },
];

function menu(day: number, items: string[]): ProgramMeal[] {
  return items.map((description, i) => ({
    id: `d${day}-${i + 1}`,
    time: SLOTS[i].time,
    label: SLOTS[i].label,
    description,
  }));
}

function menuDay(day: number, items: string[], extra: Partial<ProgramDay> = {}): ProgramDay {
  return { day, type: "refeicoes", title: "Cardápio do dia", meals: menu(day, items), ...extra };
}

const SHOPPING: ShoppingWeek[] = [
  {
    week: 1,
    title: "Semana 1 · dias 1 a 7",
    items: [
      // Frutas
      { id: "w1-f1", category: "Frutas", item: "Maçã (6 unid.)", substitution: "Pera" },
      { id: "w1-f2", category: "Frutas", item: "Banana prata (1 dúzia)", substitution: "Banana nanica" },
      { id: "w1-f3", category: "Frutas", item: "Abacaxi (1 unid.)" },
      { id: "w1-f4", category: "Frutas", item: "Melão (1 unid. pequena)" },
      { id: "w1-f5", category: "Frutas", item: "Kiwi (3 unid.)" },
      { id: "w1-f6", category: "Frutas", item: "Goiaba (2 unid.)" },
      { id: "w1-f7", category: "Frutas", item: "Melancia (1 fatia grande)" },
      { id: "w1-f8", category: "Frutas", item: "Morango (1 caixa)" },
      { id: "w1-f9", category: "Frutas", item: "Manga (1 unid.)" },
      { id: "w1-f10", category: "Frutas", item: "Pera (1 unid.)" },
      { id: "w1-f11", category: "Frutas", item: "Coco in natura (2 unid.)" },
      { id: "w1-f12", category: "Frutas", item: "Limão (4 unid.)" },
      { id: "w1-f13", category: "Frutas", item: "Ameixa preta (1 unid.)" },
      // Verduras e legumes
      { id: "w1-v1", category: "Verduras e legumes", item: "Folhas verdes (alface, rúcula, espinafre)" },
      { id: "w1-v2", category: "Verduras e legumes", item: "Berinjela (2 unid.)" },
      { id: "w1-v3", category: "Verduras e legumes", item: "Cenoura (4 unid.)" },
      { id: "w1-v4", category: "Verduras e legumes", item: "Tomate (4 unid.)" },
      { id: "w1-v5", category: "Verduras e legumes", item: "Abobrinha (2 unid.)" },
      { id: "w1-v6", category: "Verduras e legumes", item: "Couve-flor (1 unid.)" },
      { id: "w1-v7", category: "Verduras e legumes", item: "Batata doce (1 kg)" },
      { id: "w1-v8", category: "Verduras e legumes", item: "Batata yacon (300 g)", substitution: "Batata doce" },
      { id: "w1-v9", category: "Verduras e legumes", item: "Pimentão (1 unid.)" },
      { id: "w1-v10", category: "Verduras e legumes", item: "Alho e cebola" },
      { id: "w1-v11", category: "Verduras e legumes", item: "Palmito (1 vidro)" },
      { id: "w1-v12", category: "Verduras e legumes", item: "Hortelã, manjericão, salsinha e coentro" },
      { id: "w1-v13", category: "Verduras e legumes", item: "Orégano" },
      // Proteínas
      { id: "w1-p1", category: "Proteínas", item: "Ovos (2 dúzias)" },
      { id: "w1-p2", category: "Proteínas", item: "Peixe branco — tilápia ou merluza (600 g)", substitution: "Frango grelhado" },
      { id: "w1-p3", category: "Proteínas", item: "Peito de frango (1 kg)" },
      { id: "w1-p4", category: "Proteínas", item: "Carne moída (patinho) — 300 g", substitution: "Frango moído" },
      // Grãos, cereais e sementes
      { id: "w1-g1", category: "Grãos e sementes", item: "Quinoa (500 g)", substitution: "Arroz integral" },
      { id: "w1-g2", category: "Grãos e sementes", item: "Arroz integral (500 g)" },
      { id: "w1-g3", category: "Grãos e sementes", item: "Feijão (500 g)" },
      { id: "w1-g4", category: "Grãos e sementes", item: "Aveia (500 g)" },
      { id: "w1-g5", category: "Grãos e sementes", item: "Farinha de linhaça (200 g)" },
      { id: "w1-g6", category: "Grãos e sementes", item: "Chia (100 g)" },
      { id: "w1-g7", category: "Grãos e sementes", item: "Cacau em pó (100 g)" },
      { id: "w1-g8", category: "Grãos e sementes", item: "Milho de pipoca (500 g)" },
      { id: "w1-g9", category: "Grãos e sementes", item: "Aipim (500 g)", substitution: "Inhame" },
      { id: "w1-g10", category: "Grãos e sementes", item: "Inhame (500 g)" },
      // Oleaginosas
      { id: "w1-o1", category: "Oleaginosas", item: "Castanhas de caju (200 g)" },
      { id: "w1-o2", category: "Oleaginosas", item: "Castanhas variadas (200 g)" },
      // Outros
      { id: "w1-x1", category: "Outros", item: "Azeite extra virgem" },
      { id: "w1-x2", category: "Outros", item: "Leite de coco (2 latas)" },
      { id: "w1-x3", category: "Outros", item: "Barrinhas de proteína — mínimo 11 g cada (7 unid.)" },
      { id: "w1-x4", category: "Outros", item: "Coco ralado sem açúcar (100 g)" },
    ],
  },
  {
    week: 2,
    title: "Semana 2 · dias 8 a 15",
    items: [
      // Frutas
      { id: "w2-f1", category: "Frutas", item: "Laranja (6 unid.)" },
      { id: "w2-f2", category: "Frutas", item: "Mamão papaia (1 unid.)" },
      { id: "w2-f3", category: "Frutas", item: "Banana (1 dúzia)", substitution: "Banana nanica" },
      { id: "w2-f4", category: "Frutas", item: "Banana-da-terra (2 unid.)" },
      { id: "w2-f5", category: "Frutas", item: "Morango (2 caixas)" },
      { id: "w2-f6", category: "Frutas", item: "Melancia (1 fatia grande)" },
      { id: "w2-f7", category: "Frutas", item: "Kiwi (2 unid.)" },
      { id: "w2-f8", category: "Frutas", item: "Uva (1 cacho pequeno)" },
      { id: "w2-f9", category: "Frutas", item: "Coco (2 unid.)" },
      { id: "w2-f10", category: "Frutas", item: "Manga (2 unid.)" },
      { id: "w2-f11", category: "Frutas", item: "Limão (3 unid.)" },
      // Verduras e legumes
      { id: "w2-v1", category: "Verduras e legumes", item: "Alface (1 unid.)" },
      { id: "w2-v2", category: "Verduras e legumes", item: "Brócolis (1 unid.)" },
      { id: "w2-v3", category: "Verduras e legumes", item: "Abóbora (500 g)" },
      { id: "w2-v4", category: "Verduras e legumes", item: "Tomate (4 unid.)" },
      { id: "w2-v5", category: "Verduras e legumes", item: "Palmito (1 vidro)" },
      { id: "w2-v6", category: "Verduras e legumes", item: "Cogumelos (200 g)", substitution: "Legumes variados" },
      { id: "w2-v7", category: "Verduras e legumes", item: "Batata-baroa (500 g)", substitution: "Batata doce" },
      { id: "w2-v8", category: "Verduras e legumes", item: "Batata doce (1 kg)" },
      { id: "w2-v9", category: "Verduras e legumes", item: "Inhame (500 g)" },
      { id: "w2-v10", category: "Verduras e legumes", item: "Aipim (500 g)" },
      // Proteínas
      { id: "w2-p1", category: "Proteínas", item: "Ovos (1 dúzia)" },
      { id: "w2-p2", category: "Proteínas", item: "Ovos de codorna (12 unid.)", substitution: "2 ovos de galinha" },
      { id: "w2-p3", category: "Proteínas", item: "Peixe — tilápia, merluza ou salmão (600 g)", substitution: "Frango grelhado" },
      { id: "w2-p4", category: "Proteínas", item: "Peito de frango (1 kg)" },
      { id: "w2-p5", category: "Proteínas", item: "Camarão (300 g)", substitution: "Frango ou peixe" },
      // Grãos, cereais e sementes
      { id: "w2-g1", category: "Grãos e sementes", item: "Grão-de-bico (500 g)", substitution: "Lentilha" },
      { id: "w2-g2", category: "Grãos e sementes", item: "Lentilha (250 g)" },
      { id: "w2-g3", category: "Grãos e sementes", item: "Arroz integral (500 g)" },
      { id: "w2-g4", category: "Grãos e sementes", item: "Quinoa (250 g)", substitution: "Cuscuz marroquino" },
      { id: "w2-g5", category: "Grãos e sementes", item: "Cuscuz marroquino (250 g)" },
      { id: "w2-g6", category: "Grãos e sementes", item: "Aveia (500 g)" },
      { id: "w2-g7", category: "Grãos e sementes", item: "Farinha de linhaça dourada (200 g)" },
      { id: "w2-g8", category: "Grãos e sementes", item: "Chia (100 g)" },
      // Oleaginosas
      { id: "w2-o1", category: "Oleaginosas", item: "Castanha-do-Pará (100 g)" },
      { id: "w2-o2", category: "Oleaginosas", item: "Castanha de caju (200 g)" },
      { id: "w2-o3", category: "Oleaginosas", item: "Amêndoas (200 g)" },
      { id: "w2-o4", category: "Oleaginosas", item: "Pasta de amendoim sem açúcar (1 pote)" },
      // Laticínios e outros
      { id: "w2-x1", category: "Outros", item: "Iogurte natural desnatado (4 unid.)", substitution: "Leite de coco" },
      { id: "w2-x2", category: "Outros", item: "Leite de coco (2 latas)" },
      { id: "w2-x3", category: "Outros", item: "Mel (1 pote)" },
      { id: "w2-x4", category: "Outros", item: "Canela em pó" },
      { id: "w2-x5", category: "Outros", item: "Cacau em pó (100 g)" },
      { id: "w2-x6", category: "Outros", item: "Chocolate 70% (100 g)" },
      { id: "w2-x7", category: "Outros", item: "Tâmaras (200 g)" },
      { id: "w2-x8", category: "Outros", item: "Granola sem açúcar (200 g)" },
      { id: "w2-x9", category: "Outros", item: "Azeite extra virgem" },
      { id: "w2-x10", category: "Outros", item: "Milho de pipoca (500 g)" },
    ],
  },
];

export const detox15: Program = {
  id: "detox-15",
  title: "Detox 15 Dias",
  author: "Dr. Dayan Siebra",
  durationDays: 15,
  level: "equilibrado",
  screening: {
    questions: [
      { key: "menor18", label: "Você tem menos de 18 anos?", block: true },
      { key: "gestante", label: "Você está gestante?", block: true },
      { key: "lactante", label: "Você está amamentando?", block: true },
      { key: "diabetes", label: "Você tem diabetes?", block: true },
      { key: "renal_hepatica", label: "Você tem alguma doença renal ou hepática?", block: true },
      { key: "transtorno", label: "Você tem ou já teve transtorno alimentar?", block: true },
      {
        key: "medicacao",
        label: "Você usa medicação contínua ou está em tratamento de saúde?",
        requiresConfirmation: true,
      },
      { key: "hipertensao", label: "Você tem pressão alta (hipertensão)?" },
    ],
    confirmLabel: "Conversei com meu médico/nutricionista",
  },
  liquids:
    "Água e chás naturais sem açúcar. Prefira água ao longo do dia — use a meta de copos como referência, não como obrigação.",
  waterGoal: 8,
  measureDays: [1, 7, 15],
  warnings: [
    "Os cardápios são sugestões, não uma prescrição individual. O ideal é seguir com o acompanhamento de um profissional de confiança.",
    "Hipertensos: use canela, gengibre e pimenta com moderação.",
    "Problemas renais: só faça restrições alimentares com orientação médica e nutricional.",
    "Diabéticos: converse com seu médico antes de restringir alimentos.",
    "Se você sentir tontura, fraqueza intensa, vômitos ou mal-estar que não passa, pare o desafio e procure atendimento.",
  ],
  hypertensionWarning:
    "Você marcou hipertensão na triagem. Use canela, gengibre e pimenta com moderação e siga as orientações do seu médico.",
  avoid: [
    "Açúcar e adoçantes artificiais",
    "Glúten e farináceos de trigo",
    "Gorduras ruins: margarina, frituras e industrializados",
    "Excesso de sódio e produtos light/diet",
    "Fast-food",
    "Álcool",
    "Sucos artificiais — prefira água e sucos naturais",
    "Exercício físico não é obrigatório, mas é bem-vindo se você tiver disposição",
  ],
  shopping: SHOPPING,
  after: {
    title: "Depois do desafio",
    paragraphs: [
      "Você concluiu os 15 dias. Agora é hora de voltar a comer um pouco mais, sem exageros, mantendo na rotina os alimentos que fizeram bem para você.",
      "Varie as cores do prato: alaranjados e amarelos, vermelhos, verdes, marrons e roxos, brancos.",
      "Prefira carnes magras, cozidas ou assadas, sem embutidos e sem frituras.",
      "Se quiser, repita os cardápios que você mais gostou e continue bebendo água ao longo do dia.",
    ],
    hashtag: "#detox15dias",
  },
  days: [
    // ===== Semana 1 =====
    menuDay(
      1,
      [
        "Suco verde + 1 ovo cozido",
        "1 maçã",
        "Lasanha de berinjela + salada verde + maionese de abacate",
        "1/4 de carne de coco in natura",
        "Barrinha de proteína com no mínimo 11 g de proteína",
        "Creme de cenoura com carne moída (patinho de preferência)",
        "Shake de banana",
      ],
      {
        notice:
          "Antes de começar, veja a lista de compras da semana 1. Coma até se sentir satisfeito, mastigando devagar.",
      }
    ),
    menuDay(2, [
      "Suco de kiwi com hortelã e gengibre",
      "Omelete com 1 ovo de galinha",
      "Tabule de quinoa + salada de melancia",
      "Ameixa preta in natura (1 unid.)",
      "1 ovo cozido + orégano",
      "Espaguete de abobrinha com molho de tomate",
      "Pipoca com água (azeite extra virgem só depois do preparo)",
    ]),
    menuDay(3, [
      "Maçã com canela e gengibre",
      "1 ovo mexido + 1 banana prata aquecida na frigideira antiaderente",
      "Peixe assado com gotas de limão + risoto de couve-flor",
      "2 fatias de abacaxi assadas no forno com canela",
      "Abacate (5 col. de sopa) + cacau em pó",
      "Creme de legumes",
      "Chá de camomila + 1 ovo cozido",
    ]),
    menuDay(4, [
      "2 fatias de abacaxi + 1/4 de coco in natura + 1 ovo mexido",
      "Chips de batata doce (150 g)",
      "2 ovos cozidos + 3 col. (sopa) de arroz integral + feijão cozido só com coentro ou salsinha (1 col. de sopa) + salada verde (1 pires) + guacamole (2 col. de sopa)",
      "Cookies de banana",
      "1 goiaba madura",
      "Salada verde com cubos de batata yacon + 150 g de peixe grelhado (limão, sal, pimenta preta e alho)",
      "Chá de hortelã (200 ml) + 6 castanhas de caju",
    ]),
    menuDay(5, [
      "1 fatia de melão (80 g) + 1 fatia fina de abacaxi + 1 col. de sopa de farinha de linhaça + 1 col. de chá de limão",
      "Omelete nutritivo com cenoura e pimentão",
      "1 peito de frango grelhado (120 g) + legumes assados com pesto de manjericão",
      "Pudim de leite de coco com chia",
      "Carpaccio de maçã com canela",
      "Bolinho de aipim + 1 filé de frango grelhado com temperos naturais",
      "1 kiwi maduro",
    ]),
    menuDay(6, [
      "Suco rosa + 1 ovo cozido com orégano",
      "Melancia picada com hortelã (1 pires cheio)",
      "Hambúrguer de quinoa + 4 col. (sopa) de arroz integral",
      "Smoothie de pera e abacate",
      "1 ovo mexido ou cozido + pesto de manjericão",
      "Crepioca recheada",
      "1 goiaba",
    ]),
    menuDay(
      7,
      [
        "1 aveioca",
        "1 fatia de melão + 6 castanhas",
        "Peixe grelhado (120 g) + torta de legumes e palmito",
        "Smoothie de manga e coco",
        "Chips de batata doce + 2 claras cozidas",
        "Pizza de massa de couve-flor",
        "8 morangos maduros",
      ],
      {
        title: "Fim da semana 1",
        notice:
          "Check-in semanal: se quiser, anote peso e cintura para comparar com o início. A lista de compras da semana 2 já está disponível.",
      }
    ),

    // ===== Semana 2 =====
    menuDay(8, [
      "1 laranja com bagaço + 1/2 mamão papaia + 1 ovo cozido",
      "Aipim cozido",
      "Peixe assado + purê de batata-baroa + salada de alface",
      "Pãozinho de batata doce",
      "Vitamina de morango",
      "Creme de inhame com brócolis",
      "Shake de banana",
    ]),
    menuDay(9, [
      "Chá rosa + 6 morangos + 1 col. (sopa) de farinha de linhaça dourada + 1 ovo mexido",
      "Pão de queijo de frigideira",
      "Torta de grão-de-bico + omelete de palmito",
      "Mingau de aveia",
      "Melancia + castanhas",
      "Sopa de ervilha",
      "Pipoca na água + azeite extra virgem",
    ]),
    menuDay(10, [
      "Suco amarelo",
      "Ovos mexidos (2 claras + 1 gema)",
      "Nuggets de frango",
      "Pãozinho de batata doce + maionese de quinoa",
      "Salada de grão-de-bico, tomate e manjericão",
      "Panqueca verde + salada verde",
      "Shake de banana",
    ]),
    menuDay(11, [
      "Suco branco",
      "Panqueca de batata doce",
      "Salpicão de frango",
      "Kiwi + mel + canela em pó",
      "Banana nanica assada com canela",
      "Cuscuz marroquino com legumes (ou quinoa) + 6 ovos de codorna",
      "Pipoca na água + azeite extra virgem",
    ]),
    menuDay(12, [
      "Smoothie de laranja",
      "Aipim cozido com azeite",
      "Filé de peixe ao molho de laranja com arroz com lentilha",
      "Cookies de banana com cacau",
      "Uvas + 6 castanhas de caju natural",
      "Omelete de tomate",
      "Doce de tâmaras",
    ]),
    menuDay(13, [
      "Suco branco 2",
      "Ovo cozido ou mexido (orégano para realçar o sabor)",
      "Macarrão com molho fake de queijo",
      "Iogurte desnatado com pasta de amendoim e granola",
      "Doce de chocolate",
      "Escondidinho de frango com abóbora",
      "Brigadeiro de inhame",
    ]),
    menuDay(
      14,
      [
        "Panqueca de amêndoas com recheio de banana com canela",
        "Melão + 2 castanhas-do-Pará + chia",
        "Nhoque de banana-da-terra com camarões",
        "Smoothie de manga e coco",
        "Chips de batata doce",
        "Omelete de legumes ou de cogumelos",
        "Coco em pedaços",
      ],
      {
        title: "Véspera da avaliação",
        notice:
          "Amanhã é a avaliação final. Separe a mesma roupa das fotos do dia 1 e, se puder, deixe a balança e a fita métrica à mão.",
      }
    ),
    {
      day: 15,
      type: "avaliacao",
      title: "Avaliação final",
      notice:
        "Hoje é dia de avaliação. Não precisa seguir um cardápio novo: repita um dia que você gostou e registre suas medidas finais.",
      rules: [
        "Pesar e anotar o peso",
        "Medir a cintura",
        "Tirar foto de frente e de lado (mesma roupa do dia 1)",
        "Repetir um cardápio de um dia que você gostou",
      ],
      // Se o dono do app quiser definir um cardápio próprio para o dia 15,
      // basta preencher `meals: menu(15, [...])` aqui (7 itens, na ordem dos SLOTS)
      // ou trocar `type` para "refeicoes" e informar as refeições.
    },
  ],
};
