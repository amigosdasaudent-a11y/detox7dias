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

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 bg-[#FFF5F7] px-4 py-10 md:px-8">
      <a href="/vendas.html" className="text-sm text-neutral-500">← Detox Body Max</a>
      <h1 className="mt-2 text-2xl font-bold">{content.title}</h1>
      {content.description && (
        <p className="mt-1 text-sm text-neutral-500">{content.description}</p>
      )}
      <div className="mt-4">
        {isEbook ? (
          <PdfReader url={src} title={content.title} />
        ) : isAudio ? (
          <audio className="w-full" controls src={src} />
        ) : (
          <VideoPlayer src={src} title={content.title} />
        )}
      </div>
      <div className="mt-6 rounded-3xl bg-white p-6 text-center shadow">
        <p className="font-bold">Gostou da amostra? 🎉</p>
        <p className="text-sm text-neutral-500">O programa completo tem muito mais.</p>
        <a
          href="/vendas.html#planos"
          className="mt-4 inline-block rounded-full bg-[#FF4D8D] px-8 py-2 font-semibold text-white"
        >
          Ver planos
        </a>
      </div>
    </div>
  );
}
