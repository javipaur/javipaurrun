import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SessionProvider from "@/components/SessionProvider";
import ThemeProvider from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/Toast";
import { I18nProvider } from "@/lib/i18n/provider";
import PWARegister from "@/components/PWARegister";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/JsonLd";
import { envSiteUrl } from "@/lib/site-url";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export function generateMetadata(): Metadata {
  // Sin `headers()` aqui: leer el host en el layout convertia las 2.600 paginas
  // del sitemap en dinamicas (no-store) y anulaba el ISR.
  const base = new URL(envSiteUrl());

  return {
    metadataBase: base,
    openGraph: {
      siteName: "JavipaurRun",
      locale: "es_ES",
      type: "website",
    },
    twitter: { card: "summary_large_image" },
    title: {
      default: "JavipaurRun — Calendario de carreras populares en España",
      template: "%s | JavipaurRun",
    },
    description:
      "Directorio y calendario de carreras populares en toda España: running, trail, media maratón, maratón, marcha y orientación. Filtra por provincia, comunidad, distancia y mes. Actualizado cada día.",
    applicationName: "JavipaurRun",
    generator: "Next.js",
    keywords: [
      "carreras populares España",
      "calendario carreras",
      "carreras running",
      "carreras trail",
      "media maratón",
      "maratón",
      "marchas",
      "orientación",
      "inscripciones carreras",
    ],
    category: "sports",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "JavipaurRun",
    },
    icons: {
      icon: [
        { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: "/icons/icon-192.png", sizes: "192x192" }],
    },
    formatDetection: {
      telephone: false,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#ff4d00",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable}`}>
      <body className="min-h-dvh flex flex-col bg-[#fafafa] antialiased pt-16 pb-16 md:pb-0">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[70] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-primary focus:text-white focus:font-semibold focus:text-sm"
        >
          Saltar al contenido
        </a>
        <OrganizationJsonLd />
        <WebSiteJsonLd />
        <I18nProvider>
          <ThemeProvider>
            <SessionProvider>
              <ToastProvider>
                <Header />
                <main id="main" className="flex-1">{children}</main>
                <Footer />
                <PWARegister />
                <PWAInstallPrompt />
              </ToastProvider>
            </SessionProvider>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
