import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isAdminToken } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";

async function guard() {
  const store = await cookies();
  return isAdminToken(store.get(ADMIN_COOKIE)?.value);
}

// GET /api/admin/subscribers -> inscritos ativos
export async function GET() {
  if (!(await guard())) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("subscribers")
    .select("id, name, phone, created_at")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ subscribers: data });
}
