"use client";

import { useEffect, useState } from "react";
import AdminPreviewImg from "@/components/AdminPreviewImg";

type Content = {
  id: string;
  type: string;
  title: string;
  external_url: string | null;
  file_path: string | null;
  cover_path: string | null;
  published: boolean;
  sort_order: number;
};

const TYPE_BADGE: Record<string, string> = {
  ebook: "pdf",
  audio: "mp3",
  video: "vídeo",
};

async function upload(file: File, bucket: string): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("bucket", bucket);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "upload falhou");
  return json.path as string;
}

export default function ConteudosPage() {
  const [items, setItems] = useState<Content[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState("video");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/contents");
    if (res.status === 401) return (window.location.href = "/admin/login");
    const json = await res.json();
    setItems(json.contents || []);
  }
  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      let file_path: string | null = null;
      let cover_path: string | null = null;
      if (file) file_path = await upload(file, "content-files");
      if (cover) cover_path = await upload(cover, "covers");
      if (!file_path && !url) throw new Error("Envie o arquivo OU cole a URL (YouTube, Vimeo ou Gumlet).");
      const res = await fetch("/api/admin/contents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, title, file_path, cover_path, external_url: url || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setTitle("");
      setUrl("");
      setFile(null);
      setCover(null);
      setShowForm(false);
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "erro");
    }
    setLoading(false);
  }

  async function toggle(c: Content) {
    await fetch("/api/admin/contents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.id, published: !c.published }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Excluir este conteúdo?")) return;
    await fetch(`/api/admin/contents?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Conteúdos</h1>
          <p className="text-sm text-neutral-500">E-books, áudios e vídeos do app.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-xl bg-[#FF4D8D] px-4 py-2 text-sm font-bold text-white"
        >
          + Novo Conteúdo
        </button>
      </div>

      {showForm && (
        <form onSubmit={add} className="mt-4 flex flex-col gap-3 rounded-2xl bg-white p-6 shadow">
          <div className="flex gap-2">
            {(["ebook", "audio", "video"] as const).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setType(t)}
                className={`rounded-full px-4 py-1 text-sm ${type === t ? "bg-[#FF4D8D] text-white" : "bg-neutral-100"}`}
              >
                {t === "ebook" ? "E-book (PDF)" : t === "audio" ? "Áudio (MP3)" : "Vídeo"}
              </button>
            ))}
          </div>
          <input className="rounded-xl border px-4 py-2" placeholder="Título" required value={title} onChange={(e) => setTitle(e.target.value)} />
          <label className="text-sm">
            {type === "ebook" ? "Arquivo PDF" : type === "audio" ? "Arquivo MP3" : "Arquivo MP4 (ou deixe vazio e use URL abaixo)"}
            <input type="file" className="mt-1 block" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          {type === "video" && (
            <input className="rounded-xl border px-4 py-2" placeholder="URL do vídeo: YouTube, Vimeo ou Gumlet (.m3u8)" value={url} onChange={(e) => setUrl(e.target.value)} />
          )}
          <label className="text-sm">
            Capa (imagem, opcional)
            <input type="file" accept="image/*" className="mt-1 block" onChange={(e) => setCover(e.target.files?.[0] || null)} />
          </label>
          <button disabled={loading} className="rounded-full bg-[#FF4D8D] py-2 font-semibold text-white disabled:opacity-50">
            {loading ? "Enviando..." : "Salvar conteúdo"}
          </button>
          {msg && <p className="text-sm text-neutral-600">{msg}</p>}
        </form>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {items.map((c) => (
          <div key={c.id} className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-[#FF4D8D] to-[#B3124F]">
              {c.cover_path ? (
                <AdminPreviewImg bucket="covers" path={c.cover_path} className="h-full w-full object-cover" alt={c.title} />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl text-white">🔒</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 font-bold">
                <span className="truncate">{c.title}</span>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-bold text-neutral-600">
                  {TYPE_BADGE[c.type] || c.type}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${c.published ? "bg-emerald-100 text-emerald-700" : "bg-neutral-200 text-neutral-500"}`}>
                  {c.published ? "Publicado" : "Rascunho"}
                </span>
              </p>
              <p className="truncate font-mono text-xs text-neutral-500">{c.external_url || c.file_path}</p>
            </div>
            <div className="flex shrink-0 gap-3 text-sm">
              <button onClick={() => toggle(c)} title={c.published ? "Despublicar" : "Publicar"}>👁</button>
              <button onClick={() => remove(c.id)} title="Excluir">🗑</button>
            </div>
          </div>
        ))}
      </div>
      {items.length === 0 && <p className="mt-6 text-sm text-neutral-500">Nenhum conteúdo ainda.</p>}
    </div>
  );
}
