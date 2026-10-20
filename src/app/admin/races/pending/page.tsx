import { prisma } from "@/lib/prisma";
import PendingRaces, { type PendingRace } from "./PendingRaces";

export const metadata = {
  title: "Propuestas pendientes - Admin",
};

export default async function PendingRacesPage() {
  const rows = await prisma.race.findMany({
    where: { pendingReview: true },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      type: true,
      distance: true,
      location: true,
      city: true,
      province: true,
      date: true,
      time: true,
      description: true,
      url: true,
      registrationUrl: true,
      price: true,
    },
  });

  const races: PendingRace[] = rows.map((row) => ({
    ...row,
    type: row.type as string,
    date: row.date.toISOString(),
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Propuestas pendientes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Revisa las carreras enviadas desde el formulario público.
          </p>
        </div>
      </div>

      <PendingRaces races={races} />
    </div>
  );
}