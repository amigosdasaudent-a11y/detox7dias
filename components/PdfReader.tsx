"use client";

// Precisa vir ANTES do react-pdf: instala APIs que o pdf.js 6 exige e que
// faltam em navegadores de celular mais antigos (iOS < 17.4, Chrome < 119).
import "@/lib/pdf-polyfills";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// O wrapper carrega os polyfills dentro do worker antes do worker oficial.
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.polyfilled.mjs";

// Proporção (altura/largura) de uma folha A4 em pé, usada até a real chegar.
const DEFAULT_RATIO = 1.414;
// Distância (px) para montar/desmontar a página em volta da tela.
const NEAR_MARGIN = 1500;
// Mede a proporção exata só até este número de páginas (PDFs enormes).
const MAX_MEASURED_PAGES = 120;

// Um único listener de rolagem compartilhado por todas as páginas. Medir a
// posição na tela é mais previsível que IntersectionObserver (que em alguns
// webviews dispara uma vez e para, ou avisa antes do layout existir).
const nearChecks = new Set<() => void>();
let nearTimer = 0;
let scrollWatched = false;

// setTimeout (e não requestAnimationFrame): em webviews de app o rAF às vezes
// fica parado, e aí a janela de páginas nunca acompanharia a rolagem.
function notifyNearChecks() {
  if (nearTimer) return;
  nearTimer = window.setTimeout(() => {
    nearTimer = 0;
    for (const check of nearChecks) check();
  }, 60);
}

function watchScrollOnce() {
  if (scrollWatched || typeof window === "undefined") return;
  scrollWatched = true;
  window.addEventListener("scroll", notifyNearChecks, { passive: true });
  window.addEventListener("resize", notifyNearChecks);
  window.addEventListener("orientationchange", notifyNearChecks);
}

type PdfDoc = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<{
    getViewport: (params: { scale: number }) => { width: number; height: number };
  }>;
};

// Posição/modo ficam salvos no aparelho: se o navegador recarregar a aba
// (o que o celular faz quando falta memória), a pessoa volta na mesma página.
function storeKey(kind: "pos" | "mode") {
  return `pdf-${kind}:${window.location.pathname}`;
}

function readStore(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStore(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // navegação privada / storage cheio: só ignora
  }
}

type LazyPageProps = {
  pageNumber: number;
  width: number;
  ratio: number;
  dpr: number;
  onActive: (n: number) => void;
  onError: (message?: string) => void;
};

// Só mantém na memória as páginas perto da tela. O celular (principalmente o
// iPhone) mata a aba quando há muitos canvases grandes; ao voltar a rolar,
// a página é desenhada de novo — o espaço dela já está reservado, então o
// texto não "pula" nem volta para o começo.
const LazyPage = memo(function LazyPage({
  pageNumber,
  width,
  ratio,
  dpr,
  onActive,
  onError,
}: LazyPageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const nearRef = useRef(false);
  const height = Math.round(width * ratio);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const check = () => {
      const r = el.getBoundingClientRect();
      // Altura 0 = layout ainda não pronto: nesse instante tudo parece estar
      // na mesma posição e o livro inteiro seria montado de uma vez.
      if (r.height === 0) return;

      const visible = r.bottom > -NEAR_MARGIN && r.top < window.innerHeight + NEAR_MARGIN;
      if (visible !== nearRef.current) {
        nearRef.current = visible;
        setNear(visible);
      }

      const middle = window.innerHeight / 2;
      if (r.top <= middle && r.bottom >= middle) onActive(pageNumber);
    };

    nearChecks.add(check);
    watchScrollOnce();
    check();
    // O layout pode assentar depois do primeiro frame (fontes, CSS, PDF):
    // confere de novo pouco depois.
    const t1 = window.setTimeout(check, 250);
    const t2 = window.setTimeout(check, 1000);

    return () => {
      nearChecks.delete(check);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [pageNumber, onActive, width, ratio]);

  return (
    <div
      ref={ref}
      data-page={pageNumber}
      className="mb-3 flex justify-center"
      style={{ minHeight: height }}
    >
      {near ? (
        <Page
          pageNumber={pageNumber}
          width={width}
          devicePixelRatio={dpr}
          renderAnnotationLayer={false}
          loading=""
          onRenderError={(err) =>
            onError(err instanceof Error ? err.message : String(err || "erro ao desenhar a página"))
          }
        />
      ) : (
        <div className="rounded bg-white/40" style={{ width, height }} />
      )}
    </div>
  );
});

