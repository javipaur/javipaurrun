import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate, getRaceDetailColor, getRaceTypeLabel } from "@/lib/utils";
import { EventJsonLd } from "@/components/JsonLd";
import RaceDetailClient from "./RaceDetailClient";
import RelatedRaces from "@/components/RelatedRaces";
import Breadcrumbs from "@/components/Breadcrumbs";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const race = await prisma.race.findUnique({ where: { slug } });
  if (!race) return { title: "Carrera no encontrada" };

  return {
    title: `${race.name} - JavipaurRun`,
    description:
      race.description?.slice(0, 160) ||
      `${race.name} el ${formatDate(race.date)} en ${race.location}, ${race.province}. ${race.distance ? `Distancia: ${race.distance}.` : ""} ${race.type}`,
    openGraph: race.image
      ? { images: [{ url: race.image, width: 1200, height: 630 }] }
      : undefined,
  };
}

export default async function RaceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const race = await prisma.race.findUnique({ where: { slug } });

  if (!race) notFound();

  const related = await prisma.race.findMany({
    where: {
      id: { not: race.id },
      date: { gte: new Date() },
      OR: [
        { province: race.province },
        { type: race.type },
      ],
    },
    orderBy: { date: "asc" },
    take: 4,
  });

  return (
    <>
      <EventJsonLd
        name={race.name}
        date={race.date.toISOString()}
        location={race.location}
        province={race.province}
        url={race.url}
        description={race.description}
        image={race.image}
      />

      <div className="max-w-4xl mx-auto">
        <div className="px-4 sm:px-6 pt-6">
          <Breadcrumbs
            items={[
              { href: "/calendario", label: "Calendario" },
              { label: race.name },
            ]}
          />
        </div>
        <RaceDetailClient race={race} typeColor={getRaceDetailColor(race.type)} typeLabel={getRaceTypeLabel(race.type)} formatDate={formatDate} />
        <div className="px-4 sm:px-6">
          <RelatedRaces races={related} />
        </div>
      </div>
    </>
  );
}
