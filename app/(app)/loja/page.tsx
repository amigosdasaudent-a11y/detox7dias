import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LojaPage() {
  const supabase = createServiceClient();
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .order("sort_order");

  async function img(path: string | null): Promise<string | null> {
    if (!path) return null;
    const { data } = await supabase.storage.from("covers").createSignedUrl(path, 600);
    return data?.signedUrl || null;
  }
  const imgs = new Map<string, string>();
  for (const p of products || []) {
    const u = await img(p.image_path);
    if (u) imgs.set(p.id, u);
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 bg-[#FFF5F7] px-4 py-10 md:px-8">
      <a href="/inicio" className="text-sm text-neutral-500">← App</a>
      <h1 className="mt-2 text-3xl font-extrabold">Loja</h1>
      {(products || []).length === 0 && (
        <p className="mt-4 text-sm text-neutral-500">Nenhum produto à venda no momento.</p>
      )}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {(products || []).map((p) => {
          const cover = imgs.get(p.id);
          return (
            <div key={p.id} className="overflow-hidden rounded-2xl bg-white shadow">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover} alt={p.name} className="aspect-[16/10] w-full object-cover" />
              ) : (
                <div className="flex aspect-[16/10] w-full items-center justify-center bg-gradient-to-br from-[#FF4D8D] to-[#B3124F] text-4xl text-white">
                  🛍
                </div>
              )}
              <div className="p-4">
                <p className="font-bold">{p.name}</p>
                {p.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{p.description}</p>
                )}
                <div className="mt-2 flex items-center gap-2">
                  {p.price_label && <p className="font-extrabold text-[#059669]">{p.price_label}</p>}
                  {p.grants_plan && (
                    <span className="rounded-full bg-[#FFF0F5] px-2 py-0.5 text-xs font-bold text-[#FF4D8D]">
                      Libera o app
                    </span>
                  )}
                </div>
                <a
                  href={p.target_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 block rounded-full bg-[#FF4D8D] py-2 text-center font-semibold text-white"
                >
                  {p.kind === "whatsapp" ? "Comprar no WhatsApp" : "Comprar"}
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
