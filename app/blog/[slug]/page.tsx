import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ArtigoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createServiceClient();
  const { data: post } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();
  if (!post) notFound();

  let cover: string | null = null;
  if (post.cover_path) {
    const { data } = await supabase.storage
      .from("covers")
      .createSignedUrl(post.cover_path, 600);
    cover = data?.signedUrl || null;
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 bg-[#FFF5F7] px-4 py-10 md:px-8">
      <a href="/blog" className="text-sm text-neutral-500">← Blog</a>
      <h1 className="mt-2 text-3xl font-extrabold">{post.title}</h1>
      {post.published_at && (
        <p className="mt-1 text-xs text-neutral-500">
          {new Date(post.published_at).toLocaleDateString("pt-BR")}
        </p>
      )}
      {cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt={post.title} className="mt-4 w-full rounded-3xl object-cover shadow" />
      )}
      <div className="prose mt-6 max-w-none whitespace-pre-wrap text-neutral-800">
        <ReactMarkdown>{post.body_md || ""}</ReactMarkdown>
      </div>
    </div>
  );
}
