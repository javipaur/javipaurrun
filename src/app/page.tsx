import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import RaceCard from "@/components/RaceCard";
import BlogCard from "@/components/BlogCard";
import NewsletterForm from "@/components/NewsletterForm";
import { EventJsonLd } from "@/components/JsonLd";
import { ArrowRight, CalendarDays, ChevronRight, Search, TrendingUp } from "lucide-react";

export const metadata: Metadata = {
  title: "JavipaurRun - Calendario de carreras populares en Euskadi y norte de España",
  description:
    "Encuentra tu próxima carrera popular en Euskadi, Cantabria, Burgos, La Rioja, Navarra y Zamora. Calendario actualizado de carreras de asfalto, trail, marchas y orientación. Scraping automático desde lasterketak.eus, rockthesport.com y buscametas.com.",
  openGraph: {
    title: "JavipaurRun - Calendario de carreras populares",
    description:
      "Encuentra tu próxima carrera popular en Euskadi y norte de España",
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
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-medium mb-5">
              <TrendingUp size={13} />
              {totalRaces} carreras en el calendario
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              Encuentra tu próxima carrera
            </h1>
            <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto mb-8 leading-relaxed">
              El calendario más completo de carreras populares en Euskadi, Navarra, Cantabria, Burgos, La Rioja y Zamora.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link
                href="/calendario"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gray-900 text-white font-medium text-sm hover:bg-gray-800 transition-colors"
              >
                <CalendarDays size={16} />
                Explorar calendario
                <ArrowRight size={14} />
              </Link>
              <form action="/calendario" method="GET" className="relative w-full max-w-xs">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="buscar"
                  placeholder="Buscar carreras..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all"
                />
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((cat) => (
              <Link
                key={cat.type}
                href={cat.path}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-sm text-gray-600 hover:border-gray-300 hover:text-gray-900 hover:bg-gray-50 transition-all"
              >
                {cat.label}
                <span className="text-xs text-gray-400 font-medium">({typeCountMap[cat.type] || 0})</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Races */}
      <section className="py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Próximas carreras</h2>
              <p className="text-gray-500 text-sm mt-0.5">Las más cercanas en tu zona</p>
            </div>
            <Link href="/calendario" className="hidden sm:flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
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
          <div className="text-center mt-6 sm:hidden">
            <Link href="/calendario" className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors">
              Ver todas las carreras <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Blog */}
      {latestPosts.length > 0 && (
        <section className="py-8 md:py-12 bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Últimos del blog</h2>
                <p className="text-gray-500 text-sm mt-0.5">Noticias, consejos y más</p>
              </div>
              <Link href="/blog" className="hidden sm:flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
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
