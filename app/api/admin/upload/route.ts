import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isAdminToken } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";

async function guard() {
  const store = await cookies();
  return isAdminToken(store.get(ADMIN_COOKIE)?.value);
}

// POST /api/admin/upload (multipart: file, bucket, name?) -> { path }
export async function POST(req: Request) {
  if (!(await guard())) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  const form = await req.formData();
  const file = form.get("file");
  const bucket = String(form.get("bucket") || "covers");
  const name = String(
    form.get("name") || `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "arquivo ausente" }, { status: 400 });
  }
  if (!["covers", "content-files"].includes(bucket)) {
    return NextResponse.json({ error: "bucket inválido" }, { status: 400 });
  }
  const supabase = createServiceClient();
  const buf = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage
    .from(bucket)
    .upload(name, buf, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ path: name });
}
