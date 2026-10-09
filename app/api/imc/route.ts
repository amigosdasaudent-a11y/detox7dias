import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { jevGuardImc } from "@/lib/jev";
import { aiChatWithFallback } from "@/lib/ai";

function classify(imc: number): string {
  if (imc < 18.5) return "abaixo do peso";
  if (imc < 25) return "peso normal";
  if (imc < 30) return "sobrepeso";
  return "obesidade";
}

// GET /api/imc -> histórico
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "login necessário" }, { status: 401 });
  const { data } = await supabase
    .from("imc_history")
    .select("id, weight_kg, height_cm, age, imc, classification, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);
  return NextResponse.json({ history: data || [] });
}

// POST /api/imc { weight_kg, height_cm, age, sex, goal, restrictions }
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "login necessário" }, { status: 401 });
  const { data: ent } = await supabase
    .from("entitlements")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .single();
  if (!ent) return NextResponse.json({ error: "sem acesso ativo" }, { status: 403 });

  const b = (await req.json().catch(() => ({}))) as {
    weight_kg?: number;
    height_cm?: number;
    age?: number;
    sex?: string;
    goal?: string;
    restrictions?: string;
  };
  const w = Number(b.weight_kg);
  const h = Number(b.height_cm);
  const age = Number(b.age);
  if (!w || !h || !age || w < 20 || w > 300 || h < 100 || h > 250 || age < 1 || age > 120) {
    return NextResponse.json({ error: "peso/altura/idade inválidos" }, { status: 400 });
  }

  // Limite: 5 cálculos/dia
  const today = new Date().toISOString().slice(0, 10);
  const { count } = await supabase
    .from("imc_history")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", `${today}T00:00:00`);
  if ((count || 0) >= 5) {
    return NextResponse.json({ error: "limite diário atingido (5/dia). Volte amanhã." }, { status: 429 });
  }

  const imc = Math.round((w / Math.pow(h / 100, 2)) * 10) / 10;
  const classification = classify(imc);
  const goal = String(b.goal || "").slice(0, 200);
  const restrictions = String(b.restrictions || "").slice(0, 200);
  const sex = String(b.sex || "").slice(0, 20);

  // Regras rígidas (sem IA): menor de idade ou abaixo do peso não recebe plano
  if (age < 18) {
    const msg =
      "Você tem menos de 18 anos, então não gero plano alimentar. Procure um pediatra ou nutricionista com seu responsável. Conteúdo informativo, não substitui profissional.";
    await supabase.from("imc_history").insert({
      user_id: user.id, weight_kg: w, height_cm: h, age, sex, goal, restrictions,
      imc, classification, ai_plan: msg, provider: "regras",
    });
    return NextResponse.json({ imc, classification, plan: msg, blocked: true });
  }

  // Contexto do quiz (últimas respostas)
  let quizCtx = "";
  try {
    const { data: ans } = await supabase
      .from("quiz_answers")
      .select("quiz_questions(question), quiz_options(label)")
      .eq("user_id", user.id);
    if (ans?.length) {
      quizCtx =
        "Contexto do quiz: " +
        ans
          .map((a) => {
            const q = a.quiz_questions as unknown as { question?: string };
            const o = a.quiz_options as unknown as { label?: string };
            return `${q?.question || "?"} = ${o?.label || "?"}`;
          })
          .join("; ");
    }
  } catch {
    // segue sem contexto
  }

  // Guardião JEV: avalia risco antes de gerar
  let jevNote = "";
  try {
    const g = await jevGuardImc({
      age, imc, classification, goal, restrictions,
      hasRiskSignals: /compuls|culpa|vomit|restriç|restric|jejum/i.test(`${goal} ${restrictions}`),
    });
    if (g.decision === "deny") {
      const msg = `${g.guidance || "Por segurança, não vou gerar um plano agora."} Procure um médico ou nutricionista. Conteúdo informativo, não substitui profissional.`;
      await supabase.from("imc_history").insert({
        user_id: user.id, weight_kg: w, height_cm: h, age, sex, goal, restrictions,
        imc, classification, ai_plan: msg, provider: "regras",
      });
      return NextResponse.json({ imc, classification, plan: msg, blocked: true });
    }
    jevNote = ` (checagem de segurança: ${g.decision})`;
  } catch {
    jevNote = " (checagem automática indisponível; seguindo regras padrão)";
  }

  const prompt = `Você é o JEV, assistente de bem-estar do app Detox Body Max. Fale em português do Brasil, acolhedor e objetivo.
Dados: peso ${w}kg, altura ${h}cm, idade ${age}, sexo ${sex || "não informado"}, objetivo: ${goal || "não informado"}, restrições: ${restrictions || "nenhuma"}. IMC calculado: ${imc} (${classification}). ${quizCtx}
Gere um plano alimentar de EXEMPLO para 1 dia, nesta estrutura: para cada refeição (☀️ Café da manhã, 🍎 Lanche da manhã, 🍽 Almoço, 🥜 Lanche da tarde, 🌙 Jantar, 💧 Hidratação) use um item de lista com o nome da refeição em negrito, os alimentos e 1 frase curta do benefício. Termine com uma 💡 Dica e o aviso em negrito. Use SÓ títulos ##, listas com -, negrito ** e emojis — NUNCA tabelas (|), NUNCA tags <br> ou HTML, NUNCA ---.
Regras: sem promessas de resultado ou prazo; sem jejum, laxantes, diuréticos ou dietas muito restritivas; se IMC abaixo de 18,5, foque em alimentação equilibrada e recomende avaliação profissional, sem sugerir redução; termine com: "Conteúdo informativo. Não substitui médico ou nutricionista." Responda em Markdown curto.${jevNote}`;

  try {
    const { text: plan, provider } = await aiChatWithFallback([{ role: "user", content: prompt }]);
    // API paga: máximo 1 cálculo por semana (controle de custo)
    if (provider === "openai") {
      const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
      const { data: recent } = await supabase
        .from("imc_history")
        .select("id")
        .eq("user_id", user.id)
        .gte("created_at", weekAgo)
        .or("provider.eq.openai,provider.is.null")
        .limit(1);
      if (recent?.length) {
        return NextResponse.json(
          { error: "limite semanal da IA paga atingido (1/semana). Volte em alguns dias — o cálculo básico continua liberado." },
          { status: 429 }
        );
      }
    }
    await supabase.from("imc_history").insert({
      user_id: user.id, weight_kg: w, height_cm: h, age, sex, goal, restrictions,
      imc, classification, ai_plan: plan, provider,
    });
    return NextResponse.json({ imc, classification, plan, provider });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "falha na IA" },
      { status: 500 }
    );
  }
}
