"use client";

import { useState } from "react";

export default function PdfReader({ url, title }: { url: string; title: string }) {
  const [mode, setMode] = useState<"ask" | "read">("ask");

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
      <button onClick={() => setMode("ask")} className="mb-2 text-sm text-neutral-500">
        ← Voltar
      </button>
      <iframe src={url} title={title} className="h-[70vh] w-full rounded-2xl bg-white shadow" />
    </div>
  );
}
