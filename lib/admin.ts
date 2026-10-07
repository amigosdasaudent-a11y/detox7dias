import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "admin_session";
const LABEL = "detox-admin-v1";

// Token determinístico: HMAC(senha, label). Só quem tem a senha gera/confere.
export function makeAdminToken(password: string): string {
  return createHmac("sha256", password).update(LABEL).digest("hex");
}

export function isAdminToken(token: string | undefined): boolean {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || !token) return false;
  try {
    const expected = Buffer.from(makeAdminToken(pw));
    const got = Buffer.from(token);
    return (
      expected.length === got.length && timingSafeEqual(expected, got)
    );
  } catch {
    return false;
  }
}
