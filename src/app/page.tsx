import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import RaceCard from "@/components/RaceCard";
import BlogCard from "@/components/BlogCard";
import NewsletterForm from "@/components/NewsletterForm";
import { EventJsonLd } from "@/components/JsonLd";
import { ArrowRight, CalendarDays, ChevronRight, MapPin, Search } from "lucide-react";

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
      <section className="relative overflow-hidden isolate">
        <div className="absolute inset-0 -z-10">
          <img
            src="https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=2000&auto=format&fit=crop"
            alt="Corredores de trail al amanecer"
            className="w-full h-full object-cover"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-[#f6f7fb] dark:to-[#09090b]" />
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600/30 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 md:pt-32 pb-24 md:pb-36">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white text-xs font-semibold mb-7 animate-fade-in-up">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-400"></span>
              </span>
              {totalRaces} carreras en el calendario
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-white mb-5 leading-[1.05] tracking-tight animate-fade-in-up stagger-1">
              Encuentra tu <span className="text-brand-gradient">próxima carrera</span>
            </h1>
            <p className="text-white/85 text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed animate-fade-in-up stagger-2 drop-shadow">
              Carreras populares, trails, marchas y orientación por toda España. Filtra por tipo, distancia o provincia.
            </p>

            {/* Search bar */}
            <form action="/calendario" method="GET" className="max-w-2xl mx-auto animate-fade-in-up stagger-3">
              <div className="relative flex items-center bg-white/95 dark:bg-[#131316]/95 backdrop-blur rounded-2xl p-1.5 shadow-2xl ring-1 ring-white/20">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="buscar"
                  placeholder="Busca por nombre, ciudad o provincia..."
                  className="flex-1 min-w-0 pl-11 pr-3 py-3 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                />
                <button type="submit" className="btn-primary shrink-0">
                  Buscar carreras <ArrowRight size={15} />
                </button>
              </div>
            </form>

            <div className="flex flex-wrap gap-3 justify-center mt-6 animate-fade-in-up stagger-4">
              <Link href="/calendario" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-gray-900 text-sm font-bold hover:bg-gray-100 transition-colors shadow-lg">
                <CalendarDays size={16} />
                Explorar calendario
              </Link>
              <Link href="/mapa" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-white/40 text-white text-sm font-semibold hover:bg-white/10 transition-colors">
                <MapPin size={16} />
                Ver mapa nacional
              </Link>
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
