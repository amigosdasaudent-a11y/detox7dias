"use client";

import { useEffect, useState } from "react";
import FileDrop from "@/components/FileDrop";
import AdminPreviewImg from "@/components/AdminPreviewImg";

type Banner = {
  id: string;
  image_path: string;
  link_url: string | null;
  sort_order: number;
  active: boolean;
};

async function upload(file: File, bucket: string): Promise<string> {
  const { uploadAdminFile } = await import("@/lib/admin-upload");
  return uploadAdminFile(file, bucket);
}

export default function BannersPage() {
  const [items, setItems] = useState<Banner[]>([]);
  const [showForm, setShowForm] = useState(false);
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
      setShowForm(false);
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "erro");
    }
    setLoading(false);
  }

  async function toggle(b: Banner) {
    await fetch("/api/admin/banners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: b.id, active: !b.active }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Excluir este banner?")) return;
    await fetch(`/api/admin/banners?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Banners</h1>
          <p className="text-sm text-neutral-500">Gerencie os banners do carrossel do Início.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-xl bg-[#FF4D8D] px-4 py-2 text-sm font-bold text-white"
        >
          + Novo Banner
        </button>
      </div>

      {showForm && (
        <form onSubmit={add} className="mt-4 flex flex-col gap-3 rounded-2xl bg-white p-6 shadow">
          <FileDrop
            title="1. Imagem do banner (sobe para o armazenamento)"
            accept="image/*"
            hint="PNG ou JPG"
            onFile={setFile}
          />
          <label className="text-sm font-semibold">
            2. Para onde vai quando o cliente clica (opcional, pode deixar vazio)
            <input className="mt-1 w-full rounded-xl border px-4 py-2 font-normal" placeholder="https://..." value={link} onChange={(e) => setLink(e.target.value)} />
          </label>
          <button disabled={loading} className="rounded-full bg-[#FF4D8D] py-2 font-semibold text-white disabled:opacity-50">
            {loading ? "Enviando..." : "Salvar banner"}
          </button>
          {msg && <p className="text-sm text-neutral-600">{msg}</p>}
        </form>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
        {items.map((b) => (
          <div key={b.id} className="overflow-hidden rounded-2xl bg-white shadow">
            <div className="relative">
              <AdminPreviewImg bucket="covers" path={b.image_path} className="h-40 w-full object-cover" alt="Banner" />
              <span className={`absolute right-3 top-3 rounded-full px-3 py-0.5 text-xs font-bold ${b.active ? "bg-emerald-100 text-emerald-700" : "bg-neutral-200 text-neutral-500"}`}>
                {b.active ? "Ativo" : "Inativo"}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 text-sm">
              <p className="truncate text-neutral-500">{b.link_url || "sem link"}</p>
              <div className="flex gap-3">
                <button onClick={() => toggle(b)} className="font-semibold text-[#FF4D8D]">
                  {b.active ? "Desativar" : "Ativar"}
                </button>
                <button onClick={() => remove(b.id)} className="text-red-600">Excluir</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {items.length === 0 && <p className="mt-6 text-sm text-neutral-500">Nenhum banner ainda.</p>}
    </div>
  );
}
