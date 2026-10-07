import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// POST /api/signed-url { bucket, path } -> { url } (só com acesso ativo)
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

  const { bucket, path } = (await req.json().catch(() => ({}))) as {
    bucket?: string;
    path?: string;
  };
  if (!["covers", "content-files"].includes(bucket || "") || !path) {
    return NextResponse.json({ error: "parâmetros inválidos" }, { status: 400 });
  }
  const svc = createServiceClient();
  const { data, error } = await svc.storage
    .from(bucket!)
    .createSignedUrl(path, 300); // 5 min
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ url: data.signedUrl });
}
