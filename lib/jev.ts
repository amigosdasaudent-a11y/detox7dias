// Cliente JEV IA - SOMENTE SERVIDOR (nunca exponha a key no navegador)
// Docs: https://www.jevai.org/docs
// Base: POST https://www.jevai.org/api/v1/decisions/*
// Auth: Authorization: Bearer $JEV_API_KEY
// Retorno: { code, message, data } - code 0 = sucesso

const JEV_BASE = process.env.JEV_BASE_URL || "https://www.jevai.org";
const JEV_KEY = process.env.JEV_API_KEY!;

type JevResponse<T> = {
  code: number;
  message: string;
  data: T;
};

async function jevPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${JEV_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${JEV_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`JEV ${path} falhou: ${res.status}`);
  const json = (await res.json()) as JevResponse<T>;
  if (json.code !== 0) throw new Error(`JEV erro: ${json.message}`);
  return json.data;
}

// 1. Guard para o IMC: decide se pode gerar plano ou deve bloquear/encaminhar
export type JevImcGuard = {
  decision: "allow" | "confirm" | "review" | "deny";
  confidence: number;
  probabilities: Record<string, number>;
  guidance: string;
};

export async function jevGuardImc(input: {
  age: number;
  imc: number;
  classification: string;
  goal: string;
  restrictions: string;
  hasRiskSignals: boolean;
}) {
  const { age, imc, classification, goal, restrictions, hasRiskSignals } =
    input;

  return jevPost<JevImcGuard>("/api/v1/decisions/tool-guard", {
    tool: "generate_meal_plan",
    action: `Gerar plano alimentar de exemplo para IMC ${imc} (${classification}), idade ${age}, objetivo ${goal}`,
    arguments_summary: [
      `age=${age}`,
      `imc=${imc}`,
      `classification=${classification}`,
      `goal=${goal}`,
      `restrictions=${restrictions || "nenhuma"}`,
    ],
    side_effects: ["Orienta comportamento alimentar do usuário"],
    safeguards: hasRiskSignals
      ? ["SINAIS DE RISCO DETECTADOS - exigir avaliação profissional"]
      : ["Aviso informativo + sem promessa de resultado"],
    policy: [
      "Menores de 18: deny, encaminhar pediatra/nutricionista",
      "IMC < 18.5: deny plano de redução, recomendar avaliação profissional",
      "Sem jejum prolongado, sem laxantes/diuréticos, sem dietas muito restritivas",
    ],
    reversibility: "reversible",
  });
}

// 2. Decisão genérica (choice/score/noul) - para quiz, conclusão de desafio, etc.
export async function jevDecide<T = Record<string, unknown>>(state: Record<string, unknown>, questions: Record<string, unknown>): Promise<T> {
  const data = await jevPost<{ answers: T }>("/api/v1/decisions", {
    state,
    questions,
  });
  return data.answers;
}
