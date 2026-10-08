import { notFound, redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import VideoPlayer from "@/components/VideoPlayer";

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

  const { data: ent } = await supabase
    .from("entitlements")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .single();
  if (!ent) redirect("/inicio");

  const { data: content } = await supabase
    .from("contents")
    .select("*")
    .eq("id", id)
    .eq("published", true)
    .single();
  if (!content) notFound();

  let src = content.external_url as string | null;
  if (!src && content.file_path) {
    const svc = createServiceClient();
    const { data } = await svc.storage
      .from("content-files")
      .createSignedUrl(content.file_path, 600);
    src = data?.signedUrl || null;
  }
  if (!src) notFound();

  const isAudio = content.type === "audio";

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 md:px-8">
      <a href="/inicio" className="text-sm text-neutral-500">← Início</a>
      <h1 className="mt-2 text-2xl font-bold">{content.title}</h1>
      {content.description && (
        <p className="mt-1 text-sm text-neutral-500">{content.description}</p>
      )}
      <div className="mt-4">
        {isAudio ? (
          <audio className="w-full" controls src={src} />
        ) : (
          <VideoPlayer src={src} title={content.title} />
        )}
      </div>
    </div>
  );
}
