"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ITEMS = [
  { href: "/inicio", label: "Início", icon: "🏠" },
  { href: "/loja", label: "Loja", icon: "🛍" },
  { href: "/blog", label: "Blog", icon: "📰" },
  { href: "/imc", label: "IMC", icon: "🧮" },
  { href: "/salvos", label: "Módulos salvos", icon: "⭐" },
  { href: "/progresso", label: "Meu progresso", icon: "📊" },
  { href: "/instalar", label: "Instalar App", icon: "⬇️" },
  { href: "/pesquisar", label: "Pesquisar", icon: "🔍" },
  { href: "/alterar-senha", label: "Alterar senha", icon: "🔑" },
];

export default function Sidebar({ email }: { email: string }) {
  const path = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const initial = (email?.[0] || "?").toUpperCase();

  const menu = (
    <nav className="flex flex-col gap-1 p-4">
      {ITEMS.map((it) => {
        const active = path === it.href || path.startsWith(it.href + "/");
        return (
          <Link
            key={it.href}
            href={it.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-white/10 text-[#FF6FA5]"
                : "text-neutral-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className="w-5 text-center">{it.icon}</span>
            {it.label}
          </Link>
        );
      })}
      <button
        onClick={logout}
        className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-300 hover:bg-white/5 hover:text-white"
      >
        <span className="w-5 text-center">🚪</span>
        Sair
      </button>
    </nav>
  );

  return (
    <>
      {/* Barra mobile */}
      <div className="flex items-center justify-between bg-[#232326] px-4 py-3 text-white md:hidden">
        <span className="font-bold">Detox Body Max</span>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir menu"
          className="rounded-lg border border-white/20 px-3 py-1"
        >
          ☰
        </button>
      </div>
      {/* Lateral desktop */}
      <aside className="hidden w-60 shrink-0 flex-col bg-[#232326] md:flex">
        <div className="flex items-center gap-3 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF4D8D] font-bold text-white">
            {initial}
          </div>
          <div>
            <p className="font-bold text-white">Detox Body Max</p>
            <p className="max-w-[10rem] truncate text-xs text-neutral-400">{email}</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">{menu}</div>
      </aside>
      {/* Gaveta mobile */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-[#232326]">
            <div className="flex items-center gap-3 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF4D8D] font-bold text-white">
                {initial}
              </div>
              <p className="font-bold text-white">Detox Body Max</p>
            </div>
            {menu}
          </aside>
        </div>
      )}
    </>
  );
}
