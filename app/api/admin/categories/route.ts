import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isAdminToken } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";

async function guard() {
  const store = await cookies();
  return isAdminToken(store.get(ADMIN_COOKIE)?.value);
}

const DUP = /duplicate|unique/i;

// GET -> lista de categorias (com ordem)
export async function GET() {
  if (!(await guard())) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, sort_order")
    .order("sort_order")
    .order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ categories: data });
}

// POST { name } -> cria categoria
export async function POST(req: Request) {
  if (!(await guard())) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  const { name } = await req.json();
  const clean = (name || "").trim();
  if (!clean) return NextResponse.json({ error: "nome vazio" }, { status: 400 });
  const supabase = createServiceClient();
  const { data: max } = await supabase
    .from("categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();
  const { data, error } = await supabase
    .from("categories")
    .insert({ name: clean, sort_order: (max?.sort_order ?? -1) + 1 })
    .select()
    .single();
  if (error) {
    return NextResponse.json(
      { error: DUP.test(error.message) ? "Essa categoria já existe." : error.message },
      { status: 400 }
    );
  }
  return NextResponse.json({ category: data });
}

// PATCH { id, name } -> renomeia e propaga para produtos e aulas
export async function PATCH(req: Request) {
  if (!(await guard())) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  const { id, name } = await req.json();
  const clean = (name || "").trim();
  if (!id || !clean) {
    return NextResponse.json({ error: "dados inválidos" }, { status: 400 });
  }
  const supabase = createServiceClient();
  const { data: cat } = await supabase
    .from("categories")
    .select("name")
    .eq("id", id)
    .single();
  if (!cat) return NextResponse.json({ error: "categoria não encontrada" }, { status: 404 });
  const old = cat.name;
  if (old !== clean) {
    const { error } = await supabase.from("categories").update({ name: clean }).eq("id", id);
    if (error) {
      return NextResponse.json(
        { error: DUP.test(error.message) ? "Já existe uma categoria com esse nome." : error.message },
        { status: 400 }
      );
    }
    await supabase.from("collections").update({ category: clean }).eq("category", old);
    await supabase.from("contents").update({ category: clean }).eq("category", old);
  }
  return NextResponse.json({ ok: true });
}

// PUT { order: [id, ...] } -> define a ordem das categorias
export async function PUT(req: Request) {
  if (!(await guard())) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  const { order } = await req.json();
  if (!Array.isArray(order)) {
    return NextResponse.json({ error: "formato inválido" }, { status: 400 });
  }
  const supabase = createServiceClient();
  for (let i = 0; i < order.length; i++) {
    await supabase.from("categories").update({ sort_order: i }).eq("id", order[i]);
  }
  return NextResponse.json({ ok: true });
}

// DELETE ?id= -> remove da lista (não apaga produtos/aulas)
export async function DELETE(req: Request) {
  if (!(await guard())) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "sem id" }, { status: 400 });
  const supabase = createServiceClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
