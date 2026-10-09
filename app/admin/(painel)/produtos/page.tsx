"use client";

import { useEffect, useState } from "react";
import FileDrop from "@/components/FileDrop";
import AdminPreviewImg from "@/components/AdminPreviewImg";

type Collection = {
  id: string;
  title: string;
  description: string | null;
  cover_path: string | null;
  min_plan: string;
  sort_order: number;
  published: boolean;
  contents: { count: number }[];
};

async function upload(file: File): Promise<string> {
  const { uploadAdminFile } = await import("@/lib/admin-upload");
  return uploadAdminFile(file, "covers");
}

export default function ProdutosPage() {
  const [items, setItems] = useState<Collection[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cover, setCover] = useState<File | null>(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/collections");
    if (res.status === 401) return (window.location.href = "/admin/login");
    const json = await res.json();
    setItems(json.collections || []);
  }
  useEffect(() => {
    load();
  }, []);

  function startEdit(c: Collection) {
    setEditing(c);
    setTitle(c.title);
    setDescription(c.description || "");
    setCover(null);
    setShowForm(true);
    window.scrollTo({ top: 0 });
  }

  function reset() {
    setEditing(null);
    setTitle("");
    setDescription("");
    setCover(null);
    setShowForm(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      let cover_path: string | null = null;
      if (cover) cover_path = await upload(cover);
      const payload: Record<string, unknown> = { title, description: description || null };
      if (cover_path) payload.cover_path = cover_path;
      let res: Response;
      if (editing) {
        payload.id = editing.id;
        res = await fetch("/api/admin/collections", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/admin/collections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      reset();
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "erro");
    }
    setLoading(false);
  }

  async function toggle(c: Collection) {
    await fetch("/api/admin/collections", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.id, published: !c.published }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Excluir este produto? As aulas ficam soltas, sem produto.")) return;
    await fetch(`/api/admin/collections?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Produtos</h1>
          <p className="text-sm text-neutral-500">Cada produto tem capa e guarda as aulas dentro.</p>
        </div>
        <button
          onClick={() => (showForm ? reset() : setShowForm(true))}
          className="rounded-xl bg-[#FF4D8D] px-4 py-2 text-sm font-bold text-white"
        >
          {showForm ? "Fechar" : "+ Novo Produto"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={save} className="mt-4 flex flex-col gap-3 rounded-2xl bg-white p-6 shadow">
          <h2 className="font-bold">{editing ? "Editar produto" : "Novo produto"}</h2>
          <input className="rounded-xl border px-4 py-2" placeholder="Nome do produto" required value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea className="rounded-xl border px-4 py-2" placeholder="Descrição (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} />
          <FileDrop
            title="Capa do produto (imagem)"
            accept="image/*"
            hint="Aparece no card do produto"
            onFile={setCover}
          />
          <button disabled={loading} className="rounded-full bg-[#FF4D8D] py-2 font-semibold text-white disabled:opacity-50">
            {loading ? "Salvando..." : "Salvar produto"}
          </button>
          {msg && <p className="text-sm text-neutral-600">{msg}</p>}
        </form>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
        {items.map((c) => (
          <div key={c.id} className="overflow-hidden rounded-2xl bg-white shadow">
            <div className="relative h-36 bg-gradient-to-br from-[#FF4D8D] to-[#B3124F]">
              {c.cover_path && (
                <AdminPreviewImg bucket="covers" path={c.cover_path} className="h-full w-full object-cover" alt={c.title} />
              )}
              <span className={`absolute right-3 top-3 rounded-full px-3 py-0.5 text-xs font-bold ${c.published ? "bg-emerald-100 text-emerald-700" : "bg-neutral-200 text-neutral-500"}`}>
                {c.published ? "Visível" : "Oculto"}
              </span>
            </div>
            <div className="p-4">
              <p className="font-bold">{c.title}</p>
              <p className="text-sm text-neutral-500">{c.contents?.[0]?.count ?? 0} aulas</p>
              <div className="mt-3 flex gap-4 text-sm">
                <button onClick={() => toggle(c)} className="font-semibold text-[#FF4D8D]">
                  {c.published ? "Ocultar produto" : "Mostrar produto"}
                </button>
                <button onClick={() => startEdit(c)} title="Editar">✏️ Editar</button>
                <button onClick={() => remove(c.id)} className="text-red-600">Excluir</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {items.length === 0 && <p className="mt-6 text-sm text-neutral-500">Nenhum produto. Crie o primeiro acima.</p>}
    </div>
  );
}
