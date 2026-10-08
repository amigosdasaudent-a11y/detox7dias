"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RecuperarSenhaPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/definir-senha`,
    });
    setLoading(false);
    if (error) return setMsg("Não foi possível enviar. Tente de novo.");
    setMsg("Se esse e-mail tiver conta, você recebe o link de redefinição.");
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-[#FFF5F7] px-6 py-16">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow">
        <h1 className="text-2xl font-bold">Recuperar senha</h1>
        <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
          <input
            className="rounded-xl border px-4 py-2"
            placeholder="E-mail da compra"
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
        {msg && <p className="mt-4 text-sm text-neutral-600">{msg}</p>}
        <p className="mt-4 text-sm">
          <Link href="/login" className="text-[#FF4D8D] font-semibold">Voltar ao login</Link>
        </p>
      </div>
    </div>
  );
}
