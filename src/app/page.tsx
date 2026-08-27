import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import RaceCard from "@/components/RaceCard";
import BlogCard from "@/components/BlogCard";
import NewsletterForm from "@/components/NewsletterForm";
import { EventJsonLd } from "@/components/JsonLd";
import { ArrowRight, CalendarDays, ChevronRight, Search } from "lucide-react";

export const metadata: Metadata = {
  title: "JavipaurRun - Calendario de carreras populares en España",
  description:
    "Encuentra tu próxima carrera popular en toda España. Calendario actualizado de carreras de asfalto, trail, marchas y orientación. Scraping automático desde rockthesport.com, sportmaniacs.com y más fuentes.",
  openGraph: {
    title: "JavipaurRun - Calendario de carreras populares",
    description:
      "Encuentra tu próxima carrera popular en toda España",
    siteName: "JavipaurRun",
    type: "website",
    locale: "es_ES",
  },
};

export default async function Home() {
  const featuredRaces = await prisma.race.findMany({
    where: { date: { gte: new Date() } },
    orderBy: { date: "asc" },
    take: 6,
  });

  const raceCounts = await prisma.race.groupBy({
    by: ["type"],
    _count: true,
  });

  const typeCountMap: Record<string, number> = {};
  raceCounts.forEach((r) => { typeCountMap[r.type] = r._count; });

  const latestPosts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const totalRaces = await prisma.race.count();

  const categories = [
    { type: "ASFALTO", label: "Running / Asfalto", path: "/calendario?tipo=ASFALTO" },
    { type: "TRAIL", label: "Trail / Montaña", path: "/calendario?tipo=TRAIL" },
    { type: "MEDIA_MARATON", label: "Media Maratón", path: "/calendario?tipo=MEDIA_MARATON" },
    { type: "MARATON", label: "Maratón", path: "/calendario?tipo=MARATON" },
    { type: "MARCHA", label: "Marcha", path: "/calendario?tipo=MARCHA" },
    { type: "ORIENTACION", label: "Orientación", path: "/calendario?tipo=ORIENTACION" },
  ];

  return (
    <div>
      {featuredRaces.slice(0, 3).map((race) => (
        <EventJsonLd
          key={race.id}
          name={race.name}
          date={race.date.toISOString()}
          location={race.location}
          province={race.province}
          url={race.url}
          description={race.description}
          image={race.image}
        />
      ))}

      {/* Hero */}
      <section className="bg-hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-gradient/10 border border-orange-200/60 dark:border-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-semibold mb-6 animate-fade-in-up">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              {totalRaces} carreras en el calendario
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-gray-900 dark:text-white mb-5 leading-[1.05] tracking-tight animate-fade-in-up stagger-1">
              Encuentra tu <span className="text-brand-gradient">próxima carrera</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg max-w-xl mx-auto mb-9 leading-relaxed animate-fade-in-up stagger-2">
              Carreras populares, trails, marchas y orientación por toda España. Filtra por tipo, distancia o provincia.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center animate-fade-in-up stagger-3">
              <Link
                href="/calendario"
                className="btn-primary"
              >
                <CalendarDays size={16} />
                Explorar calendario
                <ArrowRight size={14} />
              </Link>
              <form action="/calendario" method="GET" className="relative w-full max-w-xs">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="buscar"
                  placeholder="Buscar carreras..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="pb-6 pt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.filter((cat) => (typeCountMap[cat.type] || 0) > 0).map((cat) => (
              <Link
                key={cat.type}
                href={cat.path}
                className="chip"
              >
                {cat.label}
                <span className="text-xs font-semibold opacity-60">({typeCountMap[cat.type]})</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Races */}
      <section className="py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-7">
            <div>
              <p className="section-eyebrow mb-1.5">Calendario</p>
              <h2 className="section-title">Próximas carreras</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1.5">Las más cercanas en tu zona</p>
            </div>
            <Link href="/calendario" className="btn-secondary hidden sm:inline-flex">
              Ver todas <ChevronRight size={15} />
            </Link>
          </div>
          {featuredRaces.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredRaces.map((race, i) => (
                <RaceCard key={race.id} race={race} index={i} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500 text-sm">No hay carreras próximas disponibles</p>
            </div>
          )}
          <div className="text-center mt-8 sm:hidden">
            <Link href="/calendario" className="btn-primary">
              Ver todas las carreras <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Blog */}
      {latestPosts.length > 0 && (
        <section className="py-8 md:py-12 bg-white dark:bg-[#0e0e11] border-y border-gray-200/60 dark:border-gray-800/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-end justify-between mb-7">
              <div>
                <p className="section-eyebrow mb-1.5">Blog</p>
                <h2 className="section-title">Últimos del blog</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1.5">Noticias, consejos y más</p>
              </div>
              <Link href="/blog" className="btn-secondary hidden sm:inline-flex">
                Ver blog <ChevronRight size={15} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {latestPosts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="py-12 md:py-16">
        <div className="max-w-lg mx-auto px-4 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">¿Quieres estar al día?</h2>
          <p className="text-gray-500 text-sm mb-6">Recibe las últimas carreras directamente en tu correo.</p>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <NewsletterForm />
          </div>
        </div>
      </section>
    </div>
  );
}
