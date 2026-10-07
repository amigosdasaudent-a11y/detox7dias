import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import QuizForm from "./QuizForm";

export const dynamic = "force-dynamic";

export default async function QuizPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("id, question, quiz_options(id, label)")
    .eq("active", true)
    .order("sort_order");

  if (!questions?.length) {
    return (
      <div className="mx-auto w-full max-w-xl flex-1 px-6 py-10 text-center">
        <h1 className="text-2xl font-bold">Quiz em breve</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Nenhuma pergunta ativa. Fale com o admin.
        </p>
        <a href="/inicio" className="mt-6 inline-block rounded-full bg-[#FF4D8D] px-6 py-2 font-semibold text-white">
          Ir para o Início
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl flex-1 px-6 py-10">
      <h1 className="text-2xl font-bold">Suas primeiras 5 perguntas ✨</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Isso personaliza seu início no programa.
      </p>
      <QuizForm questions={questions} />
    </div>
  );
}
