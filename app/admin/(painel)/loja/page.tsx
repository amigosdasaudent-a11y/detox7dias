"use client";

import { useEffect, useState } from "react";
import FileDrop from "@/components/FileDrop";
import AdminPreviewImg from "@/components/AdminPreviewImg";

type Product = {
  id: string;
  name: string;
  description: string | null;
  kind: string;
  target_url: string;
  price_label: string | null;
  image_path: string | null;
  grants_plan: string | null;
  active: boolean;
  sort_order: number;
};

async function upload(file: File): Promise<string> {
  const { uploadAdminFile } = await import("@/lib/admin-upload");
  return uploadAdminFile(file, "covers");
}

export default function LojaAdminPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState("whatsapp");
  const [target, setTarget] = useState("");
  const [price, setPrice] = useState("");
  const [grants, setGrants] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/store");
    if (res.status === 401) return (window.location.href = "/admin/login");
    const json = await res.json();
    setItems(json.products || []);
  }
  useEffect(() => {
    load();
  }, []);

  function reset() {
    setEditing(null);
    setName("");
    setDescription("");
    setKind("whatsapp");
    setTarget("");
    setPrice("");
    setGrants("");
    setImage(null);
    setShowForm(false);
  }

  function startEdit(p: Product) {
    setEditing(p);
    setName(p.name);
    setDescription(p.description || "");
    setKind(p.kind);
    setTarget(p.target_url);
    setPrice(p.price_label || "");
    setGrants(p.grants_plan || "");
    setImage(null);
    setShowForm(true);
    window.scrollTo({ top: 0 });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      let image_path: string | null = null;
      if (image) image_path = await upload(image);
      const payload: Record<string, unknown> = {
        name,
        description: description || null,
        kind,
        target_url: target.trim(),
        price_label: price || null,
        grants_plan: grants || null,
      };
      if (image_path) payload.image_path = image_path;
      let res: Response;
      if (editing) {
        payload.id = editing.id;
        res = await fetch("/api/admin/store", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/admin/store", {
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

  async function toggle(p: Product) {
    await fetch("/api/admin/store", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, active: !p.active }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Excluir este produto da loja?")) return;
    await fetch(`/api/admin/store?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Loja</h1>
          <p className="text-sm text-neutral-500">Produtos com botão WhatsApp ou link externo.</p>
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
          <input className="rounded-xl border px-4 py-2" placeholder="Nome do produto" required value={name} onChange={(e) => setName(e.target.value)} />
          <textarea className="rounded-xl border px-4 py-2" placeholder="Descrição (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div>
            <p className="mb-1 text-sm font-semibold">Botão de compra</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setKind("whatsapp")} className={`rounded-full px-4 py-1 text-sm ${kind === "whatsapp" ? "bg-[#FF4D8D] text-white" : "bg-neutral-100"}`}>
                💬 WhatsApp
              </button>
              <button type="button" onClick={() => setKind("external")} className={`rounded-full px-4 py-1 text-sm ${kind === "external" ? "bg-[#FF4D8D] text-white" : "bg-neutral-100"}`}>
                🔗 Link externo
              </button>
            </div>
          </div>
          <label className="text-sm font-semibold">
            {kind === "whatsapp" ? "Link do WhatsApp (wa.me com mensagem pronta)" : "URL de destino"}
            <input className="mt-1 w-full rounded-xl border px-4 py-2 font-normal" placeholder={kind === "whatsapp" ? "https://wa.me/5500000000000?text=Quero%20comprar..." : "https://..."} required value={target} onChange={(e) => setTarget(e.target.value)} />
          </label>
          <div className="flex gap-2">
            <label className="w-full text-sm font-semibold">
              Preço (texto exibido)
              <input className="mt-1 w-full rounded-xl border px-4 py-2 font-normal" placeholder="R$ 97" value={price} onChange={(e) => setPrice(e.target.value)} />
            </label>
            <label className="text-sm font-semibold">
              Libera o app?
              <select className="mt-1 rounded-xl border px-4 py-2 font-normal" value={grants} onChange={(e) => setGrants(e.target.value)}>
                <option value="">Não, só vende</option>
                <option value="essencial">Essencial</option>
                <option value="completo">Completo</option>
                <option value="vitalicio">Vitalício</option>
              </select>
            </label>
          </div>
          <FileDrop
            title="Foto do produto"
            accept="image/*"
            hint="Aparece no card da loja"
            onFile={setImage}
          />
          <button disabled={loading} className="rounded-full bg-[#FF4D8D] py-2 font-semibold text-white disabled:opacity-50">
            {loading ? "Salvando..." : "Salvar produto"}
          </button>
          {msg && <p className="text-sm text-neutral-600">{msg}</p>}
        </form>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {items.map((p) => (
          <div key={p.id} className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-[#FF4D8D] to-[#B3124F]">
              {p.image_path ? (
                <AdminPreviewImg bucket="covers" path={p.image_path} className="h-full w-full object-cover" alt={p.name} />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl text-white">🛍</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 font-bold">
                <span className="truncate">{p.name}</span>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-bold text-neutral-600">
                  {p.kind === "whatsapp" ? "WhatsApp" : "Externo"}
                </span>
                {p.grants_plan && (
                  <span className="rounded-full bg-[#FFF0F5] px-2 py-0.5 text-xs font-bold text-[#FF4D8D]">
                    Libera: {p.grants_plan}
                  </span>
                )}
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${p.active ? "bg-emerald-100 text-emerald-700" : "bg-neutral-200 text-neutral-500"}`}>
                  {p.active ? "Visível" : "Oculto"}
                </span>
              </p>
              <p className="truncate text-sm text-neutral-500">{p.price_label || p.target_url}</p>
            </div>
            <div className="flex shrink-0 gap-3 text-sm">
              <button onClick={() => toggle(p)} title={p.active ? "Ocultar" : "Mostrar"}>👁</button>
              <button onClick={() => startEdit(p)} title="Editar">✏️</button>
              <button onClick={() => remove(p.id)} title="Excluir">🗑</button>
            </div>
          </div>
        ))}
      </div>
      {items.length === 0 && <p className="mt-6 text-sm text-neutral-500">Nenhum produto na loja.</p>}
    </div>
  );
}
