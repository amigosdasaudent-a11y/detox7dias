import { notFound, redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { maxPlan, planAllowed } from "@/lib/plan";
import VideoPlayer from "@/components/VideoPlayer";

export const dynamic = "force-dynamic";

export default async function ProdutoPage({
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

  const { data: product } = await supabase
    .from("collections")
    .select("*")
    .eq("id", id)
    .eq("published", true)
    .single();
  if (!product) notFound();
  if (!planAllowed(product.min_plan, userPlan)) {
    return (
      <div className="mx-auto w-full max-w-xl flex-1 px-4 py-16 text-center md:px-8">
        <div className="rounded-3xl bg-white p-8 shadow">
          <h1 className="text-xl font-extrabold">🔒 {product.title}</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Este produto está incluído no plano <b>{product.min_plan}</b> (ou maior).
            Seu plano atual: <b>{userPlan}</b>.
          </p>
          <a
            href="/vendas.html#planos"
            className="mt-6 inline-block rounded-full bg-[#FF4D8D] px-6 py-2 font-semibold text-white"
          >
            Fazer upgrade
          </a>
          <p className="mt-3">
            <a href="/inicio" className="text-sm text-neutral-500">← Voltar</a>
          </p>
        </div>
      </div>
    );
  }

  const { data: allContents } = await supabase
    .from("contents")
    .select("id, type, title, description, cover_path, file_path, external_url, min_plan")
    .eq("collection_id", id)
    .eq("published", true)
    .order("sort_order");
  const contents = allContents || [];

  const svc = createServiceClient();
  async function sign(bucket: string, path: string | null): Promise<string | null> {
    if (!path) return null;
    const { data } = await svc.storage.from(bucket).createSignedUrl(path, 600);
    return data?.signedUrl || null;
  }
  const cover = await sign("covers", product.cover_path);
  const covers = new Map<string, string>();
  for (const c of contents || []) {
    const cov = await sign("covers", c.cover_path);
    if (cov) covers.set(c.id, cov);
  }

  const ebooks = (contents || []).filter((c) => c.type === "ebook");
  const audios = (contents || []).filter((c) => c.type === "audio");
  const videos = (contents || []).filter((c) => c.type === "video");

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-8">
      <a href="/inicio" className="text-sm text-neutral-500">← Todos os produtos</a>
      <div className="mt-3 overflow-hidden rounded-3xl bg-white shadow">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={product.title} className="h-44 w-full object-cover md:h-60" />
        ) : (
          <div className="flex h-44 items-center justify-center bg-gradient-to-br from-[#FF4D8D] to-[#B3124F] text-5xl text-white md:h-60">
            📚
          </div>
        )}
        <div className="p-5">
          <h1 className="text-2xl font-extrabold">{product.title}</h1>
          {product.description && (
            <p className="mt-1 text-sm text-neutral-500">{product.description}</p>
          )}
        </div>
      </div>

      <AulaSection title="📖 E-books" items={ebooks} covers={covers} action="Ler" userPlan={userPlan} />
      <AulaSection title="🎧 Áudios" items={audios} covers={covers} action="Ouvir" userPlan={userPlan} />
      <AulaSection title="▶️ Vídeos" items={videos} covers={covers} action="Assistir" userPlan={userPlan} />

      {ebooks.length + audios.length + videos.length === 0 && (
        <p className="mt-6 text-sm text-neutral-500">Nenhuma aula publicada neste produto ainda.</p>
      )}
    </div>
  );
}

function AulaSection({
  title,
  items,
  covers,
  action,
  userPlan,
}: {
  title: string;
  items: { id: string; title: string; description: string | null; min_plan: string | null }[];
  covers: Map<string, string>;
  action: string;
  userPlan: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {items.map((c) => {
          const locked = !planAllowed(c.min_plan, userPlan);
          const href = locked ? `/ver/${c.id}` : `/assistir/${c.id}`;
          const cover = covers.get(c.id);
          return (
            <a
              key={c.id}
              href={href}
              className="relative block overflow-hidden rounded-2xl bg-white shadow hover:shadow-md"
            >
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover} alt={c.title} className="aspect-[3/4] w-full object-cover" />
              ) : (
                <div className="flex aspect-[3/4] w-full items-center justify-center bg-gradient-to-br from-[#FF4D8D] to-[#B3124F] text-4xl text-white">
                  {c.title[0]}
                </div>
              )}
              {locked && (
                <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-xs font-bold text-white">
                  🔒 {c.min_plan}
                </span>
              )}
              <div className="p-3 relative">
                <p className="line-clamp-2 text-sm font-semibold">{c.title}</p>
                <span className="mt-2 block h-1 w-10 rounded-full bg-[#FF4D8D]" />
                <span className="mt-1 block text-xs font-semibold text-[#FF4D8D]">{action} →</span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
