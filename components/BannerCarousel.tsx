"use client";

import { useEffect, useState } from "react";

export default function BannerCarousel({
  images,
}: {
  images: { src: string; link: string | null }[];
}) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (images.length < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % images.length), 5000);
    return () => clearInterval(t);
  }, [images.length]);
  if (images.length === 0) return null;
  const prev = () => setI((v) => (v - 1 + images.length) % images.length);
  const next = () => setI((v) => (v + 1) % images.length);
  const cur = images[i];
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={cur.src} alt="Banner" className="h-56 w-full rounded-3xl object-cover shadow md:h-72" />
  );
  return (
    <div className="relative">
      {cur.link ? (
        <a href={cur.link} target="_blank" rel="noreferrer">
          {img}
        </a>
      ) : (
        img
      )}
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Banner anterior"
            className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-xl text-white"
          >
            ‹
          </button>
          <button
            onClick={next}
            aria-label="Próximo banner"
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-xl text-white"
          >
            ›
          </button>
        </>
      )}
      {images.length > 1 && (
        <div className="mt-2 flex justify-center gap-1">
          {images.map((_, d) => (
            <button
              key={d}
              aria-label={`Banner ${d + 1}`}
              onClick={() => setI(d)}
              className={`h-2 w-2 rounded-full ${d === i ? "bg-[#FF4D8D]" : "bg-neutral-300"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
