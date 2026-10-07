"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Q = {
  id: string;
  question: string;
  quiz_options: { id: string; label: string }[];
};

export default function QuizForm({ questions }: { questions: Q[] }) {
  const router = useRouter();
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (Object.keys(picked).length < questions.length) {
      return setMsg("Responda todas as perguntas para continuar.");
    }
    setLoading(true);
    const res = await fetch("/api/quiz/answers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers: Object.entries(picked).map(([question_id, option_id]) => ({
          question_id,
          option_id,
        })),
      }),
    });
    setLoading(false);
    if (!res.ok) return setMsg("Falha ao salvar. Tente de novo.");
    router.push("/inicio");
  }

  return (
    <form onSubmit={submit} className="mt-6 flex flex-col gap-5">
      {questions.map((q, i) => (
        <div key={q.id} className="rounded-3xl bg-white p-5 shadow">
          <p className="font-semibold">
            {i + 1}. {q.question}
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {q.quiz_options.map((o) => (
              <label
                key={o.id}
                className={`cursor-pointer rounded-xl border px-4 py-2 text-sm ${picked[q.id] === o.id ? "border-[#FF4D8D] bg-[#FFF0F5]" : ""}`}
              >
                <input
                  type="radio"
                  name={q.id}
                  className="mr-2"
                  checked={picked[q.id] === o.id}
                  onChange={() => setPicked((p) => ({ ...p, [q.id]: o.id }))}
                />
                {o.label}
              </label>
            ))}
          </div>
        </div>
      ))}
      <button disabled={loading} className="rounded-full bg-[#FF4D8D] py-3 font-semibold text-white disabled:opacity-50">
        {loading ? "Salvando..." : "Concluir e entrar"}
      </button>
      {msg && <p className="text-sm text-red-600">{msg}</p>}
    </form>
  );
}
