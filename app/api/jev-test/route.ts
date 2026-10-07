import { NextResponse } from "next/server";

// GET /api/jev-test -> testa conectividade com JEV sem gastar muito
export async function GET() {
  const key = process.env.JEV_API_KEY;
  const base = process.env.JEV_BASE_URL || "https://www.jevai.org";
  if (!key) return NextResponse.json({ ok: false, error: "sem JEV_API_KEY" }, { status: 500 });

  try {
    const res = await fetch(`${base}/api/v1/decisions/route`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        task: "Connectivity check do app Detox Body Max",
        evidence: ["Teste de integração inicial"],
        constraints: ["Não executar ação real"],
      }),
    });
    const json = await res.json();
    return NextResponse.json({ ok: json.code === 0, jev: json });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
