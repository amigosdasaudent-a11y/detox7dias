"use client";

import { useEffect, useState } from "react";

type Post = {
  id: string;
  slug: string;
  title: string;
  published: boolean;
  published_at: string | null;
};

async function upload(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("bucket", "covers");
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "upload falhou");
  return json.path as string;
}

export default function BlogAdminPage() {
  const [items, setItems] = useState<Post[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [published, setPublished] = useState(false);
  const [cover, setCover] = useState<File | null>(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/posts");
    if (res.status === 401) return (window.location.href = "/admin/login");
    const json = await res.json();
    setItems(json.posts || []);
  }
  useEffect(() => {
    load();
  }, []);

  function reset() {
    setEditingId(null);
    setTitle("");
    setBody("");
    setPublished(false);
    setCover(null);
  }

  async function edit(id: string) {
    const res = await fetch(`/api/admin/posts?id=${id}`, { method: "PUT" });
    const json = await res.json();
    if (!res.ok) return;
    setEditingId(json.post.id);
    setTitle(json.post.title);
    setBody(json.post.body_md || "");
    setPublished(json.post.published);
    window.scrollTo({ top: 0 });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      let cover_path: string | null = null;
      if (cover) cover_path = await upload(cover);
      const payload: Record<string, unknown> = { title, body_md: body, published };
      if (cover_path) payload.cover_path = cover_path;
      let res: Response;
      if (editingId) {
        payload.id = editingId;
        res = await fetch("/api/admin/posts", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/admin/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      reset();
      await load();
      setMsg("Artigo salvo!");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "erro");
    }
    setLoading(false);
  }

  async function toggle(p: Post) {
    await fetch("/api/admin/posts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, published: !p.published }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Excluir este artigo?")) return;
    await fetch(`/api/admin/posts?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-extrabold">Blog</h1>
      <p className="text-sm text-neutral-500">Artigos (Markdown) do app.</p>

      <form onSubmit={save} className="mt-4 flex flex-col gap-3 rounded-2xl bg-white p-6 shadow">
        <h2 className="font-bold">{editingId ? "Editar artigo" : "+ Novo artigo"}</h2>
        <input className="rounded-xl border px-4 py-2" placeholder="Título" required value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="min-h-40 rounded-xl border px-4 py-2 font-mono text-sm" placeholder="Texto em Markdown..." value={body} onChange={(e) => setBody(e.target.value)} />
        <label className="text-sm">
          Capa (imagem, opcional)
          <input type="file" accept="image/*" className="mt-1 block" onChange={(e) => setCover(e.target.files?.[0] || null)} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          Publicado
        </label>
        <div className="flex gap-2">
          <button disabled={loading} className="rounded-full bg-[#FF4D8D] px-6 py-2 font-semibold text-white disabled:opacity-50">
            {loading ? "Salvando..." : "Salvar"}
          </button>
          {editingId && (
            <button type="button" onClick={reset} className="rounded-full border px-6 py-2">
              Cancelar
            </button>
          )}
        </div>
        {msg && <p className="text-sm text-neutral-600">{msg}</p>}
      </form>

      <div className="mt-6 flex flex-col gap-3">
        {items.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow">
            <div>
              <p className="font-bold">
                {p.title}{" "}
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${p.published ? "bg-emerald-100 text-emerald-700" : "bg-neutral-200 text-neutral-500"}`}>
                  {p.published ? "Publicado" : "Rascunho"}
                </span>
              </p>
              <p className="font-mono text-xs text-neutral-500">/{p.slug}</p>
            </div>
            <div className="flex gap-3 text-sm">
              <button onClick={() => toggle(p)} title={p.published ? "Despublicar" : "Publicar"}>👁</button>
              <button onClick={() => edit(p.id)} title="Editar">✏️</button>
              <button onClick={() => remove(p.id)} title="Excluir">🗑</button>
            </div>
          </div>
        ))}
      </div>
      {items.length === 0 && <p className="mt-6 text-sm text-neutral-500">Nenhum artigo.</p>}
    </div>
  );
}
