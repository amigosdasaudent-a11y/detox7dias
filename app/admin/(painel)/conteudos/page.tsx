"use client";

import { useEffect, useState } from "react";
import FileDrop from "@/components/FileDrop";
import AdminPreviewImg from "@/components/AdminPreviewImg";

type Content = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  external_url: string | null;
  file_path: string | null;
  cover_path: string | null;
  category: string | null;
  min_plan: string | null;
  collection_id: string | null;
  published: boolean;
  sort_order: number;
};

type Collection = { id: string; title: string };

const TYPE_BADGE: Record<string, string> = {
  ebook: "pdf",
  audio: "mp3",
  video: "vídeo",
};

async function upload(file: File, bucket: string): Promise<string> {
  const { uploadAdminFile } = await import("@/lib/admin-upload");
  return uploadAdminFile(file, bucket);
}

export default function ConteudosPage() {
  const [items, setItems] = useState<Content[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState("video");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [collectionId, setCollectionId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [editing, setEditing] = useState<Content | null>(null);
  const [eType, setEType] = useState("video");
  const [eTitle, setETitle] = useState("");
  const [eDesc, setEDesc] = useState("");
  const [eUrl, setEUrl] = useState("");
  const [eCategory, setECategory] = useState("");
  const [ePlan, setEPlan] = useState("essencial");
  const [eCollection, setECollection] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const [rc, rq] = await Promise.all([
      fetch("/api/admin/contents"),
      fetch("/api/admin/collections"),
    ]);
    if (rc.status === 401) return (window.location.href = "/admin/login");
    const jc = await rc.json();
    setItems(jc.contents || []);
    const jq = await rq.json();
    setCollections(jq.collections || []);
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
        body: JSON.stringify({ type, title, file_path, cover_path, external_url: url || null, collection_id: collectionId || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setTitle("");
      setUrl("");
      setCollectionId("");
      setFile(null);
      setCover(null);
      setShowForm(false);
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "erro");
    }
    setLoading(false);
  }

  function startEdit(c: Content) {
    setEditing(c);
    setEType(c.type);
    setETitle(c.title);
    setEDesc(c.description || "");
    setEUrl(c.external_url || "");
    setECategory(c.category || "");
    setEPlan(c.min_plan || "essencial");
    setECollection(c.collection_id || "");
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setLoading(true);
    const res = await fetch("/api/admin/contents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editing.id,
        type: eType,
        title: eTitle,
        description: eDesc || null,
        external_url: eUrl || null,
        category: eCategory || null,
        min_plan: ePlan,
        collection_id: eCollection || null,
      }),
    });
    setLoading(false);
    if (!res.ok) return setMsg("Falha ao salvar.");
    setEditing(null);
    setMsg("");
    load();
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

  const visible = items.filter((c) =>
    filter === "all" ? true : filter === "none" ? !c.collection_id : c.collection_id === filter
  );
  const colName = (id: string | null) =>
    id ? collections.find((c) => c.id === id)?.title || "?" : "Sem produto";

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
          {showForm ? "Fechar" : "+ Novo Conteúdo"}
        </button>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto text-sm">
        <button onClick={() => setFilter("all")} className={`rounded-full px-4 py-1 ${filter === "all" ? "bg-[#232326] text-white" : "bg-white"}`}>
          Todos
        </button>
        {collections.map((c) => (
          <button key={c.id} onClick={() => setFilter(c.id)} className={`rounded-full px-4 py-1 ${filter === c.id ? "bg-[#232326] text-white" : "bg-white"}`}>
            {c.title}
          </button>
        ))}
        <button onClick={() => setFilter("none")} className={`rounded-full px-4 py-1 ${filter === "none" ? "bg-[#232326] text-white" : "bg-white"}`}>
          Sem produto
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
            Produto (em qual produto fica esta aula?)
            <select className="mt-1 block w-full rounded-xl border px-4 py-2" value={collectionId} onChange={(e) => setCollectionId(e.target.value)}>
              <option value="">Sem produto</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </label>
        <FileDrop
          title={type === "ebook" ? "Arquivo PDF" : type === "audio" ? "Arquivo MP3" : "Arquivo MP4 (ou deixe vazio e use URL abaixo)"}
          hint="Sobe para o armazenamento privado"
          onFile={setFile}
        />
          {type === "video" && (
            <input className="rounded-xl border px-4 py-2" placeholder="URL do vídeo: YouTube, Vimeo ou Gumlet (.m3u8)" value={url} onChange={(e) => setUrl(e.target.value)} />
          )}
        <FileDrop
          title="Capa (imagem, opcional)"
          accept="image/*"
          hint="Aparece no card do app"
          onFile={setCover}
        />
          <button disabled={loading} className="rounded-full bg-[#FF4D8D] py-2 font-semibold text-white disabled:opacity-50">
            {loading ? "Enviando..." : "Salvar conteúdo"}
          </button>
          {msg && <p className="text-sm text-neutral-600">{msg}</p>}
        </form>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={saveEdit} className="flex max-h-[90vh] w-full max-w-lg flex-col gap-3 overflow-y-auto rounded-2xl bg-white p-6 shadow">
            <h2 className="font-bold">Editar conteúdo</h2>
            <div>
              <p className="mb-1 text-sm font-semibold">Tipo de conteúdo</p>
              <div className="flex gap-2">
                {(["ebook", "audio", "video"] as const).map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setEType(t)}
                    className={`rounded-full px-4 py-1 text-sm ${eType === t ? "bg-[#FF4D8D] text-white" : "bg-neutral-100"}`}
                  >
                    {t === "ebook" ? "📖 E-book (PDF)" : t === "audio" ? "🎧 Áudio (MP3)" : "▶️ Vídeo"}
                  </button>
                ))}
              </div>
            </div>
            <label className="text-sm font-semibold">
              Título
              <input className="mt-1 w-full rounded-xl border px-4 py-2 font-normal" placeholder="Título" required value={eTitle} onChange={(e) => setETitle(e.target.value)} />
            </label>
            <label className="text-sm font-semibold">
              Descrição
              <textarea className="mt-1 w-full rounded-xl border px-4 py-2 font-normal" placeholder="Descrição" value={eDesc} onChange={(e) => setEDesc(e.target.value)} />
            </label>
            <label className="text-sm font-semibold">
              URL do vídeo (YouTube, Vimeo ou Gumlet — só para vídeos por link)
              <input className="mt-1 w-full rounded-xl border px-4 py-2 font-normal" placeholder="https://..." value={eUrl} onChange={(e) => setEUrl(e.target.value)} />
            </label>
            <div className="flex gap-2">
              <label className="w-full text-sm font-semibold">
                Categoria
                <input className="mt-1 w-full rounded-xl border px-4 py-2 font-normal" placeholder="Categoria" value={eCategory} onChange={(e) => setECategory(e.target.value)} />
              </label>
              <label className="text-sm font-semibold">
                Plano mínimo
                <select className="mt-1 rounded-xl border px-4 py-2 font-normal" value={ePlan} onChange={(e) => setEPlan(e.target.value)}>
                  <option value="essencial">Essencial</option>
                  <option value="completo">Completo</option>
                  <option value="vitalicio">Vitalício</option>
                </select>
              </label>
            </div>
            <label className="text-sm font-semibold">
              Produto (em qual produto fica esta aula?)
              <select className="mt-1 w-full rounded-xl border px-4 py-2 font-normal" value={eCollection} onChange={(e) => setECollection(e.target.value)}>
                <option value="">Sem produto</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </label>
            <div className="flex gap-2">
              <button disabled={loading} className="rounded-full bg-[#FF4D8D] px-6 py-2 font-semibold text-white disabled:opacity-50">
                Salvar
              </button>
              <button type="button" onClick={() => setEditing(null)} className="rounded-full border px-6 py-2">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {visible.map((c) => (
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
                  {c.published ? "Visível" : "Oculto"}
                </span>
                <span className="rounded-full bg-[#FFF0F5] px-2 py-0.5 text-xs font-bold text-[#FF4D8D]">
                  {colName(c.collection_id)}
                </span>
              </p>
              <p className="truncate font-mono text-xs text-neutral-500">{c.external_url || c.file_path}</p>
            </div>
            <div className="flex shrink-0 gap-3 text-sm">
              <button onClick={() => toggle(c)} title={c.published ? "Ocultar" : "Mostrar"}>👁</button>
              <button onClick={() => startEdit(c)} title="Editar">✏️</button>
              <button onClick={() => remove(c.id)} title="Excluir">🗑</button>
            </div>
          </div>
        ))}
      </div>
      {visible.length === 0 && <p className="mt-6 text-sm text-neutral-500">Nada aqui.</p>}
    </div>
  );
}
