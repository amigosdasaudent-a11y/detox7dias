"use client";

import { useEffect, useState } from "react";

type UserRow = {
  id: string;
  email: string;
  created_at: string;
  access: { plan: string; status: string } | null;
};

export default function UsuariosPage() {
  const [items, setItems] = useState<UserRow[]>([]);
  const [q, setQ] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("vitalicio");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function load(query = "") {
    const res = await fetch(`/api/admin/users${query ? `?q=${encodeURIComponent(query)}` : ""}`);
    if (res.status === 401) return (window.location.href = "/admin/login");
    const json = await res.json();
    setItems(json.users || []);
  }
  useEffect(() => {
    load();
  }, []);

  async function grant(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, plan }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) return setMsg(json.error || "erro");
    setEmail("");
    setMsg(json.invited ? "Acesso liberado + convite enviado!" : "Acesso liberado!");
    load(q);
  }

  async function setStatus(user_id: string, status: string) {
    if (status === "canceled" && !confirm("Revogar o acesso deste usuário?")) return;
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, status }),
    });
    load(q);
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <h1 className="text-2xl font-extrabold">Usuários</h1>
      <p className="text-sm text-neutral-500">Libere quem comprou no WhatsApp e gerencie acessos.</p>

      <form onSubmit={grant} className="mt-4 flex flex-col gap-3 rounded-2xl bg-white p-6 shadow sm:flex-row sm:items-end">
        <label className="w-full text-sm font-semibold">
          E-mail (venda WhatsApp)
          <input className="mt-1 w-full rounded-xl border px-4 py-2 font-normal" type="email" required placeholder="cliente@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="text-sm font-semibold">
          Plano
          <select className="mt-1 rounded-xl border px-4 py-2 font-normal" value={plan} onChange={(e) => setPlan(e.target.value)}>
            <option value="essencial">Essencial</option>
            <option value="completo">Completo</option>
            <option value="vitalicio">Vitalício</option>
          </select>
        </label>
        <button disabled={loading} className="rounded-full bg-[#FF4D8D] px-6 py-2 font-semibold text-white disabled:opacity-50">
          {loading ? "..." : "Liberar"}
        </button>
      </form>
      {msg && <p className="mt-2 text-sm text-neutral-600">{msg}</p>}

      <input
        className="mt-6 w-full rounded-xl border bg-white px-4 py-2"
        placeholder="Buscar por e-mail..."
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          load(e.target.value);
        }}
      />

      <div className="mt-4 flex flex-col gap-3">
        {items.map((u) => (
          <div key={u.id} className="flex items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow">
            <div className="min-w-0">
              <p className="truncate font-bold">{u.email}</p>
              <p className="text-xs text-neutral-500">
                {u.access ? `${u.access.plan} • ${u.access.status === "active" ? "ativo" : "revogado"}` : "sem acesso"}
              </p>
            </div>
            <div className="flex shrink-0 gap-3 text-sm">
              {u.access?.status === "active" ? (
                <button onClick={() => setStatus(u.id, "canceled")} className="font-semibold text-red-600">
                  Revogar
                </button>
              ) : (
                <button onClick={() => setStatus(u.id, "active")} className="font-semibold text-emerald-600">
                  Reativar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {items.length === 0 && <p className="mt-6 text-sm text-neutral-500">Nenhum usuário.</p>}
    </div>
  );
}
