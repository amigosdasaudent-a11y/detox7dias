import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProgram } from "@/lib/programs";
import { imcValue } from "@/lib/imc";

const SYMPTOMS = [
  "Dor de cabeça",
  "Mal-estar",
  "Tremedeira",
  "Enjoo",
  "Diarreia",
  "Irritabilidade",
  "Nenhum",
];

function numIn(v: unknown, min: number, max: number): number | null {
  const n = Number(v);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return Math.round(n * 10) / 10;
}

function intIn(v: unknown, min: number, max: number): number | null {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return n;
}

function dateOnly(v: unknown): string | null {
  const s = String(v || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : s;
}

function isoOrNull(v: unknown): string | null {
  if (!v) return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function textOrNull(v: unknown, max = 500): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s ? s.slice(0, max) : null;
}

function sanitizeCounters(raw: unknown): Record<string, unknown> {
  const src = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  if ("water" in src) out.water = intIn(src.water, 0, 40) ?? 0;
  if ("eggs" in src) out.eggs = intIn(src.eggs, 0, 40) ?? 0;
  if ("apples" in src) out.apples = intIn(src.apples, 0, 40) ?? 0;
  if (Array.isArray(src.eggTimes)) {
    out.eggTimes = src.eggTimes
      .filter((t) => typeof t === "string" && !Number.isNaN(Date.parse(t)))
      .slice(-40);
  }
  if (Array.isArray(src.rules)) {
    out.rules = src.rules.filter((r) => typeof r === "number" && r >= 0 && r < 40).slice(0, 40);
  }
  return out;
}

async function loadUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

async function hasActiveAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("entitlements")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1)
    .single();
  return Boolean(data);
}

