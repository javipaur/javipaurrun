import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { EventJsonLd } from "@/components/JsonLd";
import RaceDetailClient from "./RaceDetailClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

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

  const typeColors: Record<string, string> = {
    ASFALTO: "bg-orange-50 text-orange-700",
    MEDIA_MARATON: "bg-purple-50 text-purple-700",
    MARATON: "bg-red-50 text-red-700",
    TRAIL: "bg-emerald-50 text-emerald-700",
    MARCHA: "bg-amber-50 text-amber-700",
    ORIENTACION: "bg-blue-50 text-blue-700",
  };

  const typeLabel: Record<string, string> = {
    ASFALTO: "Asfalto",
    MEDIA_MARATON: "Media Maratón",
    MARATON: "Maratón",
    TRAIL: "Trail",
    MARCHA: "Marcha",
    ORIENTACION: "Orientación",
  };

  const typeColor = typeColors[race.type] || typeColors.ASFALTO;

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

      <RaceDetailClient race={race} typeColor={typeColor} typeLabel={typeLabel} formatDate={formatDate} />
    </>
  );
}
