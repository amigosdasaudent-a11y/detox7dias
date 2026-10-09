import { getSetting } from "./settings";

export type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

async function openaiKey(): Promise<string> {
  const key = await getSetting("openai_key");
  if (!key) throw new Error("IA não configurada. Ajuste em /admin/integracoes.");
  return key;
}

// Chat genérico via OpenAI (modelo barato e rápido por padrão)
export async function aiChat(messages: ChatMsg[], model = "gpt-4o-mini"): Promise<string> {
  const key = await openaiKey();
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, max_tokens: 600, temperature: 0.7 }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`IA falhou (${res.status}): ${t.slice(0, 120)}`);
  }
  const json = await res.json();
  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("IA sem resposta. Tente de novo.");
  return text;
}
