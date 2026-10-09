"use client";

import { useEffect, useState } from "react";

export default function IntegracoesPage() {
  const [url, setUrl] = useState("");
  const [instance, setInstance] = useState("");
  const [keySet, setKeySet] = useState("");
  const [openaiSet, setOpenaiSet] = useState(false);
  const [groqSet, setGroqSet] = useState(false);
  const [groqModel, setGroqModel] = useState("openai/gpt-oss-120b");
  const [customSet, setCustomSet] = useState(false);
  const [customBase, setCustomBase] = useState("");
  const [form, setForm] = useState<Record<string, string>>({});
  const [state, setState] = useState("...");
  const [evoErr, setEvoErr] = useState("");
  const [qr, setQr] = useState("");
  const [to, setTo] = useState("");
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/integrations");
    if (res.status === 401) return (window.location.href = "/admin/login");
    const json = await res.json();
    setUrl(json.evo_url || "");
    setInstance(json.evo_instance || "");
    setKeySet(json.evo_key?.set ? `••••${json.evo_key.last4}` : "");
    setOpenaiSet(!!json.openai?.set);
    setGroqSet(!!json.groq?.set);
    setGroqModel(json.groq_model || "openai/gpt-oss-120b");
    setCustomSet(!!json.custom?.set);
    setCustomBase(json.custom_base || "");
    setState(json.evo_state || "desconectado");
    setEvoErr(json.evo_error || "");
    setForm({});
  }
  useEffect(() => {
    load();
  }, []);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function save(values: Record<string, string>, okMsg: string) {
    setLoading(true);
    setMsg("");
    const res = await fetch("/api/admin/integrations", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values }),
    });
    setLoading(false);
    if (!res.ok) return setMsg("Falha ao salvar.");
    setMsg(okMsg);
    load();
  }

  async function showQr() {
    setMsg("Gerando QR (vale ~30s)...");
    const res = await fetch("/api/admin/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "qr" }),
    });
    const json = await res.json();
    if (json.connected) {
      setState("open");
      return setMsg("✅ WhatsApp já conectado! Sem QR.");
    }
    if (!res.ok) return setMsg(`❌ ${json.error}`);
    if (json.base64) {
      setQr(json.base64.startsWith("data:") ? json.base64 : `data:image/png;base64,${json.base64}`);
      setMsg("Escaneie com o WhatsApp (Aparelhos conectados).");
    } else {
      setMsg("Sem QR (já conectado?).");
    }
  }

  async function sendTest(e: React.FormEvent) {
    e.preventDefault();
    setMsg("Enviando...");
    const res = await fetch("/api/admin/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send", to, text: text || "Teste Detox Body Max ✅" }),
    });
    const json = await res.json();
    setMsg(res.ok ? "✅ Enviado!" : `❌ ${json.error}`);
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-extrabold">Integrações</h1>
      <p className="text-sm text-neutral-500">WhatsApp (Evolution) e inteligência artificial.</p>
      {msg && <p className="mt-4 text-sm text-neutral-700">{msg}</p>}

      <div className="mt-4 rounded-2xl bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">📱 Evolution (WhatsApp)</h2>
          <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${state === "open" ? "bg-emerald-100 text-emerald-700" : "bg-neutral-200 text-neutral-500"}`}>
            {state}
          </span>
        </div>
        {state !== "open" && evoErr && (
          <p className="mt-2 text-xs text-red-600">
            {evoErr} <button onClick={() => load()} className="font-bold underline">Recarregar</button>
          </p>
        )}
        <div className="mt-4 flex flex-col gap-3">
          <label className="text-sm font-semibold">
            URL do servidor
            <input className="mt-1 w-full rounded-xl border px-4 py-2 font-mono font-normal" placeholder="https://..." value={form.evo_url ?? url} onChange={(e) => set("evo_url", e.target.value)} />
          </label>
          <label className="text-sm font-semibold">
            Nome da instância
            <input className="mt-1 w-full rounded-xl border px-4 py-2 font-normal" placeholder="detox" value={form.evo_instance ?? instance} onChange={(e) => set("evo_instance", e.target.value)} />
          </label>
          <label className="text-sm font-semibold">
            Token da instância {keySet ? `(salvo ${keySet})` : "(não salvo)"}
            <input type="password" className="mt-1 w-full rounded-xl border px-4 py-2 font-normal" placeholder="vazio = mantém" value={form.evo_key || ""} onChange={(e) => set("evo_key", e.target.value)} />
          </label>
          <p className="-mt-2 text-xs text-neutral-500">
            Copie em Evolution GO → Instâncias → Configurações → "Token da Instância" (não é a key global do Portainer).
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              disabled={loading}
              onClick={() => save({ evo_url: form.evo_url ?? url, evo_instance: form.evo_instance ?? instance, ...(form.evo_key ? { evo_key: form.evo_key } : {}) }, "Evolution salva!")}
              className="rounded-full bg-[#FF4D8D] px-6 py-2 font-semibold text-white disabled:opacity-50"
            >
              Salvar Evolution
            </button>
            <button onClick={showQr} className="rounded-full border px-6 py-2">Mostrar QR</button>
          </div>
          {qr && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt="QR WhatsApp" className="mx-auto h-64 w-64 rounded-2xl border" />
          )}
          <form onSubmit={sendTest} className="flex flex-col gap-2 rounded-2xl bg-neutral-50 p-4">
            <p className="text-sm font-bold">Mensagem de teste</p>
            <div className="flex gap-2">
              <input className="w-40 rounded-xl border px-4 py-2" placeholder="5511999999999" value={to} onChange={(e) => setTo(e.target.value)} />
              <input className="w-full rounded-xl border px-4 py-2" placeholder="Texto..." value={text} onChange={(e) => setText(e.target.value)} />
              <button className="rounded-full bg-emerald-500 px-5 py-2 font-semibold text-white">Enviar</button>
            </div>
          </form>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-white p-6 shadow">
        <h2 className="font-bold">🧠 Inteligência artificial (chat + IMC)</h2>
        <p className="mt-1 text-xs text-neutral-500">
          Ordem automática: <b>1º Groq (grátis) → 2º Extra (grátis) → 3º OpenAI (paga, por último)</b>.
          Se uma falhar, a próxima entra sozinha. Na calculadora, a paga limita a <b>1x/semana</b>.
          O JEV continua como guardião das decisões.
        </p>

        <p className="mt-4 text-sm font-semibold">1. Groq — grátis {groqSet ? "(salva)" : "(não salva)"}</p>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row">
          <input
            type="password"
            className="w-full rounded-xl border px-4 py-2 font-mono"
            placeholder="gsk_... (vazio = mantém)"
            value={form.ai_groq_key || ""}
            onChange={(e) => set("ai_groq_key", e.target.value)}
          />
          <input
            className="w-full rounded-xl border px-4 py-2 font-mono sm:max-w-[220px]"
            placeholder="modelo"
            value={form.ai_groq_model ?? groqModel}
            onChange={(e) => { set("ai_groq_model", e.target.value); setGroqModel(e.target.value); }}
          />
        </div>

        <p className="mt-4 text-sm font-semibold">2. Extra — outra compatível (grátis) {customSet ? "(salva)" : "(não salva)"}</p>
        <p className="text-xs text-neutral-500">Ex: OpenRouter, DeepSeek. Precisa da URL base + modelo + chave.</p>
        <div className="mt-1 flex flex-col gap-2">
          <input
            className="w-full rounded-xl border px-4 py-2 font-mono"
            placeholder="URL base: https://openrouter.ai/api/v1"
            value={form.ai_custom_base ?? customBase}
            onChange={(e) => { set("ai_custom_base", e.target.value); setCustomBase(e.target.value); }}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              className="w-full rounded-xl border px-4 py-2 font-mono"
              placeholder="modelo: ex deepseek/deepseek-chat"
              value={form.ai_custom_model || ""}
              onChange={(e) => set("ai_custom_model", e.target.value)}
            />
            <input
              type="password"
              className="w-full rounded-xl border px-4 py-2 font-mono"
              placeholder="chave (vazio = mantém)"
              value={form.ai_custom_key || ""}
              onChange={(e) => set("ai_custom_key", e.target.value)}
            />
          </div>
        </div>

        <p className="mt-4 text-sm font-semibold">3. OpenAI — paga (último recurso) {openaiSet ? "(salva)" : "(não salva)"}</p>
        <div className="mt-1 flex gap-2">
          <input
            type="password"
            className="w-full rounded-xl border px-4 py-2 font-mono"
            placeholder="sk-... (vazio = mantém)"
            value={form.openai_key || ""}
            onChange={(e) => set("openai_key", e.target.value)}
          />
          <button
            disabled={loading}
            onClick={() => {
              const values: Record<string, string> = {};
              for (const k of ["ai_groq_key", "ai_groq_model", "ai_custom_key", "ai_custom_base", "ai_custom_model", "openai_key"]) {
                if ((form[k] || "").trim()) values[k] = form[k].trim();
              }
              if (Object.keys(values).length) save(values, "IAs salvas!");
            }}
            className="rounded-full bg-[#FF4D8D] px-6 py-2 font-semibold text-white disabled:opacity-50"
          >
            Salvar IAs
          </button>
        </div>
      </div>
    </div>
  );
}
