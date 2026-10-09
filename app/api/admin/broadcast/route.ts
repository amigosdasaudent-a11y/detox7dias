import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isAdminToken } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";
import { evoSendLink, evoSendMedia, evoSendText, getEvoConfig } from "@/lib/evolution";

async function guard() {
  const store = await cookies();
  return isAdminToken(store.get(ADMIN_COOKIE)?.value);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// POST /api/admin/broadcast { ids: string[] | 'all', text?, imagePath?, videoUrl?, videoTitle? }
export async function POST(req: Request) {
  if (!(await guard())) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  const { ids, text, imagePath, videoUrl, videoTitle } = (await req.json().catch(
    () => ({})
  )) as {
    ids?: string[] | "all";
    text?: string;
    imagePath?: string;
    videoUrl?: string;
    videoTitle?: string;
  };
  const cleanText = String(text || "").slice(0, 1000);
  if (!cleanText && !imagePath && !videoUrl) {
    return NextResponse.json({ error: "mensagem vazia" }, { status: 400 });
  }

  let cfg;
  try {
    cfg = await getEvoConfig();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Evolution não configurada" },
      { status: 400 }
    );
  }
  const supabase = createServiceClient();
  let query = supabase.from("subscribers").select("id, name, phone").eq("active", true);
  if (Array.isArray(ids)) query = query.in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  const { data: subs, error } = await query.limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!subs?.length) return NextResponse.json({ error: "ninguém selecionado" }, { status: 400 });

  let imageUrl: string | null = null;
  if (imagePath) {
    const { data, error: signErr } = await supabase.storage
      .from("covers")
      .createSignedUrl(imagePath, 3600);
    if (signErr) return NextResponse.json({ error: "imagem: " + signErr.message }, { status: 400 });
    imageUrl = data.signedUrl;
  }

  let sent = 0;
  const failures: { phone: string; error: string }[] = [];
  for (const s of subs) {
    try {
      const personalized = cleanText.replaceAll("{nome}", s.name.split(" ")[0]);
      if (imageUrl) {
        const caption = videoUrl ? `${personalized}\n${videoUrl}` : personalized;
        await evoSendMedia(cfg, s.phone, imageUrl, caption || "Novidade Detox Body Max");
      } else if (videoUrl) {
        try {
          await evoSendLink(cfg, s.phone, {
            url: videoUrl,
            title: videoTitle || "Vídeo novo no app",
            text: personalized,
          });
        } catch {
          await evoSendText(cfg, s.phone, `${personalized}\n${videoUrl}`);
        }
      } else {
        await evoSendText(cfg, s.phone, personalized);
      }
      sent++;
    } catch (e) {
      failures.push({ phone: s.phone, error: e instanceof Error ? e.message : "falha" });
    }
    await sleep(700); // evita bloqueio por disparo em massa
  }
  return NextResponse.json({ ok: true, sent, failed: failures.length, failures: failures.slice(0, 10) });
}
