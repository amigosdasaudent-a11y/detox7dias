import { notFound, redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { maxPlan, planAllowed } from "@/lib/plan";
import VideoPlayer from "@/components/VideoPlayer";
import PdfReader from "@/components/PdfReaderClient";

export const dynamic = "force-dynamic";

export default async function AssistirPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: ents } = await supabase
    .from("entitlements")
    .select("plan")
    .eq("user_id", user.id)
    .eq("status", "active");
  if (!ents?.length) redirect("/inicio");
  const userPlan = maxPlan(ents.map((e) => e.plan));

  const { data: content } = await supabase
    .from("contents")
    .select("*")
    .eq("id", id)
    .eq("published", true)
    .single();
  if (!content) notFound();
  if (!planAllowed(content.min_plan, userPlan)) redirect(`/ver/${id}`);

  let src = content.external_url as string | null;
  if (!src && content.file_path) {
    const svc = createServiceClient();
    // 1h: dá tempo de abrir e ler no celular sem o link expirar no meio.
    const { data } = await svc.storage
      .from("content-files")
      .createSignedUrl(content.file_path, 3600);
    src = data?.signedUrl || null;
  }
  if (!src) notFound();

  const isAudio = content.type === "audio";
  const isEbook = content.type === "ebook";

  let coverUrl: string | null = null;
  if (content.cover_path) {
    const { data } = await createServiceClient()
      .storage.from("covers")
      .createSignedUrl(content.cover_path, 3600);
    coverUrl = data?.signedUrl || null;
  }

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 md:px-8">
      <a href="/inicio" className="text-sm text-neutral-500">← Início</a>
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
    </div>
  );
}
