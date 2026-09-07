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
import { auth } from "@/lib/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JavipaurRun - Calendario de carreras populares",
  description:
    "Encuentra tu próxima carrera popular en Euskadi, Cantabria, Burgos, La Rioja, Navarra y Zamora. Calendario actualizado de carreras de asfalto, trail, marchas y orientación.",
  applicationName: "JavipaurRun",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "JavipaurRun",
  },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192" }],
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#ff4d00",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

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
                <Header session={session} />
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
