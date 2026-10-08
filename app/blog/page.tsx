import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const supabase = createServiceClient();
  const { data: posts } = await supabase
    .from("posts")
    .select("slug, title, cover_path, published_at")
    .eq("published", true)
    .order("published_at", { ascending: false });

  async function cover(path: string | null): Promise<string | null> {
    if (!path) return null;
    const { data } = await supabase.storage.from("covers").createSignedUrl(path, 600);
    return data?.signedUrl || null;
  }

  const covers = new Map<string, string>();
  for (const p of posts || []) {
    const u = await cover(p.cover_path);
    if (u) covers.set(p.slug, u);
  }

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 bg-[#FFF5F7] px-4 py-10 md:px-8">
      <a href="/inicio" className="text-sm text-neutral-500">← App</a>
      <h1 className="mt-2 text-3xl font-extrabold">Blog</h1>
      {(posts || []).length === 0 && (
        <p className="mt-4 text-sm text-neutral-500">Nenhum artigo publicado ainda.</p>
      )}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
        {(posts || []).map((p) => {
          const img = covers.get(p.slug);
          return (
            <a key={p.slug} href={`/blog/${p.slug}`} className="overflow-hidden rounded-2xl bg-white shadow hover:shadow-md">
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img} alt={p.title} className="aspect-[16/9] w-full object-cover" />
              ) : (
                <div className="flex aspect-[16/9] w-full items-center justify-center bg-gradient-to-br from-[#FF4D8D] to-[#B3124F] text-4xl text-white">
                  📝
                </div>
              )}
              <div className="p-4">
                <p className="font-bold">{p.title}</p>
                {p.published_at && (
                  <p className="mt-1 text-xs text-neutral-500">
                    {new Date(p.published_at).toLocaleDateString("pt-BR")}
                  </p>
                )}
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
