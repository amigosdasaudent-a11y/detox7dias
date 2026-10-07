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
  const cur = images[i];
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={cur.src} alt="Banner" className="h-44 w-full rounded-3xl object-cover shadow" />
  );
  return (
    <div>
      {cur.link ? (
        <a href={cur.link} target="_blank" rel="noreferrer">
          {img}
        </a>
      ) : (
        img
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
