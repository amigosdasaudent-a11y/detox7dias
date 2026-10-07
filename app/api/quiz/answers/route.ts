import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/quiz/answers { answers: [{ question_id, option_id }] }
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "login necessário" }, { status: 401 });

  const { answers } = (await req.json().catch(() => ({}))) as {
    answers?: { question_id: string; option_id: string }[];
  };
  if (!answers?.length) {
    return NextResponse.json({ error: "sem respostas" }, { status: 400 });
  }
  const rows = answers.map((a) => ({
    user_id: user.id,
    question_id: a.question_id,
    option_id: a.option_id,
  }));
  const { error } = await supabase.from("quiz_answers").upsert(rows, {
    onConflict: "user_id,question_id",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase
    .from("profiles")
    .update({ quiz_completed: true })
    .eq("id", user.id);
  return NextResponse.json({ ok: true });
}
