import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isAdminToken } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";

// GET /api/admin/preview?bucket=covers&path=... -> { url } (só admin, para ver a imagem)
export async function GET(req: Request) {
  const store = await cookies();
  if (!isAdminToken(store.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  const q = new URL(req.url).searchParams;
  const bucket = q.get("bucket") || "";
  const path = q.get("path") || "";
  if (!["covers", "content-files"].includes(bucket) || !path) {
    return NextResponse.json({ error: "parâmetros inválidos" }, { status: 400 });
  }
  const supabase = createServiceClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 300);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ url: data.signedUrl });
}
