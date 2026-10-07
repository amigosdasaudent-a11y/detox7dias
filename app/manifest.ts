import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Detox Body Max",
    short_name: "Detox",
    description: "Programa de 14 dias: e-books, áudios, vídeos e IMC.",
    start_url: "/inicio",
    display: "standalone",
    background_color: "#FFF5F7",
    theme_color: "#FF4D8D",
    icons: [
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
