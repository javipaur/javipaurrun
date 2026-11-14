import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RunHub - Calendario y buscador de carreras",
    short_name: "RunHub",
    description:
      "Encuentra carreras de todo tipo en toda España: cerca de ti, con filtros y guía para animar.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f7fb",
    theme_color: "#0284c7",
    orientation: "portrait-primary",
    categories: ["sports", "lifestyle"],
    lang: "es",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
