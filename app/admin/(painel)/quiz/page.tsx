"use client";

import { useEffect, useState } from "react";

type Option = { id: string; label: string; sort_order: number };
type Question = {
  id: string;
  question: string;
  sort_order: number;
  active: boolean;
  quiz_options: Option[];
};

export default function QuizAdminPage() {
  const [items, setItems] = useState<Question[]>([]);
  const [newOpt, setNewOpt] = useState<Record<string, string>>({});

  async function load() {
    const res = await fetch("/api/admin/quiz");
    if (res.status === 401) return (window.location.href = "/admin/login");
    const json = await res.json();
    setItems(json.questions || []);
  }
  useEffect(() => {
    load();
  }, []);

  async function patch(id: string, fields: object) {
    await fetch("/api/admin/quiz", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...fields }),
    });
    load();
  }

  async function addQuestion() {
    const res = await fetch("/api/admin/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "Nova pergunta" }),
    });
    if (res.ok) load();
  }

  async function removeQuestion(id: string) {
    if (!confirm("Excluir pergunta e alternativas?")) return;
    await fetch(`/api/admin/quiz?id=${id}`, { method: "DELETE" });
    load();
  }

  async function addOption(qid: string) {
    const label = (newOpt[qid] || "").trim();
    if (!label) return;
    await fetch("/api/admin/quiz/options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question_id: qid, label }),
    });
    setNewOpt((p) => ({ ...p, [qid]: "" }));
    load();
  }

  async function removeOption(id: string) {
    await fetch(`/api/admin/quiz/options?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Quiz</h1>
          <p className="text-sm text-neutral-500">Edite as perguntas e alternativas do quiz de entrada.</p>
        </div>
        <button onClick={addQuestion} className="rounded-xl bg-[#FF4D8D] px-4 py-2 text-sm font-bold text-white">
          + Adicionar pergunta
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {items.map((q, i) => (
          <div key={q.id} className="rounded-2xl bg-white p-5 shadow">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold">Pergunta {i + 1}</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => patch(q.id, { active: !q.active })}
                  className={`relative h-6 w-11 rounded-full ${q.active ? "bg-emerald-500" : "bg-neutral-300"}`}
                  title={q.active ? "Desativar" : "Ativar"}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${q.active ? "left-[22px]" : "left-0.5"}`} />
                </button>
                <button onClick={() => removeQuestion(q.id)} className="text-red-500" title="Excluir">🗑</button>
              </div>
            </div>
            <input
              className="mt-3 w-full rounded-xl bg-[#FFF0F5] px-4 py-2 text-sm"
              defaultValue={q.question}
              key={q.question}
              onBlur={(e) => {
                if (e.target.value.trim() && e.target.value !== q.question) {
                  patch(q.id, { question: e.target.value.trim() });
                }
              }}
            />
            <p className="mt-3 text-sm font-semibold">Alternativas</p>
            <div className="mt-2 flex flex-col gap-2">
              {q.quiz_options?.map((o) => (
                <div key={o.id} className="flex items-center gap-2">
                  <input
                    className="w-full rounded-xl bg-[#FFF0F5] px-4 py-2 text-sm"
                    defaultValue={o.label}
                    key={o.label}
                    onBlur={(e) => {
                      if (e.target.value.trim() && e.target.value !== o.label) {
                        fetch("/api/admin/quiz/options", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: o.id, label: e.target.value.trim() }),
                        }).then(() => load());
                      }
                    }}
                  />
                  <button onClick={() => removeOption(o.id)} className="text-red-500" title="Excluir">🗑</button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input
                  className="w-full rounded-xl border border-dashed px-4 py-2 text-sm"
                  placeholder="+ Adicionar alternativa"
                  value={newOpt[q.id] || ""}
                  onChange={(e) => setNewOpt((p) => ({ ...p, [q.id]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addOption(q.id);
                    }
                  }}
                />
                <button onClick={() => addOption(q.id)} className="rounded-xl bg-neutral-100 px-3 py-2 text-sm font-bold">
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {items.length === 0 && <p className="mt-6 text-sm text-neutral-500">Nenhuma pergunta.</p>}
    </div>
  );
}
