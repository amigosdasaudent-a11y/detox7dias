"use client";

import dynamic from "next/dynamic";

// O react-pdf/pdf.js é só para o navegador: importar direto num Server Component
// faz o módulo ser avaliado no servidor e quebrar ("document is not defined").
const PdfReader = dynamic(() => import("./PdfReader"), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl bg-white p-8 text-center text-sm text-neutral-500 shadow">
      Abrindo o leitor... 📖
    </div>
  ),
});

export default PdfReader;
