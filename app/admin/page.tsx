import Link from "next/link";
import LogoutButton from "./LogoutButton";
import { adminGuard } from "./layout";

const CARDS = [
  { href: "/admin/banners", title: "Banners", desc: "Imagens do carrossel do Início" },
  { href: "/admin/conteudos", title: "Conteúdos", desc: "PDFs, áudios e vídeos (YouTube, Vimeo, Gumlet)" },
  { href: "/inicio", title: "Ver app", desc: "Abrir a área do cliente" },
];

export default async function AdminPage() {
  await adminGuard();
  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Painel admin</h1>
        <LogoutButton />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {CARDS.map((c) => (
          <Link key={c.href} href={c.href} className="rounded-3xl bg-white p-6 shadow hover:shadow-md">
            <h2 className="font-semibold">{c.title}</h2>
            <p className="mt-1 text-sm text-neutral-500">{c.desc}</p>
          </Link>
        ))}
      </div>
      <p className="mt-6 text-xs text-neutral-500">
        Quiz, blog, loja e usuários entram na próxima rodada do painel.
      </p>
    </div>
  );
}
