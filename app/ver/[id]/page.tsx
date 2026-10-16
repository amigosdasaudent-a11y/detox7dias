import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import VideoPlayer from "@/components/VideoPlayer";
import PdfReader from "@/components/PdfReader";

export const dynamic = "force-dynamic";

// Página pública: aula GRÁTIS abre tudo; aula paga mostra teaser + CTA.
export default async function VerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();
  const { data: content } = await supabase
    .from("contents")
    .select("*")
    .eq("id", id)
    .eq("published", true)
    .single();
  if (!content) notFound();

  if (!content.is_free) {
    return (
      <div className="mx-auto w-full max-w-xl flex-1 bg-[#FFF5F7] px-4 py-16 text-center md:px-8">
        <div className="rounded-3xl bg-white p-8 shadow">
          <p className="text-4xl">🔒</p>
          <h1 className="mt-2 text-xl font-extrabold">{content.title}</h1>
          {content.description && (
            <p className="mt-2 text-sm text-neutral-500">{content.description}</p>
          )}
          <p className="mt-2 text-sm text-neutral-500">
            Este conteúdo é exclusivo de quem tem o plano <b>{content.min_plan || "essencial"}</b> (ou maior).
          </p>
          <a
            href="/vendas.html#planos"
            className="mt-6 inline-block rounded-full bg-[#FF4D8D] px-8 py-2 font-semibold text-white"
          >
            Quero acessar
          </a>
          <p className="mt-3">
            <a href="/login" className="text-sm text-neutral-500">Já comprei, entrar →</a>
          </p>
        </div>
      </div>
    );
  }

  let src = content.external_url as string | null;
  if (!src && content.file_path) {
    const { data } = await supabase.storage
      .from("content-files")
      .createSignedUrl(content.file_path, 3600);
    src = data?.signedUrl || null;
  }
  if (!src) notFound();

  const isAudio = content.type === "audio";
  const isEbook = content.type === "ebook";

  let coverUrl: string | null = null;
  if (content.cover_path) {
    const { data } = await supabase.storage
      .from("covers")
      .createSignedUrl(content.cover_path, 3600);
    coverUrl = data?.signedUrl || null;
  }

  // Vitrine: mostra TODOS os conteúdos publicados. Os grátis já são do usuário.
  const { data: vitrineContents } = await supabase
    .from("contents")
    .select("id, type, title, cover_path, is_free, min_plan, collection_id")
    .eq("published", true)
    .order("sort_order");
  const vitrine = vitrineContents || [];

  const { data: cols } = await supabase
    .from("collections")
    .select("id, title")
    .eq("published", true);
  const colTitle = new Map((cols || []).map((c) => [c.id as string, c.title as string]));

  const vCovers = new Map<string, string>();
  for (const c of vitrine) {
    if (!c.cover_path) continue;
    const { data } = await supabase.storage
      .from("covers")
      .createSignedUrl(c.cover_path, 600);
    if (data?.signedUrl) vCovers.set(c.id as string, data.signedUrl);
  }

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 bg-[#FFF5F7] px-4 py-10 md:px-8">
      <a href="/vendas.html" className="text-sm text-neutral-500">← Detox Body Max</a>
      <h1 className="mt-2 text-2xl font-bold">{content.title}</h1>
      {content.description && (
        <p className="mt-1 text-sm text-neutral-500">{content.description}</p>
      )}
      <div className="mt-4">
        {isEbook ? (
          <PdfReader url={src} title={content.title} cover={coverUrl} />
        ) : isAudio ? (
          <audio className="w-full" controls src={src} />
        ) : (
          <VideoPlayer src={src} title={content.title} />
        )}
      </div>

      {vitrine.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-extrabold">🛍 Vitrine do programa</h2>
          <p className="text-sm text-neutral-500">
            Veja tudo que tem no app. O que é grátis já é seu. 🎁
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {vitrine.map((c) => {
              const cover = vCovers.get(c.id as string);
              const free = !!c.is_free;
              const href = free ? `/ver/${c.id}` : "/vendas.html#planos";
              const action =
                c.type === "ebook" ? "Ler" : c.type === "audio" ? "Ouvir" : "Assistir";
              const product = c.collection_id ? colTitle.get(c.collection_id as string) : null;
              return (
                <a
                  key={c.id as string}
                  href={href}
                  className="relative block overflow-hidden rounded-2xl bg-white shadow hover:shadow-md"
                >
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cover}
                      alt={c.title as string}
                      className="aspect-[3/4] w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[3/4] w-full items-center justify-center bg-gradient-to-br from-[#FF4D8D] to-[#B3124F] text-4xl text-white">
                      {(c.title as string)[0]}
                    </div>
                  )}
                  <span
                    className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-bold text-white ${
                      free ? "bg-emerald-500" : "bg-black/70"
                    }`}
                  >
                    {free ? "JÁ É SEU" : `🔒 ${c.min_plan || "essencial"}`}
                  </span>
                  <div className="p-3">
                    {product && (
                      <p className="text-[10px] uppercase tracking-wide text-neutral-400">
                        {product}
                      </p>
                    )}
                    <p className="line-clamp-2 text-sm font-semibold">{c.title}</p>
                    <span className="mt-1 block text-xs font-semibold text-[#FF4D8D]">
                      {free ? `${action} →` : "Desbloquear →"}
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
