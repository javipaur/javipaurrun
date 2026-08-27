import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "JavipaurRun - Calendario de carreras",
    short_name: "JavipaurRun",
    description:
      "Encuentra tu próxima carrera popular en toda España",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f7fb",
    theme_color: "#ff4d00",
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
