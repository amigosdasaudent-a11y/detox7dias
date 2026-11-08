import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isAdminToken } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";

async function guard() {
  const store = await cookies();
  return isAdminToken(store.get(ADMIN_COOKIE)?.value);
}

function normalizeIds(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const ids = value.filter((v): v is string => typeof v === "string" && v.length > 0);
  return [...new Set(ids)];
}

/** Vínculos conteúdo → produto (um conteúdo pode estar em vários produtos). */
async function linksByContent(supabase: ReturnType<typeof createServiceClient>) {
  const { data } = await supabase
    .from("content_collections")
    .select("content_id, collection_id")
    .order("sort_order");
  const map = new Map<string, string[]>();
  for (const row of data || []) {
    const list = map.get(row.content_id as string) || [];
    list.push(row.collection_id as string);
    map.set(row.content_id as string, list);
  }
  return map;
}

async function replaceLinks(
  supabase: ReturnType<typeof createServiceClient>,
  contentId: string,
  ids: string[]
) {
  await supabase.from("content_collections").delete().eq("content_id", contentId);
  if (!ids.length) return null;
  const { error } = await supabase.from("content_collections").insert(
    ids.map((collectionId, i) => ({
      content_id: contentId,
      collection_id: collectionId,
      sort_order: i,
    }))
  );
  return error?.message || null;
}

export async function GET() {
  if (!(await guard())) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("contents")
    .select("*")
    .order("sort_order");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const links = await linksByContent(supabase);
  const contents = (data || []).map((c) => {
    const ids = links.get(c.id);
    // Fallback: vínculo antigo (contents.collection_id) ou tabela ainda não migrada.
    const collection_ids = ids?.length ? ids : c.collection_id ? [c.collection_id] : [];
    return { ...c, collection_ids };
  });
  return NextResponse.json({ contents });
}

export async function POST(req: Request) {
  if (!(await guard())) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  const b = await req.json();
  if (!["ebook", "audio", "video"].includes(b.type) || !b.title) {
    return NextResponse.json({ error: "tipo/título inválidos" }, { status: 400 });
  }
  const ids = normalizeIds(b.collection_ids) ?? (b.collection_id ? [b.collection_id] : []);
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("contents")
    .insert({
      type: b.type,
      title: b.title,
      description: b.description || null,
      cover_path: b.cover_path || null,
      file_path: b.file_path || null,
      external_url: b.external_url || null,
      // Produto principal (compatibilidade com o restante do app).
      collection_id: ids[0] || null,
      category: b.category || null,
      min_plan: b.min_plan || "essencial",
      sort_order: Number(b.sort_order || 0),
      published: b.published !== false,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const linkError = await replaceLinks(supabase, data.id, ids);
  if (linkError) return NextResponse.json({ error: linkError }, { status: 500 });
  return NextResponse.json({ content: { ...data, collection_ids: ids } });
}

export async function DELETE(req: Request) {
  if (!(await guard())) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "sem id" }, { status: 400 });
  const supabase = createServiceClient();
  const { error } = await supabase.from("contents").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// PATCH { id, title?, description?, published?, sort_order?, min_plan?, category?,
//         collection_ids?: string[] }
// collection_ids substitui todos os vínculos; o primeiro vira o "produto principal".
export async function PATCH(req: Request) {
  if (!(await guard())) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  const { id, collection_ids, collection_id, ...fields } = await req.json();
  if (!id) return NextResponse.json({ error: "sem id" }, { status: 400 });

  const ids =
    normalizeIds(collection_ids) ??
    (collection_id !== undefined ? (collection_id ? [collection_id] : []) : null);
  if (ids) fields.collection_id = ids[0] || null;

  const supabase = createServiceClient();
  const { error } = await supabase.from("contents").update(fields).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (ids) {
    const linkError = await replaceLinks(supabase, id, ids);
    if (linkError) return NextResponse.json({ error: linkError }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
