import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isAdminToken } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";

function sanitize(name: string): string {
  const base = name.split("/").pop() || "arquivo";
  const clean = base
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "_");
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${clean}`;
}

// POST /api/admin/upload-url { bucket, name? } -> { signedUrl, path }
// O navegador envia o arquivo DIRETO ao Supabase (PUT), sem limite de 4,5MB da Vercel.
export async function POST(req: Request) {
  const store = await cookies();
  if (!isAdminToken(store.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  const { bucket, name } = (await req.json().catch(() => ({}))) as {
    bucket?: string;
    name?: string;
  };
  if (!["covers", "content-files"].includes(bucket || "")) {
    return NextResponse.json({ error: "bucket inválido" }, { status: 400 });
  }
  const supabase = createServiceClient();
  const path = sanitize(name || "arquivo");
  const { data, error } = await supabase.storage
    .from(bucket!)
    .createSignedUploadUrl(path);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ signedUrl: data.signedUrl, path: data.path });
}
