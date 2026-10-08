import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isAdminToken } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";

async function guard() {
  const store = await cookies();
  return isAdminToken(store.get(ADMIN_COOKIE)?.value);
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// GET -> artigos
export async function GET() {
  if (!(await guard())) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("posts")
    .select("id, slug, title, published, published_at")
    .order("published_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: data });
}

// GET ?id= -> um artigo completo (para editar)
export async function PUT(req: Request) {
  if (!(await guard())) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  const id = new URL(req.url).searchParams.get("id");
  const supabase = createServiceClient();
  if (id) {
    const { data, error } = await supabase.from("posts").select("*").eq("id", id).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ post: data });
  }
  return NextResponse.json({ error: "sem id" }, { status: 400 });
}

// POST { title, body_md, cover_path?, published? } -> criar
export async function POST(req: Request) {
  if (!(await guard())) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  const b = await req.json();
  if (!b.title?.trim()) {
    return NextResponse.json({ error: "título vazio" }, { status: 400 });
  }
  const supabase = createServiceClient();
  const slug = `${slugify(b.title)}-${Date.now().toString(36)}`;
  const { data, error } = await supabase
    .from("posts")
    .insert({
      slug,
      title: b.title.trim(),
      body_md: b.body_md || "",
      cover_path: b.cover_path || null,
      published: !!b.published,
      published_at: b.published ? new Date().toISOString() : null,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: data });
}

// PATCH { id, title?, body_md?, cover_path?, published? }
export async function PATCH(req: Request) {
  if (!(await guard())) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  const { id, published, ...rest } = await req.json();
  if (!id) return NextResponse.json({ error: "sem id" }, { status: 400 });
  const supabase = createServiceClient();
  const fields: Record<string, unknown> = { ...rest };
  if (typeof published === "boolean") {
    fields.published = published;
    fields.published_at = published ? new Date().toISOString() : null;
  }
  const { error } = await supabase.from("posts").update(fields).eq("id", id);
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
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
