import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import BannerCarousel from "@/components/BannerCarousel";

export const dynamic = "force-dynamic";

export default async function InicioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, quiz_completed")
    .eq("id", user.id)
    .single();

  const { data: entitlement } = await supabase
    .from("entitlements")
    .select("plan, status, expires_at")
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
            e-mail, entre com ele ou clique em reenviar acesso.
          </p>
          <a
            href="/"
            className="mt-6 inline-block rounded-full bg-[#FF4D8D] px-6 py-2 font-semibold text-white"
          >
            Comprar acesso
          </a>
        </div>
      </div>
    );
  }

  if (!profile?.quiz_completed) {
    redirect("/quiz");
  }

  // Banners + conteúdos publicados (acesso já verificado acima)
  const { data: banners } = await supabase
    .from("banners")
    .select("image_path, link_url")
    .eq("active", true)
    .order("sort_order");
  const { data: contents } = await supabase
    .from("contents")
    .select("id, type, title, description, cover_path, file_path, external_url")
    .eq("published", true)
    .order("sort_order");

  const svc = createServiceClient();
  async function sign(bucket: string, path: string | null): Promise<string | null> {
    if (!path) return null;
    const { data } = await svc.storage.from(bucket).createSignedUrl(path, 600);
    return data?.signedUrl || null;
  }
  const bannerImgs = await Promise.all(
    (banners || []).map(async (b) => ({
      src: (await sign("covers", b.image_path)) || "",
      link: b.link_url,
    }))
  ).then((all) => all.filter((b) => b.src));

  const ebooks = contents?.filter((c) => c.type === "ebook") || [];
  const audios = contents?.filter((c) => c.type === "audio") || [];
  const videos = contents?.filter((c) => c.type === "video") || [];
  const ebookUrls = new Map<string, string>();
  for (const e of ebooks) {
    if (e.file_path) {
      const u = await sign("content-files", e.file_path);
      if (u) ebookUrls.set(e.id, u);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <h1 className="text-2xl font-bold">
        Olá{profile?.full_name ? `, ${profile.full_name}` : ""} 👋
      </h1>
      <p className="text-sm text-neutral-500">
        Plano {entitlement.plan} • ativo
      </p>

      {bannerImgs.length > 0 && (
        <div className="mt-6">
          <BannerCarousel images={bannerImgs} />
        </div>
      )}

      <Section title="📖 E-books" items={ebooks} kind="ebook" urls={ebookUrls} />
      <Section title="🎧 Áudios" items={audios} kind="media" />
      <Section title="▶️ Vídeos" items={videos} kind="media" />

      {ebooks.length + audios.length + videos.length === 0 && (
        <p className="mt-6 text-sm text-neutral-500">
          Nenhum conteúdo publicado ainda. O admin adiciona em /admin/conteudos.
        </p>
      )}

      <div className="mt-6 rounded-3xl bg-white p-6 shadow">
        <h2 className="font-semibold">IMC com IA (JEV)</h2>
        <p className="text-sm text-neutral-500">
          Calculadora + guardrail JEV entra na Fase 5.
        </p>
      </div>
    </div>
  );
}

function Section({
  title,
  items,
  kind,
  urls,
}: {
  title: string;
  items: { id: string; title: string; description: string | null }[];
  kind: "ebook" | "media";
  urls?: Map<string, string>;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-3">
        {items.map((c) => {
          const href =
            kind === "ebook" ? urls?.get(c.id) || "#" : `/assistir/${c.id}`;
          return (
            <a
              key={c.id}
              href={href}
              {...(kind === "ebook"
                ? { target: "_blank", rel: "noreferrer" }
                : {})}
              className="rounded-3xl bg-white p-5 shadow hover:shadow-md"
            >
              <h3 className="font-semibold">{c.title}</h3>
              {c.description && (
                <p className="mt-1 line-clamp-2 text-sm text-neutral-500">
                  {c.description}
                </p>
              )}
              <span className="mt-3 inline-block rounded-full bg-[#FF4D8D] px-4 py-1 text-sm font-semibold text-white">
                {kind === "ebook" ? "Ler" : "Assistir"}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
