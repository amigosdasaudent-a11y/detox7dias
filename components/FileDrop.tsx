"use client";

import { useRef, useState } from "react";

export default function FileDrop({
  title,
  hint,
  accept,
  onFile,
}: {
  title: string;
  hint?: string;
  accept?: string;
  onFile: (f: File | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [drag, setDrag] = useState(false);

  function pick(f: File | null) {
    setName(f ? f.name : "");
    onFile(f);
  }

  return (
    <div>
      <p className="text-sm font-semibold">{title}</p>
      <div
        onClick={() => ref.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          pick(e.dataTransfer.files?.[0] || null);
        }}
        className={`mt-1 flex cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
          drag ? "border-[#FF4D8D] bg-[#FFF0F5]" : "border-neutral-300 bg-neutral-50 hover:border-[#FF4D8D]"
        }`}
      >
        <span className="text-3xl">📤</span>
        <span className="text-sm text-neutral-600">
          <span className="font-bold text-[#FF4D8D]">Clique aqui</span> para escolher o arquivo ou arraste e solte
          {hint && <span className="block text-xs text-neutral-400">{hint}</span>}
        </span>
      </div>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0] || null)}
      />
      {name && <p className="mt-1 truncate text-xs font-semibold text-emerald-600">✓ {name}</p>}
    </div>
  );
}
