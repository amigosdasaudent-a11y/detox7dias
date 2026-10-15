import { NextResponse } from "next/server";
import { getSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

// GET -> URL do vídeo da página de vendas (público, sem segredo).
export async function GET() {
  const url = await getSetting("vendas_video_url");
  return NextResponse.json({ url: url || "" });
}
