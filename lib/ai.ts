import { getSetting, getSettings } from "./settings";

export type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

export type AiResult = { text: string; provider: "groq" | "custom" | "openai" };

type Provider = {
  name: AiResult["provider"];
  base: string;
  key: string;
  model: string;
  paid: boolean;
};

// Ordem fixa: grátis primeiro, paga por último.
async function providers(): Promise<Provider[]> {
  const s = await getSettings([
    "ai_groq_key",
    "ai_groq_model",
    "ai_custom_key",
    "ai_custom_base",
    "ai_custom_model",
    "openai_key",
  ]);
  const list: Provider[] = [];
  if (s.ai_groq_key) {
    list.push({
      name: "groq",
      base: "https://api.groq.com/openai/v1",
      key: s.ai_groq_key,
      model: s.ai_groq_model || "openai/gpt-oss-120b",
      paid: false,
    });
  }
  if (s.ai_custom_key && s.ai_custom_base) {
    list.push({
      name: "custom",
      base: s.ai_custom_base.replace(/\/$/, ""),
      key: s.ai_custom_key,
      model: s.ai_custom_model || "default",
      paid: false,
    });
  }
  if (s.openai_key) {
    list.push({
      name: "openai",
      base: "https://api.openai.com/v1",
      key: s.openai_key,
      model: "gpt-4o-mini",
      paid: true,
    });
  }
  return list;
}

async function callOne(p: Provider, messages: ChatMsg[], maxTokens: number): Promise<string> {
  const res = await fetch(`${p.base}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${p.key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: p.model, messages, max_tokens: maxTokens, temperature: 0.7 }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`${p.name} falhou (${res.status}): ${t.slice(0, 120)}`);
  }
  const json = await res.json();
  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error(`${p.name} sem resposta.`);
  return text;
}

// Tenta Groq → Extra → OpenAI. Retorna texto + quem respondeu.
export async function aiChatWithFallback(
  messages: ChatMsg[],
  maxTokens = 600
): Promise<AiResult> {
  const list = await providers();
  if (!list.length) {
    throw new Error("Nenhuma IA configurada. Ajuste em /admin/integracoes.");
  }
  const errors: string[] = [];
  for (const p of list) {
    try {
      // Modelos de raciocínio (ex: gpt-oss) gastam tokens pensando: piso maior
      const budget = p.name === "groq" ? Math.max(maxTokens, 1500) : maxTokens;
      const text = await callOne(p, messages, budget);
      return { text, provider: p.name };
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }
  throw new Error(`Todas as IAs falharam: ${errors.join(" | ").slice(0, 200)}`);
}

// Compat: só o texto (cadeia completa).
export async function aiChat(messages: ChatMsg[], _model = "gpt-4o-mini"): Promise<string> {
  return (await aiChatWithFallback(messages)).text;
}
