"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminDashboard() {
  const [counts, setCounts] = useState({ banners: 0, produtos: 0, conteudos: 0, quiz: 0, blog: 0, loja: 0, usuarios: 0 });
  const [payMode, setPayMode] = useState("...");

  useEffect(() => {
    (async () => {
      const [b, t, c, q, p, s, pay] = await Promise.all([
        fetch("/api/admin/banners").then((r) => (r.ok ? r.json() : { banners: [] })),
        fetch("/api/admin/collections").then((r) => (r.ok ? r.json() : { collections: [] })),
        fetch("/api/admin/contents").then((r) => (r.ok ? r.json() : { contents: [] })),
        fetch("/api/admin/quiz").then((r) => (r.ok ? r.json() : { questions: [] })),
        fetch("/api/admin/posts").then((r) => (r.ok ? r.json() : { posts: [] })),
        fetch("/api/admin/store").then((r) => (r.ok ? r.json() : { products: [] })),
        fetch("/api/admin/payments").then((r) => (r.ok ? r.json() : { mode: "test" })),
      ]);
      if (b.banners === undefined && b.error) return (window.location.href = "/admin/login");
      setPayMode(pay.mode === "live" ? "LIVE" : "TESTE");
      setCounts({
        banners: b.banners?.length || 0,
        produtos: t.collections?.length || 0,
        conteudos: c.contents?.length || 0,
        quiz: q.questions?.length || 0,
        blog: p.posts?.length || 0,
        loja: s.products?.length || 0,
        usuarios: 0,
      });
    })();
  }, []);

  const cards = [
    { href: "/admin/banners", title: "Banners", count: counts.banners, desc: "Carrossel do Início", action: "+ Novo Banner" },
    { href: "/admin/produtos", title: "Produtos", count: counts.produtos, desc: "Capas com aulas dentro", action: "+ Novo Produto" },
    { href: "/admin/conteudos", title: "Conteúdos", count: counts.conteudos, desc: "E-books, áudios e vídeos", action: "+ Novo Conteúdo" },
    { href: "/admin/quiz", title: "Quiz", count: counts.quiz, desc: "Perguntas de entrada", action: "+ Nova Pergunta" },
    { href: "/admin/blog", title: "Blog", count: counts.blog, desc: "Artigos", action: "+ Novo Artigo" },
    { href: "/admin/pagamentos", title: "Pagamentos", count: payMode, desc: "Stripe teste/live", action: "Configurar" },
    { href: "/admin/novidades", title: "Novidades", count: "WA", desc: "Avisos no WhatsApp", action: "Enviar" },
    { href: "/admin/integracoes", title: "Integrações", count: "WA+IA", desc: "Evolution WhatsApp e OpenAI", action: "Conectar" },
    { href: "/admin/loja", title: "Loja", count: counts.loja, desc: "Produtos WhatsApp/externos", action: "+ Novo Produto" },
    { href: "/admin/usuarios", title: "Usuários", count: counts.usuarios, desc: "Liberar e revogar acessos", action: "Gerenciar" },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <h1 className="text-2xl font-extrabold">Detox Body Max</h1>
      <p className="text-sm text-neutral-500">Gerencie o conteúdo do aplicativo.</p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
        {cards.map((c) => (
          <div key={c.href} className="rounded-2xl bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">{c.title}</h2>
              <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-sm font-bold text-emerald-700">
                {c.count}
              </span>
            </div>
            <p className="mt-1 text-sm text-neutral-500">{c.desc}</p>
            <Link href={c.href} className="mt-4 inline-block rounded-xl bg-[#FF4D8D] px-4 py-2 text-sm font-bold text-white">
              {c.action}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
