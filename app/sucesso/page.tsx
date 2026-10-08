"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function SucessoInner() {
  const params = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const sessionId = params.get("session_id") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) return setMsg("Use ao menos 6 caracteres.");
    if (password !== confirm) return setMsg("As senhas não conferem.");
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/sucesso/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `erro ${res.status}`);
      const { error } = await supabase.auth.signInWithPassword({
        email: json.email,
        password,
      });
      if (error) throw new Error("Senha definida! Entre com e-mail e senha.");
      router.push("/inicio");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "falha. Tente de novo.");
    }
    setLoading(false);
  }

  // Sem session_id (ex: acesso direto): mensagem genérica
  if (!sessionId) {
    return (
      <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow">
        <h1 className="text-2xl font-bold">Pagamento confirmado! 🎉</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Use o link que abriu após o pagamento para definir sua senha, ou entre
          com e-mail e senha.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-full bg-[#FF4D8D] px-8 py-2 font-semibold text-white"
        >
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow">
      <h1 className="text-2xl font-bold">Pagamento confirmado! 🎉</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Crie sua senha para entrar no app agora:
      </p>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-3 text-left">
        <input
          className="rounded-xl border px-4 py-2"
          placeholder="Nova senha (6+ caracteres)"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          className="rounded-xl border px-4 py-2"
          placeholder="Repita a senha"
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <button
          disabled={loading}
          className="rounded-full bg-[#FF4D8D] py-2 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Verificando pagamento..." : "Criar senha e entrar"}
        </button>
      </form>
      {msg && <p className="mt-3 text-sm text-neutral-600">{msg}</p>}
    </div>
  );
}

export default function SucessoPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-[#FFF5F7] px-6 py-16">
      <Suspense>
        <SucessoInner />
      </Suspense>
    </div>
  );
}
