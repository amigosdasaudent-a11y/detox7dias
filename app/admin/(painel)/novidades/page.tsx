"use client";

import { useEffect, useState } from "react";

type Sub = { id: string; name: string; phone: string; created_at: string };

async function upload(file: File): Promise<string> {
  const { uploadAdminFile } = await import("@/lib/admin-upload");
  return uploadAdminFile(file, "covers");
}

export default function NovidadesPage() {
  const [items, setItems] = useState<Sub[]>([]);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/subscribers");
    if (res.status === 401) return (window.location.href = "/admin/login");
    const json = await res.json();
    setItems(json.subscribers || []);
  }
  useEffect(() => {
    load();
  }, []);

  function toggle(id: string) {
    setSel((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }
  function all() {
    setSel((p) => (p.size === items.length ? new Set() : new Set(items.map((i) => i.id))));
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (sel.size === 0) return setMsg("Selecione ao menos 1 contato (ou Todos).");
    setLoading(true);
    setMsg("Enviando... pode demorar (1 por vez). Não feche.");
    try {
      let imagePath: string | null = null;
      if (image) imagePath = await upload(image);
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: sel.size === items.length ? "all" : [...sel],
          text,
          imagePath,
          videoUrl: videoUrl || null,
          videoTitle: videoTitle || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setMsg(`✅ Enviados: ${json.sent}. Falhas: ${json.failed}.`);
      setText("");
      setVideoUrl("");
      setVideoTitle("");
      setImage(null);
    } catch (err) {
      setMsg(`❌ ${err instanceof Error ? err.message : "erro"}`);
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-extrabold">Novidades (WhatsApp)</h1>
      <p className="text-sm text-neutral-500">
        Selecione quem recebe. Use {"{nome}"} para personalizar.
      </p>

      <form onSubmit={send} className="mt-4 rounded-2xl bg-white p-6 shadow">
        <textarea
          className="min-h-24 w-full rounded-xl border px-4 py-2"
          placeholder="Mensagem... Ex: Oi {nome}! Aula nova no app 🎉"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Imagem (opcional, vai com a legenda)
            <input type="file" accept="image/*" className="mt-1 block" onChange={(e) => setImage(e.target.files?.[0] || null)} />
          </label>
          <label className="text-sm">
            Título do vídeo (opcional)
            <input className="mt-1 w-full rounded-xl border px-4 py-2" placeholder="Vídeo novo no app" value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} />
          </label>
        </div>
        <label className="mt-3 block text-sm">
          Link do vídeo (opcional: YouTube, Vimeo ou Gumlet)
          <input className="mt-1 w-full rounded-xl border px-4 py-2" placeholder="https://..." value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
        </label>
        <button disabled={loading} className="mt-3 rounded-full bg-emerald-500 px-6 py-2 font-semibold text-white disabled:opacity-50">
          {loading ? "Enviando..." : `Enviar para ${sel.size || 0}`}
        </button>
        {msg && <p className="mt-2 text-sm text-neutral-700">{msg}</p>}
      </form>

      <div className="mt-6 rounded-2xl bg-white p-4 shadow">
        <div className="flex items-center justify-between">
          <p className="font-bold">Contatos ({items.length})</p>
          <button onClick={all} className="text-sm font-bold text-[#FF4D8D]">
            {sel.size === items.length && items.length > 0 ? "Desmarcar todos" : "Marcar todos"}
          </button>
        </div>
        <div className="mt-2 flex max-h-96 flex-col gap-1 overflow-y-auto">
          {items.map((s) => (
            <label key={s.id} className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 hover:bg-neutral-50">
              <input type="checkbox" checked={sel.has(s.id)} onChange={() => toggle(s.id)} className="h-5 w-5" />
              <span className="font-semibold">{s.name}</span>
              <span className="font-mono text-sm text-neutral-500">{s.phone}</span>
            </label>
          ))}
          {items.length === 0 && <p className="p-2 text-sm text-neutral-500">Ninguém inscrito ainda.</p>}
        </div>
      </div>
    </div>
  );
}
