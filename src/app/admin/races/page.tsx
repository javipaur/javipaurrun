import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getRaceTypeLabel, formatDateShort } from "@/lib/utils";

export default async function AdminRacesPage() {
  const races = await prisma.race.findMany({
    orderBy: { date: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Carreras</h1>
        <Link
          href="/admin/races/new"
          className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600"
        >
          Añadir carrera
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Ubicación</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {races.map((race) => (
              <tr key={race.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{race.name}</td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                    {getRaceTypeLabel(race.type)}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{race.location}</td>
                <td className="px-4 py-3 text-gray-600">{formatDateShort(race.date)}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/races/${race.id}/edit`}
                    className="text-orange-500 hover:underline text-sm"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
