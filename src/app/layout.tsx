import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SessionProvider from "@/components/SessionProvider";
import PWARegister from "@/components/PWARegister";
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
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#f97316",
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
        <OrganizationJsonLd />
        <WebSiteJsonLd />
        <SessionProvider>
          <Header session={session} />
          <main className="flex-1">{children}</main>
          <Footer />
          <PWARegister />
        </SessionProvider>
      </body>
    </html>
  );
}