// GET /api/acompanhamento?program=detox-7 -> estado completo do usuário no programa
export async function GET(req: Request) {
  const { supabase, user } = await loadUser();
  if (!user) return NextResponse.json({ error: "login necessário" }, { status: 401 });
  if (!(await hasActiveAccess(supabase, user.id))) {
    return NextResponse.json({ error: "sem acesso ativo" }, { status: 403 });
  }
  const program = getProgram(new URL(req.url).searchParams.get("program"));
  if (!program) return NextResponse.json({ error: "programa inválido" }, { status: 400 });

  const [enrollment, screening, measures, progress, checkins] = await Promise.all([
    supabase
      .from("program_enrollments")
      .select("*")
      .eq("user_id", user.id)
      .eq("program_id", program.id)
      .maybeSingle(),
    supabase
      .from("program_screenings")
      .select("*")
      .eq("user_id", user.id)
      .eq("program_id", program.id)
      .maybeSingle(),
    supabase
      .from("program_measures")
      .select("*")
      .eq("user_id", user.id)
      .eq("program_id", program.id)
      .order("created_at"),
    supabase
      .from("program_day_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("program_id", program.id),
    supabase
      .from("program_checkins")
      .select("*")
      .eq("user_id", user.id)
      .eq("program_id", program.id)
      .order("day"),
  ]);

  return NextResponse.json({
    enrollment: enrollment.data || null,
    screening: screening.data || null,
    measures: measures.data || [],
    progress: progress.data || [],
    checkins: checkins.data || [],
  });
}

// POST /api/acompanhamento { action, program, ... }
export async function POST(req: Request) {
  const { supabase, user } = await loadUser();
  if (!user) return NextResponse.json({ error: "login necessário" }, { status: 401 });
  if (!(await hasActiveAccess(supabase, user.id))) {
    return NextResponse.json({ error: "sem acesso ativo" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const program = getProgram(String(body.program || ""));
  if (!program) return NextResponse.json({ error: "programa inválido" }, { status: 400 });
  const action = String(body.action || "");

  const { data: enrollment } = await supabase
    .from("program_enrollments")
    .select("*")
    .eq("user_id", user.id)
    .eq("program_id", program.id)
    .maybeSingle();

  if (action === "triagem") {
    const raw = (body.answers && typeof body.answers === "object" ? body.answers : {}) as Record<
      string,
      unknown
    >;
    const answers: Record<string, boolean> = {};
    for (const q of program.screening.questions) answers[q.key] = raw[q.key] === true;

    const blocked = program.screening.questions.some((q) => q.block && answers[q.key]);
    const needsConfirm = program.screening.questions.some(
      (q) => q.requiresConfirmation && answers[q.key]
    );
    const confirmed = body.confirmed === true;
    const approved = !blocked && (!needsConfirm || confirmed);
    const status = blocked
      ? "bloqueado"
      : needsConfirm && !confirmed
        ? "confirmacao_pendente"
        : needsConfirm
          ? "liberado_com_aviso"
          : "liberado";

    const { error } = await supabase.from("program_screenings").upsert(
      {
        user_id: user.id,
        program_id: program.id,
        answers,
        approved,
        status,
      },
      { onConflict: "user_id,program_id" }
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ approved, status });
  }

  if (action === "iniciar") {
    const { data: screening } = await supabase
      .from("program_screenings")
      .select("approved")
      .eq("user_id", user.id)
      .eq("program_id", program.id)
      .maybeSingle();
    if (!screening?.approved) {
      return NextResponse.json({ error: "triagem não aprovada" }, { status: 403 });
    }

    const startDate = dateOnly(body.startDate);
    const heightCm = numIn(body.heightCm, 100, 250);
    const weightKg = numIn(body.weightKg, 20, 300);
    const waistCm = numIn(body.waistCm, 30, 200);
    if (!startDate) return NextResponse.json({ error: "data de início inválida" }, { status: 400 });
    if (!heightCm || !weightKg) {
      return NextResponse.json({ error: "altura e peso são obrigatórios" }, { status: 400 });
    }
    const imc = imcValue(weightKg, heightCm);
    if (imc < 18.5) {
      return NextResponse.json(
        {
          error:
            "Seu IMC está abaixo de 18,5. Por segurança, o desafio de 7 dias não deve ser iniciado. Procure um médico ou nutricionista.",
          blocked: true,
        },
        { status: 422 }
      );
    }

    const { error: mErr } = await supabase.from("program_measures").upsert(
      {
        user_id: user.id,
        program_id: program.id,
        moment: "inicio",
        height_cm: heightCm,
        weight_kg: weightKg,
        waist_cm: waistCm,
        photo_front_path: textOrNull(body.photoFrontPath, 300),
        photo_side_path: textOrNull(body.photoSidePath, 300),
        imc,
      },
      { onConflict: "user_id,program_id,moment" }
    );
    if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 });

    const { error: eErr } = await supabase.from("program_enrollments").upsert(
      {
        user_id: user.id,
        program_id: program.id,
        start_date: startDate,
        status: "ativo",
        egg_intolerance: body.eggIntolerance === true,
        wake_time: textOrNull(body.wakeTime, 5),
        sleep_time: textOrNull(body.sleepTime, 5),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,program_id" }
    );
    if (eErr) return NextResponse.json({ error: eErr.message }, { status: 500 });
    return NextResponse.json({ ok: true, imc });
  }

  if (action === "sintoma") {
    const { error } = await supabase.from("program_symptom_logs").insert({
      user_id: user.id,
      program_id: program.id,
      day: intIn(body.day, 1, program.durationDays),
      symptom: textOrNull(body.symptom, 200) || "mal-estar",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Ações abaixo exigem inscrição ativa.
  if (!enrollment) {
    return NextResponse.json({ error: "inscrição não encontrada" }, { status: 403 });
  }

  if (action === "progresso") {
    const day = intIn(body.day, 1, program.durationDays);
    if (!day) return NextResponse.json({ error: "dia inválido" }, { status: 400 });
    const meals = Array.isArray(body.meals)
      ? body.meals.filter((m): m is string => typeof m === "string").slice(0, 20)
      : [];
    const { error } = await supabase.from("program_day_progress").upsert(
      {
        user_id: user.id,
        program_id: program.id,
        day,
        meals,
        counters: sanitizeCounters(body.counters),
        fasting_started_at: isoOrNull(body.fastingStartedAt),
        fasting_ended_at: isoOrNull(body.fastingEndedAt),
        completed: body.completed === true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,program_id,day" }
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "checkin") {
    const day = intIn(body.day, 1, program.durationDays);
    if (!day) return NextResponse.json({ error: "dia inválido" }, { status: 400 });
    const symptoms = Array.isArray(body.symptoms)
      ? body.symptoms
          .filter((s): s is string => typeof s === "string" && SYMPTOMS.includes(s))
          .slice(0, SYMPTOMS.length)
      : [];
    const { error } = await supabase.from("program_checkins").upsert(
      {
        user_id: user.id,
        program_id: program.id,
        day,
        weight_kg: numIn(body.weightKg, 20, 300),
        waist_cm: numIn(body.waistCm, 30, 200),
        water_cups: intIn(body.waterCups, 0, 40),
        sleep: intIn(body.sleep, 1, 5),
        energy: intIn(body.energy, 1, 5),
        mood: intIn(body.mood, 1, 5),
        symptoms,
        note: textOrNull(body.note, 1000),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,program_id,day" }
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "medidas") {
    const weightKg = numIn(body.weightKg, 20, 300);
    const waistCm = numIn(body.waistCm, 30, 200);
    if (!weightKg) return NextResponse.json({ error: "peso inválido" }, { status: 400 });

    const { data: inicio } = await supabase
      .from("program_measures")
      .select("height_cm")
      .eq("user_id", user.id)
      .eq("program_id", program.id)
      .eq("moment", "inicio")
      .maybeSingle();
    const heightFromStart = inicio?.height_cm ? Number(inicio.height_cm) : null;
    const heightCm = numIn(body.heightCm, 100, 250) ?? heightFromStart;
    const imc = heightCm ? imcValue(weightKg, heightCm) : null;

    const { error } = await supabase.from("program_measures").upsert(
      {
        user_id: user.id,
        program_id: program.id,
        moment: "fim",
        height_cm: heightCm,
        weight_kg: weightKg,
        waist_cm: waistCm,
        photo_front_path: textOrNull(body.photoFrontPath, 300),
        photo_side_path: textOrNull(body.photoSidePath, 300),
        imc,
      },
      { onConflict: "user_id,program_id,moment" }
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase
      .from("program_enrollments")
      .update({ status: "concluido", updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("program_id", program.id);
    return NextResponse.json({ ok: true, imc });
  }

  if (action === "pausar") {
    const { error } = await supabase
      .from("program_enrollments")
      .update({ status: "pausado", updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("program_id", program.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "retomar") {
    const { error } = await supabase
      .from("program_enrollments")
      .update({ status: "ativo", updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("program_id", program.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "ação inválida" }, { status: 400 });
}
