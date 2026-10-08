"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

export function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  return m?.[1] || null;
}

export function vimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m?.[1] || null;
}

// src pode ser: .m3u8 (Gumlet/HLS), YouTube, Vimeo ou MP4 direto
export default function VideoPlayer({ src, title }: { src: string; title?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  const yt = youtubeId(src);
  if (yt) {
    return (
      <iframe
        className="aspect-video w-full rounded-2xl"
        src={`https://www.youtube.com/embed/${yt}`}
        title={title || "Vídeo"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }
  const vm = vimeoId(src);
  if (vm) {
    return (
      <iframe
        className="aspect-video w-full rounded-2xl"
        src={`https://player.vimeo.com/video/${vm}`}
        title={title || "Vídeo"}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    );
  }

  const isHls = src.includes(".m3u8");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    const video = ref.current;
    if (!video || !isHls) return;
    const onErr = () => setFailed(true);
    video.addEventListener("error", onErr);
    // Safari/iOS toca HLS nativo
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      return () => video.removeEventListener("error", onErr);
    }
    if (!Hls.isSupported()) {
      setFailed(true);
      return;
    }
    const hls = new Hls();
    hls.on(Hls.Events.ERROR, (_e, data) => {
      if (data.fatal) setFailed(true);
    });
    hls.loadSource(src);
    hls.attachMedia(video);
    return () => {
      video.removeEventListener("error", onErr);
      hls.destroy();
    };
  }, [src, isHls]);

  if (failed) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-2xl bg-black p-6 text-center text-white">
        <p className="font-semibold">Não foi possível carregar este vídeo aqui.</p>
        <p className="text-sm text-neutral-300">
          Tente de novo ou avise o suporte informando o título da aula.
        </p>
      </div>
    );
  }

  return <video ref={ref} className="aspect-video w-full rounded-2xl bg-black" controls playsInline src={isHls ? undefined : src} />;
}
