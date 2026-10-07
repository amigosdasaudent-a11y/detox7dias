"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    const res = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (!res.ok) return setMsg("Senha incorreta.");
    router.push("/admin");
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-[#2D2A2E] px-6 py-16">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-3xl bg-white p-8 shadow"
      >
        <h1 className="text-2xl font-bold">Área do admin 🔐</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Acesso restrito: só quem tem a senha master.
        </p>
        <input
          className="mt-4 w-full rounded-xl border px-4 py-2"
          placeholder="Senha master"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          disabled={loading}
          className="mt-3 w-full rounded-full bg-[#FF4D8D] py-2 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Verificando..." : "Entrar"}
        </button>
        {msg && <p className="mt-3 text-sm text-red-600">{msg}</p>}
      </form>
    </div>
  );
}
