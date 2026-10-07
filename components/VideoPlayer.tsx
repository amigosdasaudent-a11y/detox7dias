"use client";

import { useEffect, useRef } from "react";
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

  useEffect(() => {
    const video = ref.current;
    if (!video || !isHls) return;
    // Safari/iOS toca HLS nativo
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      return;
    }
    if (!Hls.isSupported()) return;
    const hls = new Hls();
    hls.loadSource(src);
    hls.attachMedia(video);
    return () => hls.destroy();
  }, [src, isHls]);

  return <video ref={ref} className="aspect-video w-full rounded-2xl bg-black" controls playsInline src={isHls ? undefined : src} />;
}
