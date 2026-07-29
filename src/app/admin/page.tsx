import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminDashboard() {
  const [raceCount, blogCount, subscriberCount, upcomingRaces] =
    await Promise.all([
      prisma.race.count(),
      prisma.blogPost.count({ where: { published: true } }),
      prisma.newsletterSubscriber.count({ where: { active: true } }),
      prisma.race.findMany({
        where: { date: { gte: new Date() } },
        orderBy: { date: "asc" },
        take: 5,
      }),
    ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Total carreras</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{raceCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Artículos publicados</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{blogCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Suscriptores activos</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{subscriberCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Próximas carreras</h2>
          <Link href="/admin/races" className="text-sm text-orange-500 hover:underline">
            Gestionar
          </Link>
        </div>
        {upcomingRaces.length > 0 ? (
          <div className="space-y-3">
            {upcomingRaces.map((race) => (
              <div key={race.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{race.name}</p>
                  <p className="text-sm text-gray-500">{race.location} - {new Date(race.date).toLocaleDateString("es-ES")}</p>
                </div>
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">{race.type}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No hay carreras próximas</p>
        )}
      </div>
    </div>
  );
}
