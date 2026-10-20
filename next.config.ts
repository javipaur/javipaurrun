import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lasterketak.eus" },
      { protocol: "https", hostname: "*.lasterketak.eus" },
      { protocol: "https", hostname: "web.rockthesport.com" },
      { protocol: "https", hostname: "*.rockthesport.com" },
      { protocol: "https", hostname: "www.buscametas.com" },
      { protocol: "https", hostname: "*.buscametas.com" },
      { protocol: "https", hostname: "sportmaniacs.com" },
      { protocol: "https", hostname: "*.sportmaniacs.com" },
      { protocol: "https", hostname: "rtsfiles.blob.core.windows.net" },
      { protocol: "https", hostname: "carreraspopulares.com" },
      { protocol: "https", hostname: "*.carreraspopulares.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://lasterketak.eus https://web.rockthesport.com https://rtsfiles.blob.core.windows.net https://www.buscametas.com https://sportmaniacs.com https://carreraspopulares.com https://images.unsplash.com https://a.tile.openstreetmap.org https://b.tile.openstreetmap.org https://c.tile.openstreetmap.org https://wa.me https://t.me https://www.facebook.com",
              "font-src 'self' data:",
              "connect-src 'self' https://nominatim.openstreetmap.org https://api.open-meteo.com https://wa.me https://t.me https://www.facebook.com" + (process.env.NEXT_PUBLIC_LIVE_URL ? ` ${process.env.NEXT_PUBLIC_LIVE_URL.replace(/^https?:/, "wss:")} ${process.env.NEXT_PUBLIC_LIVE_URL}` : ""),
              "frame-ancestors 'none'",
              "form-action 'self'",
            ].join("; "),
          },
          { key: "Permissions-Policy", value: "camera=(), microphone=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
