import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isAdminToken } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";

async function guard() {
  const store = await cookies();
  return isAdminToken(store.get(ADMIN_COOKIE)?.value);
}

// GET -> produtos da loja
export async function GET() {
  if (!(await guard())) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("sort_order");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data });
}

// POST { name, description?, kind, target_url, price_label?, image_path?, grants_plan?, sort_order? }
export async function POST(req: Request) {
  if (!(await guard())) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  const b = await req.json();
  if (!b.name?.trim() || !b.target_url?.trim()) {
    return NextResponse.json({ error: "nome e destino obrigatórios" }, { status: 400 });
  }
  if (!["whatsapp", "external"].includes(b.kind)) {
    return NextResponse.json({ error: "tipo inválido" }, { status: 400 });
  }
  const supabase = createServiceClient();
  const { data: max } = await supabase
    .from("products")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();
  const { data, error } = await supabase
    .from("products")
    .insert({
      name: b.name.trim(),
      description: b.description || null,
      kind: b.kind,
      target_url: b.target_url.trim(),
      price_label: b.price_label || null,
      image_path: b.image_path || null,
      grants_plan: b.grants_plan || null,
      sort_order: (max?.sort_order ?? -1) + 1,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data });
}

// PATCH { id, ...fields }
export async function PATCH(req: Request) {
  if (!(await guard())) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  const { id, ...fields } = await req.json();
  if (!id) return NextResponse.json({ error: "sem id" }, { status: 400 });
  const supabase = createServiceClient();
  const { error } = await supabase.from("products").update(fields).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE ?id=
export async function DELETE(req: Request) {
  if (!(await guard())) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "sem id" }, { status: 400 });
  const supabase = createServiceClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
