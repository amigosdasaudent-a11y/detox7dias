"use client";

import { useEffect, useState, type ComponentType } from "react";

type PdfReaderProps = {
  url: string;
  title: string;
  cover?: string | null;
};

// O react-pdf/pdf.js é só para o navegador: importar direto num Server Component
// faz o módulo ser avaliado no servidor e quebrar ("document is not defined").
//
// Antes usávamos `next/dynamic(..., { ssr: false })`, mas o wrapper dele
// esconde o componente com `display: none !important` enquanto mostra o
// placeholder. No celular isso zera a altura da página no meio da leitura, o
// navegador limita o scroll a 0 e o livro "volta para o começo". Importando
// dentro do useEffect, o leitor é montado uma única vez e nunca é escondido.
export default function PdfReaderClient(props: PdfReaderProps) {
  const [Reader, setReader] = useState<ComponentType<PdfReaderProps> | null>(null);

  useEffect(() => {
    let alive = true;
    void import("./PdfReader").then((mod) => {
      if (alive) setReader(() => mod.default);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!Reader) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center text-sm text-neutral-500 shadow">
        Abrindo o leitor... 📖
      </div>
    );
  }

  return <Reader {...props} />;
}
