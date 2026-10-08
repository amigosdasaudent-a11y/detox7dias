"use client";

import { useEffect, useState } from "react";

type Block = {
  secret: { set: boolean; last4: string };
  webhook: { set: boolean; last4: string };
  price_essencial: string;
  price_completo: string;
  price_vitalicio: string;
};

const EMPTY: Block = {
  secret: { set: false, last4: "" },
  webhook: { set: false, last4: "" },
  price_essencial: "",
  price_completo: "",
  price_vitalicio: "",
};

export default function PagamentosPage() {
  const [mode, setMode] = useState("test");
  const [test, setTest] = useState<Block>(EMPTY);
  const [live, setLive] = useState<Block>(EMPTY);
  const [form, setForm] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/payments");
    if (res.status === 401) return (window.location.href = "/admin/login");
    const json = await res.json();
    setMode(json.mode || "test");
    setTest(json.test || EMPTY);
    setLive(json.live || EMPTY);
    setForm({});
  }
  useEffect(() => {
    load();
  }, []);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function save(m: "test" | "live") {
    setLoading(true);
    setMsg("");
    const pfx = `stripe_${m}`;
    const values: Record<string, string> = {};
    for (const k of [`${pfx}_secret`, `${pfx}_webhook`, `${pfx}_price_essencial`, `${pfx}_price_completo`, `${pfx}_price_vitalicio`]) {
      if ((form[k] || "").trim()) values[k] = form[k].trim();
    }
    const res = await fetch("/api/admin/payments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values }),
    });
    setLoading(false);
    if (!res.ok) return setMsg("Falha ao salvar.");
    setMsg(`Chaves de ${m === "test" ? "teste" : "produção"} salvas!`);
    load();
  }

  async function switchMode(m: string) {
    await fetch("/api/admin/payments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: m, values: {} }),
    });
    load();
  }

  async function testConn(m: "test" | "live") {
    setMsg(`Testando ${m}...`);
    const res = await fetch("/api/admin/payments/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: m }),
    });
    const json = await res.json();
    setMsg(
      res.ok
        ? `✅ ${m} OK (${json.live ? "LIVE" : "teste"}, ${json.prices} preços lidos).`
        : `❌ ${json.error}`
    );
  }

  function card(m: "test" | "live", data: Block) {
    const pfx = `stripe_${m}`;
    const isTest = m === "test";
    return (
      <div className="rounded-2xl bg-white p-6 shadow">
        <h2 className="font-bold">
          {isTest ? "🧪 Chaves de TESTE" : "💳 Chaves de PRODUÇÃO (live)"}
        </h2>
        <p className="mt-1 text-xs text-neutral-500">
          {isTest
            ? "Para simular vendas sem cobrar. Use cartão 4242 4242 4242 4242."
            : "Cobra de verdade. Só ative no modo Live após testar."}
        </p>
        <div className="mt-4 flex flex-col gap-3">
          <label className="text-sm font-semibold">
            Secret key ({data.secret.set ? `salva ••••${data.secret.last4}` : "não salva"})
            <input
              type="password"
              className="mt-1 w-full rounded-xl border px-4 py-2 font-normal"
              placeholder={isTest ? "sk_test_... (vazio = mantém)" : "sk_live_... (vazio = mantém)"}
              value={form[`${pfx}_secret`] || ""}
              onChange={(e) => set(`${pfx}_secret`, e.target.value)}
            />
          </label>
          <label className="text-sm font-semibold">
            Webhook secret ({data.webhook.set ? `salvo ••••${data.webhook.last4}` : "não salvo"})
            <input
              type="password"
              className="mt-1 w-full rounded-xl border px-4 py-2 font-normal"
              placeholder="whsec_... do endpoint (vazio = mantém)"
              value={form[`${pfx}_webhook`] || ""}
              onChange={(e) => set(`${pfx}_webhook`, e.target.value)}
            />
          </label>
          <p className="text-xs text-neutral-500">
            Webhook: mesmo URL nos dois modos —{" "}
            <code>SEU-DOMINIO/api/stripe/webhook</code> (crie o endpoint no Dashboard Stripe em modo teste E em live; cada um dá um `whsec` diferente).
          </p>
          {(["essencial", "completo", "vitalicio"] as const).map((p) => (
            <label key={p} className="text-sm font-semibold">
              Price ID — {p} ({isTest ? "teste" : "live"})
              <input
                className="mt-1 w-full rounded-xl border px-4 py-2 font-mono font-normal"
                placeholder="price_..."
                value={form[`${pfx}_price_${p}`] ?? data[`price_${p}` as keyof Block] as string}
                onChange={(e) => set(`${pfx}_price_${p}`, e.target.value)}
              />
            </label>
          ))}
          <div className="flex gap-2">
            <button
              disabled={loading}
              onClick={() => save(m)}
              className="rounded-full bg-[#FF4D8D] px-6 py-2 font-semibold text-white disabled:opacity-50"
            >
              Salvar {isTest ? "teste" : "live"}
            </button>
            <button onClick={() => testConn(m)} className="rounded-full border px-6 py-2">
              Testar conexão
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-extrabold">Pagamentos (Stripe)</h1>
      <p className="text-sm text-neutral-500">Alterne entre teste e produção sem mexer no código.</p>

      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white p-4 shadow">
        <p className="text-sm font-bold">Modo ativo:</p>
        {(["test", "live"] as const).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`rounded-full px-5 py-1.5 text-sm font-bold ${mode === m ? (m === "test" ? "bg-emerald-500 text-white" : "bg-red-500 text-white") : "bg-neutral-100"}`}
          >
            {m === "test" ? "🧪 Teste" : "💳 Live"}
          </button>
        ))}
      </div>
      {mode === "live" && (
        <p className="mt-2 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">
          ⚠️ Modo LIVE: vendas cobram de verdade.
        </p>
      )}

      {msg && <p className="mt-4 text-sm text-neutral-700">{msg}</p>}

      <div className="mt-4 flex flex-col gap-4">
        {card("test", test)}
        {card("live", live)}
      </div>
    </div>
  );
}
