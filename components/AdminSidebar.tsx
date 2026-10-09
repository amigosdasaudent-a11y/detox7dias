"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/app/admin/LogoutButton";

const ITEMS = [
  { href: "/admin/banners", label: "Banners", icon: "🖼" },
  { href: "/admin/produtos", label: "Produtos", icon: "📚" },
  { href: "/admin/conteudos", label: "Conteúdos", icon: "📦" },
  { href: "/admin/quiz", label: "Quiz", icon: "❓" },
  { href: "/admin/blog", label: "Blog", icon: "📝" },
  { href: "/admin/loja", label: "Loja", icon: "🛍" },
  { href: "/admin/usuarios", label: "Usuários", icon: "👥" },
  { href: "/admin/pagamentos", label: "Pagamentos", icon: "💳" },
  { href: "/admin/integracoes", label: "Integrações", icon: "🔌" },
  { href: "/inicio", label: "Ver app", icon: "👁" },
];

export default function AdminSidebar() {
  const path = usePathname();
  return (
    <aside className="flex w-60 shrink-0 flex-col bg-white">
      <div className="border-b p-5">
        <p className="text-lg font-extrabold">
          <span className="text-[#FF4D8D]">◍</span> Detox Admin
        </p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {ITEMS.map((it) => {
          const active = path === it.href || path.startsWith(it.href + "/");
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium ${
                active
                  ? "bg-[#FFF0F5] text-[#FF4D8D]"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              <span className="w-5 text-center">{it.icon}</span>
              {it.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <p className="truncate text-sm font-semibold">Admin</p>
        <div className="mt-1 text-sm text-neutral-500">
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}
