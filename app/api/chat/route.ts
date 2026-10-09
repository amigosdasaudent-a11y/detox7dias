import { NextResponse } from "next/server";
import { aiChat } from "@/lib/ai";

const SYSTEM = `Você é a assistente de vendas do programa Detox Body Max (14 dias: e-books com cardápios e receitas, áudios, vídeos e calculadora de IMC, tudo num app no celular).
Fale em português do Brasil, tom acolhedor e objetivo, respostas curtas (até 3 frases).
Planos: Essencial R$ 29,90/mês (guia + cardápio + IMC); Completo 12x R$ 19,90 (tudo + áudios e vídeos); Vitalício 12x R$ 21,90 (tudo, para sempre). Garantia de 30 dias. Acesso chega por e-mail após o pagamento.
Regras: nunca prometa emagrecimento em prazo, cura ou "eliminar toxinas"; não prescreva dieta (diga que o cardápio está no app); gestantes, lactantes, menores, diabetes ou em tratamento: oriente a falar com médico antes. Sem links inventados: para comprar, oriente a clicar nos botões da página. Conteúdo informativo, não substitui médico/nutricionista.`;

// POST /api/chat { messages: [{role, content}] } — rate simples por IP via payload limitado
export async function POST(req: Request) {
  const { messages } = (await req.json().catch(() => ({}))) as {
    messages?: { role: string; content: string }[];
  };
  const clean = (messages || [])
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-8)
    .map((m) => ({ role: m.role as "user" | "assistant", content: String(m.content).slice(0, 500) }));
  if (!clean.length || clean[clean.length - 1].role !== "user") {
    return NextResponse.json({ error: "mensagem inválida" }, { status: 400 });
  }
  try {
    const reply = await aiChat([{ role: "system", content: SYSTEM }, ...clean]);
    return NextResponse.json({ reply });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "falha na IA" },
      { status: 500 }
    );
  }
}
