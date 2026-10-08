import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isAdminToken } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";

async function guard() {
  const store = await cookies();
  return isAdminToken(store.get(ADMIN_COOKIE)?.value);
}

// GET -> perguntas com alternativas
export async function GET() {
  if (!(await guard())) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("quiz_questions")
    .select("id, question, sort_order, active, quiz_options(id, label, sort_order)")
    .order("sort_order");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ questions: data });
}

// POST { question } -> nova pergunta
export async function POST(req: Request) {
  if (!(await guard())) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  const { question } = await req.json();
  if (!question?.trim()) {
    return NextResponse.json({ error: "pergunta vazia" }, { status: 400 });
  }
  const supabase = createServiceClient();
  const { data: max } = await supabase
    .from("quiz_questions")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();
  const { data, error } = await supabase
    .from("quiz_questions")
    .insert({ question: question.trim(), sort_order: (max?.sort_order ?? -1) + 1 })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ question: data });
}

// PATCH { id, question?, active?, sort_order? }
export async function PATCH(req: Request) {
  if (!(await guard())) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  const { id, ...fields } = await req.json();
  if (!id) return NextResponse.json({ error: "sem id" }, { status: 400 });
  const supabase = createServiceClient();
  const { error } = await supabase.from("quiz_questions").update(fields).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE ?id=
export async function DELETE(req: Request) {
  if (!(await guard())) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "sem id" }, { status: 400 });
  const supabase = createServiceClient();
  const { error } = await supabase.from("quiz_questions").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
