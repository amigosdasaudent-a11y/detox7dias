import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { timingSafeEqual } from "node:crypto";
import { ADMIN_COOKIE, makeAdminToken } from "@/lib/admin";

// POST /api/admin/session { password } -> cria sessão admin (cookie httpOnly)
export async function POST(req: Request) {
  const { password } = (await req.json().catch(() => ({}))) as {
    password?: string;
  };
  const real = process.env.ADMIN_PASSWORD;
  if (!real || !password) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  const a = Buffer.from(password);
  const b = Buffer.from(real);
  const ok = a.length === b.length && timingSafeEqual(a, b);
  if (!ok) {
    return NextResponse.json({ error: "senha incorreta" }, { status: 401 });
  }
  const store = await cookies();
  store.set(ADMIN_COOKIE, makeAdminToken(real), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12, // 12h
  });
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/session -> sai
export async function DELETE() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  return NextResponse.json({ ok: true });
}
