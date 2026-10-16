"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function CriarContaPage() {
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
    const res = await fetch("/api/conta/criar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok) {
      setLoading(false);
      return setMsg(json.error || "Não deu para criar a conta.");
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setMsg("Conta criada! Agora faça login.");
    router.push("/inicio");
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-[#FFF5F7] px-6 py-16">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow">
        <p className="text-4xl">🎁</p>
        <h1 className="mt-1 text-2xl font-bold">Crie sua conta grátis</h1>
        <p className="mt-1 text-sm text-neutral-500">
          É de graça: acompanhe seus conteúdos e veja tudo que o programa tem.
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
            placeholder="Senha (mínimo 6 caracteres)"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            disabled={loading}
            className="rounded-full bg-[#FF4D8D] py-2 font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Criando..." : "Criar conta grátis"}
          </button>
        </form>
        {msg && <p className="mt-4 text-sm text-red-600">{msg}</p>}
        <p className="mt-4 text-sm">
          <Link href="/login" className="text-[#FF4D8D] font-semibold">
            Já tenho conta, entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
