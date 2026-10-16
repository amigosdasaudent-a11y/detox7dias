"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

// Renderiza a página só quando ela se aproxima da tela (rolagem contínua leve).
function LazyPage({
  pageNumber,
  width,
  onActive,
  onError,
}: {
  pageNumber: number;
  width: number;
  onActive: (n: number) => void;
  onError: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setShow(true);
      },
      { rootMargin: "800px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) onActive(pageNumber);
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [pageNumber, onActive]);

  return (
    <div ref={ref} className="mb-3 flex justify-center">
      {show ? (
        <Page pageNumber={pageNumber} width={width} loading="" onRenderError={onError} />
      ) : (
        <div className="rounded bg-white/40" style={{ width, height: Math.round(width * 1.4) }} />
      )}
    </div>
  );
}

export default function PdfReader({
  url,
  title,
  cover,
}: {
  url: string;
  title: string;
  cover?: string | null;
}) {
  const [mode, setMode] = useState<"ask" | "read" | "google">("ask");
  const [pages, setPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [failed, setFailed] = useState(false);
  const [failMsg, setFailMsg] = useState("");
  const [boxWidth, setBoxWidth] = useState(350);
  const boxRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function measure() {
      if (boxRef.current) {
        setBoxWidth(Math.min(700, Math.max(280, boxRef.current.clientWidth - 16)));
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [mode]);

  if (mode === "ask") {
    return (
      <div className="rounded-2xl bg-white p-6 text-center shadow">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={title}
            className="mx-auto mb-4 max-h-72 w-auto rounded-xl object-contain shadow"
          />
        ) : (
          <p className="font-bold">📖 {title}</p>
        )}
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

  if (mode === "google") {
    return (
      <div>
        <button onClick={() => setMode("ask")} className="mb-2 text-sm text-neutral-500">
          ← Voltar
        </button>
        <iframe
          src={`https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(url)}`}
          title={title}
          className="h-[70vh] w-full rounded-2xl bg-white shadow"
        />
      </div>
    );
  }

  return (
    <div ref={topRef}>
      <div className="sticky top-0 z-20 mb-2 flex flex-wrap items-center gap-2 rounded-xl bg-[#FFF5F7]/95 px-2 py-2 shadow-sm backdrop-blur">
        <button onClick={() => setMode("ask")} className="text-sm text-neutral-500">
          ← Voltar
        </button>
        <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold shadow">
          {currentPage}/{pages || "…"}
        </span>
        <button
          onClick={() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className="rounded-full bg-white px-3 py-1 text-sm font-semibold shadow"
        >
          ⬆ Topo
        </button>
        <div className="ml-auto flex items-center gap-1 rounded-full bg-white px-2 py-1 shadow">
          <button
            onClick={() => setZoom((s) => Math.max(0.6, +(s - 0.2).toFixed(1)))}
            className="px-2 font-bold"
            aria-label="Diminuir texto"
          >
            A-
          </button>
          <span className="text-xs font-semibold">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((s) => Math.min(2, +(s + 0.2).toFixed(1)))}
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
          {failMsg && <p className="mx-auto mt-2 max-w-full truncate font-mono text-xs text-neutral-400">{failMsg}</p>}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              onClick={() => {
                setFailed(false);
                setFailMsg("");
                setMode("google");
              }}
              className="rounded-full bg-[#FF4D8D] px-6 py-2 font-semibold text-white"
            >
              Tentar pelo Google
            </button>
            <a
              href={url}
              download
              target="_blank"
              rel="noreferrer"
              className="rounded-full border px-6 py-2 font-semibold"
            >
              ⬇️ Baixar PDF
            </a>
          </div>
        </div>
      ) : (
        <div ref={boxRef} className="rounded-2xl bg-neutral-200 p-2 shadow">
          <Document
            file={url}
            onLoadSuccess={({ numPages }) => setPages(numPages)}
            onLoadError={(err) => {
              setFailed(true);
              setFailMsg(err instanceof Error ? err.message : "erro desconhecido");
            }}
            loading={<p className="p-8 text-center text-sm">Abrindo... 📖</p>}
          >
            {Array.from({ length: pages }, (_, i) => (
              <LazyPage
                key={i + 1}
                pageNumber={i + 1}
                width={Math.round(boxWidth * zoom)}
                onActive={setCurrentPage}
                onError={() => setFailed(true)}
              />
            ))}
          </Document>
        </div>
      )}
    </div>
  );
}
