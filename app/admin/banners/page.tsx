"use client";

import { useEffect, useState } from "react";

type Banner = {
  id: string;
  image_path: string;
  link_url: string | null;
  sort_order: number;
  active: boolean;
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

export default function BannersPage() {
  const [items, setItems] = useState<Banner[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/banners");
    if (res.status === 401) return (window.location.href = "/admin/login");
    const json = await res.json();
    setItems(json.banners || []);
  }
  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return setMsg("Escolha a imagem do banner.");
    setLoading(true);
    setMsg("");
    try {
      const path = await upload(file, "covers");
      const res = await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_path: path, link_url: link || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setFile(null);
      setLink("");
      await load();
      setMsg("Banner salvo!");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "erro");
    }
    setLoading(false);
  }

  async function remove(id: string) {
    if (!confirm("Excluir este banner?")) return;
    await fetch(`/api/admin/banners?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <a href="/admin" className="text-sm text-neutral-500">← Painel</a>
      <h1 className="mt-2 text-2xl font-bold">Banners</h1>
      <form onSubmit={add} className="mt-4 rounded-3xl bg-white p-6 shadow flex flex-col gap-3">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <input
          className="rounded-xl border px-4 py-2"
          placeholder="Link de destino (opcional)"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
        <button disabled={loading} className="rounded-full bg-[#FF4D8D] py-2 font-semibold text-white disabled:opacity-50">
          {loading ? "Enviando..." : "Salvar banner"}
        </button>
        {msg && <p className="text-sm text-neutral-600">{msg}</p>}
      </form>
      <div className="mt-6 flex flex-col gap-3">
        {items.map((b) => (
          <div key={b.id} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow">
            <div className="text-sm">
              <p className="font-mono text-xs">{b.image_path}</p>
              <p className="text-neutral-500">{b.link_url || "sem link"}</p>
            </div>
            <button onClick={() => remove(b.id)} className="text-sm text-red-600">Excluir</button>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-neutral-500">Nenhum banner ainda.</p>}
      </div>
    </div>
  );
}
