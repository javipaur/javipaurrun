import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatDate, getRaceTypeLabel } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin, Tag, Timer, Star } from "lucide-react";
import CompareButton from "./CompareButton";

export const metadata: Metadata = {
  title: "Comparar carreras - JavipaurRun",
  description: "Compara dos o más carreras populares lado a lado: distancia, precio, fecha, tipo y más.",
};

interface PageProps {
  searchParams: Promise<{ ids?: string }>;
}

export default async function ComparePage({ searchParams }: PageProps) {
  const { ids } = await searchParams;

  type RaceWithStats = Awaited<ReturnType<typeof prisma.race.findMany>>[0] & {
    _count: { results: number };
    _avg: { rating: number | null };
  };
  let races: Array<{
    id: string; name: string; slug: string; type: string; distance: string | null;
    location: string; province: string; date: Date; time: string | null; price: string | null;
    url: string | null; description: string | null; status: string;
    _count: { results: number }; _avg: { rating: number | null };
  }> = [];

  if (ids) {
    const idList = ids.split(",").filter(Boolean);
    if (idList.length >= 2) {
      const raw = await prisma.race.findMany({
        where: { id: { in: idList } },
        include: { _count: { select: { results: true } } },
      });

      const avgs = await prisma.review.groupBy({
        by: ["raceId"],
        where: { raceId: { in: idList } },
        _avg: { rating: true },
      });

      const avgMap = new Map(avgs.map((a) => [a.raceId, a._avg.rating]));

      races = raw
        .map((r) => ({
          ...r,
          type: r.type,
          _avg: { rating: avgMap.get(r.id) ?? null },
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());
    }
  }

  const statusLabel: Record<string, string> = {
    PROXIMAMENTE: "Próximamente",
    INSCRIPCIONES_ABIERTAS: "Inscripciones abiertas",
    COMPLETADA: "Completada",
    CANCELADA: "Cancelada",
  };

  const statusColor: Record<string, string> = {
    PROXIMAMENTE: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    INSCRIPCIONES_ABIERTAS: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    COMPLETADA: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    CANCELADA: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };



  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
      <Link
        href="/calendario"
        className="inline-flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Volver al calendario
      </Link>

      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Comparar carreras</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
          Selecciona hasta 3 carreras desde el calendario para compararlas
        </p>
      </div>

      {races.length < 2 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-gray-500 font-medium mb-1">Selecciona al menos 2 carreras</p>
          <p className="text-gray-400 text-sm mb-4">
            Desde el calendario, haz clic en &quot;Comparar&quot; en las carreras que quieras
          </p>
          <Link
            href="/calendario"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            Ir al calendario
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium text-xs uppercase tracking-wider w-40">
                    Característica
                  </th>
                  {races.map((r) => (
                    <th key={r.id} className="py-3 px-4 text-left min-w-[200px]">
                      <Link
                        href={`/carrera/${r.slug}`}
                        className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-orange-600 transition-colors line-clamp-2"
                      >
                        {r.name}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Tipo", get: (r: typeof races[0]) => getRaceTypeLabel(r.type) },
                  { label: "Fecha", get: (r: typeof races[0]) => formatDate(r.date.toISOString()) },
                  { label: "Hora", get: (r: typeof races[0]) => r.time || "—" },
                  { label: "Distancia", get: (r: typeof races[0]) => r.distance || "—" },
                  { label: "Precio", get: (r: typeof races[0]) => r.price || "—" },
                  { label: "Ubicación", get: (r: typeof races[0]) => `${r.location}, ${r.province}` },
                  { label: "Estado", get: (r: typeof races[0]) => statusLabel[r.status] || r.status },
                  {
                    label: "Resultados",
                    get: (r: typeof races[0]) => `${r._count.results} resultado${r._count.results !== 1 ? "s" : ""}`,
                  },
                  {
                    label: "Valoración",
                    get: (r: typeof races[0]) =>
                      r._avg.rating ? `${(r._avg.rating).toFixed(1)} ★` : "—",
                  },
                  { label: "Enlace", get: (r: typeof races[0]) => r.url ? "Sí" : "No" },
                ].map((row, i) => (
                  <tr
                    key={row.label}
                    className={`border-b border-gray-100 dark:border-gray-800 ${
                      i % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50/50 dark:bg-gray-800/50"
                    }`}
                  >
                    <td className="py-3 px-4 text-gray-500 dark:text-gray-400 font-medium text-xs">
                      {row.label}
                    </td>
                    {races.map((r) => {
                      const val = row.get(r);
                      const isBest =
                        row.label === "Precio" &&
                        val !== "—" &&
                        r.price &&
                        races.every(
                          (other) =>
                            !other.price ||
                            parseInt(r.price!.replace(/[^0-9]/g, "")) <=
                              parseInt(other.price.replace(/[^0-9]/g, ""))
                        );

                      return (
                        <td
                          key={r.id}
                          className={`py-3 px-4 text-gray-900 dark:text-gray-100 ${
                            isBest ? "font-semibold text-green-600 dark:text-green-400" : ""
                          }`}
                        >
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-6">
        <CompareButton />
      </div>
    </div>
  );
}
