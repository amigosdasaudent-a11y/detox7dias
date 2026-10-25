import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

function sanitize(name: string): string {
  const base = name.split("/").pop() || "foto";
  const clean = base
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "_");
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${clean}`;
}

// POST /api/acompanhamento/upload-url { name } -> { signedUrl, path }
// Fotos do acompanhamento ficam no bucket privado, na pasta do próprio usuário.
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "login necessário" }, { status: 401 });

  const { data: ent } = await supabase
    .from("entitlements")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .single();
  if (!ent) return NextResponse.json({ error: "sem acesso ativo" }, { status: 403 });

  const { name } = (await req.json().catch(() => ({}))) as { name?: string };
  const path = `progress/${user.id}/${sanitize(name || "foto")}`;

  const svc = createServiceClient();
  const { data, error } = await svc.storage
    .from("content-files")
    .createSignedUploadUrl(path);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ signedUrl: data.signedUrl, path: data.path });
}
