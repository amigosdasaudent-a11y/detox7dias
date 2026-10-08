"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setMsg("E-mail ou senha incorretos.");
    router.push("/inicio");
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-[#FFF5F7] px-6 py-16">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow">
        <h1 className="text-2xl font-bold">Entrar</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Use o e-mail da compra e a senha definida no convite.
        </p>
        <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
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
        {msg && <p className="mt-4 text-sm text-red-600">{msg}</p>}
        <p className="mt-4 text-sm">
          <Link href="/recuperar-senha" className="text-[#FF4D8D] font-semibold">
            Esqueci minha senha
          </Link>
        </p>
        <p className="mt-2 text-xs text-neutral-500">
          Comprou e não definiu a senha? Abra o e-mail de convite recebido após o
          pagamento.
        </p>
      </div>
    </div>
  );
}
