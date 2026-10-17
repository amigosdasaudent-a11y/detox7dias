import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import BannerCarousel from "@/components/BannerCarousel";
import NovidadesCard from "@/components/NovidadesCard";
import { maxPlan, planAllowed } from "@/lib/plan";
import { getCustomerPeriodEnd } from "@/lib/stripe";

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

  const { data: ents } = await supabase
    .from("entitlements")
    .select("plan, stripe_customer_id")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (!ents?.length) {
    // Conta GRÁTIS (sem plano ativo): leva para a vitrine do conteúdo grátis.
    const svcFree = createServiceClient();
    const { data: freeContent } = await svcFree
      .from("contents")
      .select("id")
      .eq("published", true)
      .eq("is_free", true)
      .order("sort_order")
      .limit(1)
      .maybeSingle();
    if (freeContent) redirect(`/ver/${freeContent.id}`);

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

  const userPlan = maxPlan((ents || []).map((e) => e.plan));

  // Aviso de renovação para quem está no plano mensal (essencial).
  const monthly = (ents || []).find((e) => e.plan === "essencial");
  const periodEnd = monthly ? await getCustomerPeriodEnd(monthly.stripe_customer_id) : null;
  let renewDays: number | null = null;
  let renewDate = "";
  if (periodEnd) {
    const end = new Date(periodEnd);
    // eslint-disable-next-line react-hooks/purity
    renewDays = Math.ceil((end.getTime() - Date.now()) / 86_400_000);
    renewDate = end.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  if (!profile?.quiz_completed) {
    redirect("/quiz");
  }

  const { data: banners } = await supabase
    .from("banners")
    .select("image_path, link_url")
    .eq("active", true)
    .order("sort_order");

  const { data: allProducts } = await supabase
    .from("collections")
    .select("id, title, description, cover_path, min_plan, category")
    .eq("published", true)
    .order("sort_order");
  const products = (allProducts || []).filter((p) => planAllowed(p.min_plan, userPlan));

  const { data: allLoose } = await supabase
    .from("contents")
    .select("id, type, title, min_plan, category")
    .is("collection_id", null)
    .eq("published", true)
    .order("sort_order")
    .limit(24);
  const loose = (allLoose || []).filter((c) => planAllowed(c.min_plan, userPlan));

  // Agrupa produtos e aulas avulsas pela categoria definida no admin.
  const sections = new Map<
    string,
    { products: typeof products; loose: typeof loose }
  >();
  function bucket(key: string | null | undefined) {
    const k = (key || "").trim() || "Outros";
    if (!sections.has(k)) sections.set(k, { products: [], loose: [] });
    return sections.get(k)!;
  }
  for (const p of products || []) bucket(p.category).products.push(p);
  for (const c of loose) bucket(c.category).loose.push(c);

  // Ordem das categorias definida no admin (as que não estão na lista vão por último).
  const { data: catRows } = await supabase
    .from("categories")
    .select("name, sort_order")
    .order("sort_order");
  const catOrder = new Map((catRows || []).map((c, i) => [c.name as string, i]));
  const orderedSections = [...sections.entries()].sort(
    (a, b) => (catOrder.get(a[0]) ?? 9999) - (catOrder.get(b[0]) ?? 9999)
  );

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
        Olá{profile?.full_name ? `, ${profile.full_name}` : ""} • Plano {userPlan}
      </p>

      {renewDays !== null && (
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="text-lg">⏳</span>
          <span>
            {renewDays > 0 ? (
              <>
                Sua assinatura mensal renova em <b>{renewDays} {renewDays === 1 ? "dia" : "dias"}</b> ({renewDate}).
              </>
            ) : (
              <>Sua assinatura mensal está sendo renovada. Renovação prevista para {renewDate}.</>
            )}
          </span>
        </div>
      )}

      {bannerImgs.length > 0 && (
        <div className="mt-4">
          <BannerCarousel images={bannerImgs} />
        </div>
      )}

      <NovidadesCard />

      <h2 className="mt-8 text-lg font-bold">Meus produtos</h2>
      {sections.size === 0 && (
        <p className="mt-2 text-sm text-neutral-500">Nenhum produto publicado ainda.</p>
      )}

      {orderedSections.map(([category, { products: ps, loose: ls }]) => (
        <div key={category} className="mt-6">
          <h3 className="text-base font-bold text-[#B3124F]">{category}</h3>

          {ps.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {ps.map((p) => {
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
          )}

          {ls.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {ls.map((c) => (
                <a key={c.id} href={`/assistir/${c.id}`} className="rounded-2xl bg-white p-4 shadow hover:shadow-md">
                  <p className="line-clamp-2 text-sm font-semibold">{c.title}</p>
                  <span className="mt-1 block text-xs font-semibold text-[#FF4D8D]">
                    {c.type === "ebook" ? "Ler" : c.type === "audio" ? "Ouvir" : "Assistir"} →
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      ))}

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
