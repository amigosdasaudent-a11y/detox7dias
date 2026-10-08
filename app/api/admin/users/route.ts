import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isAdminToken } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";

async function guard() {
  const store = await cookies();
  return isAdminToken(store.get(ADMIN_COOKIE)?.value);
}

// GET ?q= -> usuários com acesso atual (vendas WhatsApp liberadas aqui)
export async function GET(req: Request) {
  if (!(await guard())) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  const q = new URL(req.url).searchParams.get("q") || "";
  const supabase = createServiceClient();
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 100 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  let users = data.users;
  if (q) {
    const needle = q.toLowerCase();
    users = users.filter((u) => (u.email || "").toLowerCase().includes(needle));
  }
  const { data: ents } = await supabase
    .from("entitlements")
    .select("user_id, email, plan, status, created_at")
    .order("created_at", { ascending: false });
  const byUser = new Map<string, { plan: string; status: string }>();
  const byEmail = new Map<string, { plan: string; status: string }>();
  for (const e of ents || []) {
    if (e.user_id && !byUser.has(e.user_id)) {
      byUser.set(e.user_id, { plan: e.plan, status: e.status });
    }
    const em = (e.email || "").toLowerCase();
    if (em && !byEmail.has(em)) byEmail.set(em, { plan: e.plan, status: e.status });
  }
  return NextResponse.json({
    users: users.slice(0, 50).map((u) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      access: byUser.get(u.id) || byEmail.get((u.email || "").toLowerCase()) || null,
    })),
  });
}

// POST { email, plan } -> libera acesso manual (venda WhatsApp)
export async function POST(req: Request) {
  if (!(await guard())) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  const { email, plan } = await req.json();
  if (!email?.trim() || !["essencial", "completo", "vitalicio"].includes(plan)) {
    return NextResponse.json({ error: "e-mail/plano inválidos" }, { status: 400 });
  }
  const clean = email.toLowerCase().trim();
  const supabase = createServiceClient();
  const { data: existing } = await supabase.auth.admin.listUsers({ perPage: 100 });
  let userId = existing.users.find((u) => (u.email || "").toLowerCase() === clean)?.id;
  let isNew = false;
  if (!userId) {
    const { data: created, error } = await supabase.auth.admin.createUser({
      email: clean,
      email_confirm: true,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    userId = created.user.id;
    isNew = true;
  }
  const { error: entErr } = await supabase.from("entitlements").insert({
    user_id: userId,
    email: clean,
    plan,
    status: "active",
  });
  if (entErr) return NextResponse.json({ error: entErr.message }, { status: 500 });
  if (isNew) {
    await supabase.auth.admin.inviteUserByEmail(clean, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/inicio`,
    });
  }
  return NextResponse.json({ ok: true, invited: isNew });
}

// PATCH { user_id, status } -> revoga (canceled) ou reativa último acesso (active)
export async function PATCH(req: Request) {
  if (!(await guard())) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  const { user_id, status } = await req.json();
  if (!user_id || !["active", "canceled"].includes(status)) {
    return NextResponse.json({ error: "dados inválidos" }, { status: 400 });
  }
  const supabase = createServiceClient();
  if (status === "canceled") {
    const { error } = await supabase
      .from("entitlements")
      .update({ status: "canceled" })
      .eq("user_id", user_id)
      .eq("status", "active");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { data: latest } = await supabase
      .from("entitlements")
      .select("id")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (!latest) return NextResponse.json({ error: "sem acesso para reativar" }, { status: 400 });
    const { error } = await supabase
      .from("entitlements")
      .update({ status: "active", expires_at: null })
      .eq("id", latest.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