export default function PdfReader({
  url,
  title,
  cover,
}: {
  url: string;
  title: string;
  cover?: string | null;
}) {
  const [mode, setMode] = useState<"ask" | "read" | "google">(() =>
    typeof window !== "undefined" && readStore(storeKey("mode")) === "read" ? "read" : "ask"
  );
  const [pages, setPages] = useState(0);
  const [ratios, setRatios] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window === "undefined") return 1;
    const saved = Number(readStore(storeKey("pos")) || 0);
    return Number.isFinite(saved) && saved > 0 ? saved : 1;
  });
  const [zoom, setZoom] = useState(1);
  const [failed, setFailed] = useState(false);
  const [failMsg, setFailMsg] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [boxWidth, setBoxWidth] = useState(350);
  // No celular, 3x de resolução por página estoura a memória do navegador.
  const [dpr] = useState(() =>
    typeof window === "undefined"
      ? 1
      : Math.min(window.devicePixelRatio || 1, window.innerWidth < 640 ? 1.5 : 2)
  );
  const boxRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const currentPageRef = useRef(currentPage);
  const startPageRef = useRef(currentPage);
  const zoomRef = useRef(1);
  const restoredRef = useRef(false);

  const scrollToPage = useCallback((page: number) => {
    const el = boxRef.current?.querySelector<HTMLElement>(`[data-page="${page}"]`);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top: Math.max(0, top) });
  }, []);

  useEffect(() => {
    if (mode === "read") writeStore(storeKey("mode"), "read");
  }, [mode]);

  // Mede a largura pelo próprio bloco (ResizeObserver). Antes era no "resize"
  // da janela: no celular, esconder/mostrar a barra de endereço ao rolar dispara
  // resize e redesenha TODAS as páginas, o que estoura a memória.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    let last = 0;
    const update = () => {
      const next = Math.round(Math.min(700, Math.max(280, el.clientWidth - 16)));
      if (Math.abs(next - last) >= 8) {
        last = next;
        setBoxWidth(next);
      }
    };
    update();
    const ro = typeof ResizeObserver === "function" ? new ResizeObserver(update) : null;
    ro?.observe(el);
    window.addEventListener("orientationchange", update);
    return () => {
      ro?.disconnect();
      window.removeEventListener("orientationchange", update);
    };
  }, [mode]);

  const handleLoad = useCallback(async (doc: PdfDoc) => {
    const total = doc.numPages;
    const measured = Math.min(total, MAX_MEASURED_PAGES);
    let list: number[] = [];
    try {
      list = await Promise.all(
        Array.from({ length: measured }, async (_, i) => {
          try {
            const page = await doc.getPage(i + 1);
            const vp = page.getViewport({ scale: 1 });
            return vp.width > 0 ? vp.height / vp.width : DEFAULT_RATIO;
          } catch {
            return DEFAULT_RATIO;
          }
        })
      );
    } catch {
      list = [];
    }
    if (list.length < total) {
      const fallback = list[0] || DEFAULT_RATIO;
      list = list.concat(Array.from({ length: total - list.length }, () => fallback));
    }
    setRatios(list);
    setPages(total);
  }, []);

  const handleError = useCallback((message?: string) => {
    setFailed(true);
    setFailMsg(message || "");
  }, []);

  const handleActive = useCallback((n: number) => {
    setCurrentPage(n);
  }, []);

  // Volta para a página salva assim que o livro está pronto.
  useEffect(() => {
    if (!pages || restoredRef.current) return;
    const saved = startPageRef.current;
    if (saved <= 1 || saved > pages) {
      restoredRef.current = true;
      return;
    }
    // Marca só depois de rolar: em dev os efeitos rodam duas vezes e o
    // "cleanup" cancelaria a única tentativa.
    const timer = window.setTimeout(() => {
      restoredRef.current = true;
      scrollToPage(saved);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pages, scrollToPage]);

  useEffect(() => {
    currentPageRef.current = currentPage;
    if (!restoredRef.current) return;
    writeStore(storeKey("pos"), String(currentPage));
  }, [currentPage]);

  // Mudar o zoom muda a altura de tudo: reancora na página que estava lendo.
  useEffect(() => {
    if (zoomRef.current === zoom) return;
    zoomRef.current = zoom;
    const timer = window.setTimeout(() => scrollToPage(currentPageRef.current), 0);
    return () => window.clearTimeout(timer);
  }, [zoom, scrollToPage]);

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
          {pages ? Math.min(currentPage, pages) : currentPage}/{pages || "…"}
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
          <p className="mx-auto mt-2 max-w-md text-sm text-neutral-600">
            Pode ser o navegador do celular. Tente de novo, abra o PDF direto no navegador
            ou baixe o arquivo.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              onClick={() => {
                setFailed(false);
                setFailMsg("");
                setRetryKey((k) => k + 1);
              }}
              className="rounded-full bg-[#FF4D8D] px-6 py-2 font-semibold text-white"
            >
              Tentar de novo
            </button>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-[#FF4D8D] px-6 py-2 font-semibold text-[#FF4D8D]"
            >
              Abrir no navegador
            </a>
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
          <button
            onClick={() => {
              setFailed(false);
              setFailMsg("");
              setMode("google");
            }}
            className="mt-3 text-xs text-neutral-500 underline"
          >
            Tentar pelo Google
          </button>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 block w-full text-xs text-neutral-500 underline"
          >
            Recarregar a página
          </button>
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-xs text-neutral-400">
              Detalhes técnicos (para suporte)
            </summary>
            <p className="mt-2 break-all font-mono text-xs text-neutral-400">
              {failMsg || "erro sem mensagem"}
              {typeof navigator !== "undefined" ? ` · ${navigator.userAgent}` : ""}
            </p>
          </details>
        </div>
      ) : (
        <div ref={boxRef} className="rounded-2xl bg-neutral-200 p-2 shadow">
          <Document
            key={retryKey}
            file={url}
            onLoadSuccess={(doc) => {
              void handleLoad(doc as unknown as PdfDoc);
            }}
            onLoadError={(err) => {
              setFailed(true);
              setFailMsg(err instanceof Error ? err.message : String(err || "erro desconhecido"));
            }}
            loading={<p className="p-8 text-center text-sm">Abrindo... 📖</p>}
          >
            {pages === 0 ? (
              <p className="p-8 text-center text-sm">Preparando o livro... 📖</p>
            ) : (
              Array.from({ length: pages }, (_, i) => (
                <LazyPage
                  key={i + 1}
                  pageNumber={i + 1}
                  width={Math.round(boxWidth * zoom)}
                  ratio={ratios[i] || DEFAULT_RATIO}
                  dpr={dpr}
                  onActive={handleActive}
                  onError={handleError}
                />
              ))
            )}
          </Document>
        </div>
      )}
    </div>
  );
}
