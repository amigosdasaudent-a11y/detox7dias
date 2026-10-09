"use client";

import { useEffect, useState } from "react";

export default function NovidadesCard() {
  const [open, setOpen] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/novidades");
      if (!res.ok) return;
      const json = await res.json();
      setSubscribed(!!json.subscribed);
      if (json.subscribed) {
        setName(json.name || "");
        setPhone(json.phone || "");
      }
    } catch {
      // sem novidades offline
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    const res = await fetch("/api/novidades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) return setMsg(json.error || "erro");
    setSubscribed(true);
    setOpen(false);
    setMsg("");
  }

  async function leave() {
    if (!confirm("Parar de receber novidades no WhatsApp?")) return;
    await fetch("/api/novidades", { method: "DELETE" });
    setSubscribed(false);
    setOpen(false);
  }

  if (subscribed) {
    return (
      <div className="mt-6 flex items-center justify-between rounded-3xl bg-emerald-50 p-4 text-sm">
        <p>🔔 Você recebe as novidades no WhatsApp.</p>
        <button onClick={leave} className="font-semibold text-neutral-500 underline">
          sair
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-3xl bg-white p-5 shadow">
      {!open ? (
        <button onClick={() => setOpen(true)} className="w-full text-left">
          <p className="font-bold">🔔 QUER RECEBER NOVIDADES?</p>
          <p className="text-sm text-neutral-500">
            Avisamos no WhatsApp quando sair aula, e-book ou vídeo novo. Toque para cadastrar.
          </p>
        </button>
      ) : (
        <form onSubmit={submit}>
          <p className="font-bold">🔔 Receber novidades no WhatsApp</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              className="w-full rounded-xl border px-4 py-2"
              placeholder="Seu nome"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="w-full rounded-xl border px-4 py-2"
              placeholder="Celular com DDD"
              inputMode="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <button disabled={loading} className="rounded-full bg-[#FF4D8D] px-6 py-2 font-semibold text-white disabled:opacity-50">
              {loading ? "..." : "Quero!"}
            </button>
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            Ao cadastrar você aceita receber novidades. Pode sair quando quiser.
          </p>
          {msg && <p className="mt-2 text-sm text-red-600">{msg}</p>}
        </form>
      )}
    </div>
  );
}
