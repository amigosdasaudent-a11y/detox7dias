"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setMsg(error.message);
    router.push("/inicio");
  }

  async function handleMagic(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/inicio` },
    });
    setLoading(false);
    if (error) return setMsg(error.message);
    setMsg("Link mágico enviado! Veja seu e-mail.");
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-[#FFF5F7] px-6 py-16">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow">
        <h1 className="text-2xl font-bold">Entrar</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Use o mesmo e-mail do checkout da Stripe.
        </p>
        <div className="mt-4 flex gap-2 text-sm">
          <button
            onClick={() => setMode("password")}
            className={`rounded-full px-4 py-1 ${mode === "password" ? "bg-[#FF4D8D] text-white" : "bg-neutral-100"}`}
          >
            Senha
          </button>
          <button
            onClick={() => setMode("magic")}
            className={`rounded-full px-4 py-1 ${mode === "magic" ? "bg-[#FF4D8D] text-white" : "bg-neutral-100"}`}
          >
            Link mágico
          </button>
        </div>

        {mode === "password" ? (
          <form onSubmit={handlePassword} className="mt-4 flex flex-col gap-3">
            <input
              className="rounded-xl border px-4 py-2"
              placeholder="E-mail"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="rounded-xl border px-4 py-2"
              placeholder="Senha"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              disabled={loading}
              className="rounded-full bg-[#FF4D8D] py-2 font-semibold text-white disabled:opacity-50"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleMagic} className="mt-4 flex flex-col gap-3">
            <input
              className="rounded-xl border px-4 py-2"
              placeholder="E-mail"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              disabled={loading}
              className="rounded-full bg-[#FF4D8D] py-2 font-semibold text-white disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Enviar link"}
            </button>
          </form>
        )}

        {msg && <p className="mt-4 text-sm text-neutral-600">{msg}</p>}
        <p className="mt-4 text-xs text-neutral-500">
          Primeiro acesso? Após o pagamento você recebe o e-mail para definir a
          senha.
        </p>
      </div>
    </div>
  );
}
