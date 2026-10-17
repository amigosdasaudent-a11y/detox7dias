"use client";

import { useEffect, useState } from "react";

type Category = { id: string; name: string; sort_order: number };

export default function CategoriasPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/categories");
    if (res.status === 401) return (window.location.href = "/admin/login");
    const json = await res.json();
    setItems(json.categories || []);
  }
  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) return setMsg(json.error || "erro");
    setName("");
    load();
  }

  async function saveRename(id: string) {
    if (!editName.trim()) return;
    setLoading(true);
    const res = await fetch("/api/admin/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name: editName }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) return setMsg(json.error || "erro");
    setEditingId(null);
    load();
  }

  async function move(index: number, dir: -1 | 1) {
    const next = [...items];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    setItems(next);
    await fetch("/api/admin/categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: next.map((c) => c.id) }),
    });
  }

  async function remove(id: string) {
    if (!confirm("Remover esta categoria da lista? Os produtos/aulas continuam, só saem d'ordem.")) return;
    await fetch(`/api/admin/categories?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-extrabold">Categorias</h1>
      <p className="text-sm text-neutral-500">
        Organizam os produtos na tela inicial. A ordem aqui é a ordem que aparece no app.
      </p>

      <form onSubmit={add} className="mt-4 flex gap-2 rounded-2xl bg-white p-4 shadow">
        <input
          className="w-full rounded-xl border px-4 py-2"
          placeholder="Nova categoria (ex: Sexualidade)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button disabled={loading} className="shrink-0 rounded-full bg-[#FF4D8D] px-6 py-2 font-semibold text-white disabled:opacity-50">
          Adicionar
        </button>
      </form>
      {msg && <p className="mt-2 text-sm text-red-600">{msg}</p>}

      <div className="mt-6 flex flex-col gap-2">
        {items.map((c, i) => {
          const editing = editingId === c.id;
          return (
            <div key={c.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow">
              <div className="flex flex-col">
                <button
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="px-1 text-neutral-400 disabled:opacity-30"
                  aria-label="Subir"
                >
                  ▲
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === items.length - 1}
                  className="px-1 text-neutral-400 disabled:opacity-30"
                  aria-label="Descer"
                >
                  ▼
                </button>
              </div>
              {editing ? (
                <>
                  <input
                    className="w-full rounded-xl border px-4 py-2"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                  />
                  <button onClick={() => saveRename(c.id)} className="shrink-0 font-semibold text-emerald-600">
                    Salvar
                  </button>
                  <button onClick={() => setEditingId(null)} className="shrink-0 text-neutral-500">
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  <p className="flex-1 font-semibold">{c.name}</p>
                  <button
                    onClick={() => {
                      setEditingId(c.id);
                      setEditName(c.name);
                    }}
                    className="text-sm text-[#FF4D8D]"
                  >
                    ✏️ Renomear
                  </button>
                  <button onClick={() => remove(c.id)} className="text-sm text-red-600">
                    Excluir
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
      {items.length === 0 && (
        <p className="mt-6 text-sm text-neutral-500">Nenhuma categoria ainda. Crie a primeira acima.</p>
      )}
    </div>
  );
}
