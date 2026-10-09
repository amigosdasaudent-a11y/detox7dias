import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import BannerCarousel from "@/components/BannerCarousel";
import NovidadesCard from "@/components/NovidadesCard";

export const dynamic = "force-dynamic";

export default async function InicioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, quiz_completed")
    .eq("id", user.id)
    .single();

  const { data: entitlement } = await supabase
    .from("entitlements")
    .select("plan")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!entitlement) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow">
          <h1 className="text-xl font-bold">Acesso não encontrado</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Não achei pagamento ativo para {user.email}. Se você pagou com outro
            e-mail, entre com ele.
          </p>
          <a
            href="/vendas.html#planos"
            className="mt-6 inline-block rounded-full bg-[#FF4D8D] px-6 py-2 font-semibold text-white"
          >
            Ver planos
          </a>
        </div>
      </div>
    );
  }

  if (!profile?.quiz_completed) {
    redirect("/quiz");
  }

  const { data: banners } = await supabase
    .from("banners")
    .select("image_path, link_url")
    .eq("active", true)
    .order("sort_order");

  const { data: products } = await supabase
    .from("collections")
    .select("id, title, description, cover_path")
    .eq("published", true)
    .order("sort_order");

  const { data: loose } = await supabase
    .from("contents")
    .select("id, type, title")
    .is("collection_id", null)
    .eq("published", true)
    .order("sort_order")
    .limit(8);

  const svc = createServiceClient();
  async function sign(bucket: string, path: string | null): Promise<string | null> {
    if (!path) return null;
    const { data } = await svc.storage.from(bucket).createSignedUrl(path, 600);
    return data?.signedUrl || null;
  }
  const bannerImgs = (
    await Promise.all(
      (banners || []).map(async (b) => ({
        src: (await sign("covers", b.image_path)) || "",
        link: b.link_url,
      }))
    )
  ).filter((b) => b.src);

  const productCovers = new Map<string, string>();
  for (const p of products || []) {
    const u = await sign("covers", p.cover_path);
    if (u) productCovers.set(p.id, u);
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-8">
      <p className="text-sm text-neutral-500">
        Olá{profile?.full_name ? `, ${profile.full_name}` : ""} • Plano {entitlement.plan}
      </p>

      {bannerImgs.length > 0 && (
        <div className="mt-4">
          <BannerCarousel images={bannerImgs} />
        </div>
      )}

      <NovidadesCard />

      <h2 className="mt-8 text-lg font-bold">Meus produtos</h2>
      {(products || []).length === 0 && (
        <p className="mt-2 text-sm text-neutral-500">Nenhum produto publicado ainda.</p>
      )}
      <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {(products || []).map((p) => {
          const cover = productCovers.get(p.id);
          return (
            <a key={p.id} href={`/produto/${p.id}`} className="overflow-hidden rounded-2xl bg-white shadow hover:shadow-md">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover} alt={p.title} className="aspect-[16/10] w-full object-cover" />
              ) : (
                <div className="flex aspect-[16/10] w-full items-center justify-center bg-gradient-to-br from-[#FF4D8D] to-[#B3124F] text-4xl text-white">
                  📚
                </div>
              )}
              <div className="p-4">
                <p className="font-bold">{p.title}</p>
                {p.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{p.description}</p>
                )}
                <span className="mt-2 block h-1 w-10 rounded-full bg-[#FF4D8D]" />
                <span className="mt-1 block text-xs font-semibold text-[#FF4D8D]">Abrir →</span>
              </div>
            </a>
          );
        })}
      </div>

      {(loose || []).length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold">Avulsos</h2>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {loose!.map((c) => (
              <a key={c.id} href={`/assistir/${c.id}`} className="rounded-2xl bg-white p-4 shadow hover:shadow-md">
                <p className="line-clamp-2 text-sm font-semibold">{c.title}</p>
                <span className="mt-1 block text-xs font-semibold text-[#FF4D8D]">
                  {c.type === "ebook" ? "Ler" : c.type === "audio" ? "Ouvir" : "Assistir"} →
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 rounded-3xl bg-white p-6 shadow">
        <h2 className="font-semibold">⚖️ Meu IMC</h2>
        <p className="text-sm text-neutral-500">Calculadora com IA em breve.</p>
        <a href="/imc" className="mt-3 inline-block rounded-full bg-[#FF4D8D] px-5 py-1.5 text-sm font-semibold text-white">
          Calcular
        </a>
      </div>
    </div>
  );
}
