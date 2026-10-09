"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Hist = {
  id: string;
  weight_kg: number;
  height_cm: number;
  age: number;
  imc: number;
  classification: string;
  created_at: string;
};

export default function ImcPage() {
  const [w, setW] = useState("");
  const [h, setH] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("feminino");
  const [goalSel, setGoalSel] = useState("Organizar a rotina alimentar");
  const [goalCustom, setGoalCustom] = useState("");
  const [restrSel, setRestrSel] = useState("Nenhuma");
  const [restrCustom, setRestrCustom] = useState("");
  const goal = goalSel === "outro" ? goalCustom : goalSel;
  const restr = restrSel === "outra" ? restrCustom : restrSel === "Nenhuma" ? "" : restrSel;
  const [result, setResult] = useState<{ imc: number; classification: string; plan: string } | null>(null);
  const [hist, setHist] = useState<Hist[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadHist() {
    const res = await fetch("/api/imc");
    if (res.status === 401) return (window.location.href = "/login");
    const json = await res.json();
    setHist(json.history || []);
  }
  useEffect(() => {
    loadHist();
  }, []);

  async function calc(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    setResult(null);
    const res = await fetch("/api/imc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        weight_kg: Number(w),
        height_cm: Number(h),
        age: Number(age),
        sex,
        goal,
        restrictions: restr,
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) return setMsg(json.error || "falha. Tente de novo.");
    setResult(json);
    loadHist();
  }

  const pos = result ? Math.max(0, Math.min(100, ((result.imc - 15) / 25) * 100)) : 0;

  return (
    <div className="mx-auto w-full max-w-xl flex-1 px-4 py-6 md:px-8">
      <h1 className="text-2xl font-extrabold">⚖️ Meu IMC</h1>
      <form onSubmit={calc} className="mt-4 rounded-3xl bg-white p-6 shadow">
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm font-semibold">
            Peso (kg)
            <input required type="number" min={20} max={300} step="0.1" className="mt-1 w-full rounded-xl border px-4 py-2 font-normal" value={w} onChange={(e) => setW(e.target.value)} />
          </label>
          <label className="text-sm font-semibold">
            Altura (cm)
            <input required type="number" min={100} max={250} className="mt-1 w-full rounded-xl border px-4 py-2 font-normal" value={h} onChange={(e) => setH(e.target.value)} />
          </label>
          <label className="text-sm font-semibold">
            Idade
            <input required type="number" min={1} max={120} className="mt-1 w-full rounded-xl border px-4 py-2 font-normal" value={age} onChange={(e) => setAge(e.target.value)} />
          </label>
          <label className="text-sm font-semibold">
            Sexo
            <select className="mt-1 w-full rounded-xl border px-4 py-2 font-normal" value={sex} onChange={(e) => setSex(e.target.value)}>
              <option value="feminino">Feminino</option>
              <option value="masculino">Masculino</option>
              <option value="outro">Outro</option>
            </select>
          </label>
        </div>
        <label className="mt-3 block text-sm font-semibold">
          Objetivo
          <select className="mt-1 w-full rounded-xl border px-4 py-2 font-normal" value={goalSel} onChange={(e) => setGoalSel(e.target.value)}>
            <option>Organizar a rotina alimentar</option>
            <option>Criar hábitos mais saudáveis</option>
            <option>Ter mais energia</option>
            <option>Seguir um cardápio pronto</option>
            <option>Reduzir medidas</option>
            <option value="outro">Outro (digitar)</option>
          </select>
          {goalSel === "outro" && (
            <input className="mt-2 w-full rounded-xl border px-4 py-2 font-normal" placeholder="Qual seu objetivo?" value={goalCustom} onChange={(e) => setGoalCustom(e.target.value)} />
          )}
        </label>
        <label className="mt-3 block text-sm font-semibold">
          Restrições alimentares
          <select className="mt-1 w-full rounded-xl border px-4 py-2 font-normal" value={restrSel} onChange={(e) => setRestrSel(e.target.value)}>
            <option>Nenhuma</option>
            <option>Vegetariano</option>
            <option>Vegano</option>
            <option>Sem lactose</option>
            <option>Sem glúten</option>
            <option value="outra">Outra (digitar)</option>
          </select>
          {restrSel === "outra" && (
            <input className="mt-2 w-full rounded-xl border px-4 py-2 font-normal" placeholder="Qual restrição?" value={restrCustom} onChange={(e) => setRestrCustom(e.target.value)} />
          )}
        </label>
        <button disabled={loading} className="mt-4 w-full rounded-full bg-[#FF4D8D] py-2 font-semibold text-white disabled:opacity-50">
          {loading ? "Calculando..." : "Calcular IMC e gerar plano"}
        </button>
        {msg && <p className="mt-3 text-sm text-red-600">{msg}</p>}
      </form>

      {result && (
        <div className="mt-4 rounded-3xl bg-white p-6 shadow">
          <p className="text-center text-4xl font-extrabold">{String(result.imc).replace(".", ",")}</p>
          <p className="text-center text-sm text-neutral-500">{result.classification}</p>
          <div className="mt-3 h-3.5 rounded-full" style={{ background: "linear-gradient(90deg,#60A5FA 0 18%,#10B981 18% 45%,#FBBF24 45% 65%,#F87171 65%)" }}>
            <div className="h-6 w-1.5 rounded bg-neutral-800" style={{ marginLeft: `calc(${pos}% - 3px)`, marginTop: -5 }} />
          </div>
          <div className="mt-4 text-sm text-neutral-800">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => <p className="mt-3 text-base font-extrabold">🍽 {children}</p>,
                h2: ({ children }) => <p className="mt-3 text-base font-extrabold">🍽 {children}</p>,
                h3: ({ children }) => <p className="mt-2 font-bold">✅ {children}</p>,
                p: ({ children }) => <p className="mt-2 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="mt-3 flex flex-col gap-3">{children}</ul>,
                ol: ({ children }) => <ol className="mt-2 flex list-decimal flex-col gap-1.5 pl-5">{children}</ol>,
                li: ({ children }) => <li className="rounded-xl bg-[#FFF5F7] px-4 py-3">{children}</li>,
                strong: ({ children }) => <strong className="font-bold text-neutral-900">{children}</strong>,
                hr: () => <hr className="my-3 border-neutral-200" />,
                table: ({ children }) => <div className="overflow-x-auto">{children}</div>,
              }}
            >
              {result.plan}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {hist.length > 0 && (
        <div className="mt-6">
          <h2 className="font-bold">Meu histórico</h2>
          <div className="mt-2 flex flex-col gap-2">
            {hist.map((x) => (
              <div key={x.id} className="flex items-center justify-between rounded-2xl bg-white p-3 text-sm shadow">
                <span className="font-bold">{String(x.imc).replace(".", ",")} <span className="font-normal text-neutral-500">({x.classification})</span></span>
                <span className="text-xs text-neutral-500">
                  {new Date(x.created_at).toLocaleDateString("pt-BR")} • {x.weight_kg}kg
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
