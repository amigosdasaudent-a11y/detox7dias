"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@6.3.289/build/pdf.worker.min.mjs`;

export default function PdfReader({ url, title }: { url: string; title: string }) {
  const [mode, setMode] = useState<"ask" | "read">("ask");
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [failed, setFailed] = useState(false);

  if (mode === "ask") {
    return (
      <div className="rounded-2xl bg-white p-6 text-center shadow">
        <p className="font-bold">📖 {title}</p>
        <p className="mt-1 text-sm text-neutral-500">Como prefere?</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            onClick={() => setMode("read")}
            className="rounded-full bg-[#FF4D8D] px-6 py-2 font-semibold text-white"
          >
            Ler aqui
          </button>
          <a
            href={url}
            download
            target="_blank"
            rel="noreferrer"
            className="rounded-full border px-6 py-2 font-semibold"
          >
            ⬇️ Baixar
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <button onClick={() => setMode("ask")} className="text-sm text-neutral-500">
          ← Voltar
        </button>
        <div className="mx-auto flex items-center gap-1 rounded-full bg-white px-2 py-1 shadow">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-2 text-lg disabled:opacity-30"
            aria-label="Página anterior"
          >
            ‹
          </button>
          <span className="text-sm font-semibold">
            {page}/{pages || "…"}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages || p + 1, p + 1))}
            disabled={pages > 0 && page >= pages}
            className="px-2 text-lg disabled:opacity-30"
            aria-label="Próxima página"
          >
            ›
          </button>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-white px-2 py-1 shadow">
          <button
            onClick={() => setScale((s) => Math.max(0.6, +(s - 0.2).toFixed(1)))}
            className="px-2 font-bold"
            aria-label="Diminuir texto"
          >
            A-
          </button>
          <span className="text-xs font-semibold">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale((s) => Math.min(2.5, +(s + 0.2).toFixed(1)))}
            className="px-2 font-bold"
            aria-label="Aumentar texto"
          >
            A+
          </button>
        </div>
      </div>

      <p className="mb-2 rounded-xl bg-amber-50 p-2 text-center text-xs font-semibold text-amber-700 portrait:block landscape:hidden">
        📱 Para melhor leitura, gire o celular na horizontal ↔️
      </p>

      {failed ? (
        <div className="rounded-2xl bg-white p-6 text-center shadow">
          <p className="font-semibold">Não consegui abrir aqui 😕</p>
          <p className="mt-1 text-sm text-neutral-500">Baixe o arquivo para ler no seu celular:</p>
          <a
            href={url}
            download
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-block rounded-full bg-[#FF4D8D] px-6 py-2 font-semibold text-white"
          >
            ⬇️ Baixar PDF
          </a>
        </div>
      ) : (
        <div className="overflow-auto rounded-2xl bg-neutral-200 p-2 shadow">
          <Document
            file={url}
            onLoadSuccess={({ numPages }) => setPages(numPages)}
            onLoadError={() => setFailed(true)}
            loading={<p className="p-8 text-center text-sm">Abrindo... 📖</p>}
          >
            <Page
              pageNumber={page}
              scale={scale}
              onRenderError={() => setFailed(true)}
              loading=""
            />
          </Document>
        </div>
      )}
    </div>
  );
}
