"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DefinirSenhaPage() {
  const router = useRouter();
  const supabase = createClient();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setMsg("Link inválido ou expirado. Peça outro na tela de login.");
          return;
        }
      }
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setMsg("Sessão não encontrada. Use o link do e-mail novamente.");
        return;
      }
      setReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) return setMsg("Use ao menos 6 caracteres.");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return setMsg("Falha ao salvar. Tente de novo.");
    router.push("/inicio");
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-[#FFF5F7] px-6 py-16">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow">
        <h1 className="text-2xl font-bold">Definir senha</h1>
        {!ready ? (
          <p className="mt-4 text-sm text-neutral-600">{msg || "Verificando link..."}</p>
        ) : (
          <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
            <input
              className="rounded-xl border px-4 py-2"
              placeholder="Nova senha"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              disabled={loading}
              className="rounded-full bg-[#FF4D8D] py-2 font-semibold text-white disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Salvar e entrar"}
            </button>
            {msg && <p className="text-sm text-red-600">{msg}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
