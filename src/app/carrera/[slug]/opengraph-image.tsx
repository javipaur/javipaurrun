import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgRaceImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const race = await prisma.race.findUnique({ where: { slug } });

  const dateStr = race
    ? new Date(race.date).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
    : "";

  return new ImageResponse(
    (
      <div tw="w-full h-full flex flex-col justify-between p-12 text-white" style={{ background: "linear-gradient(135deg, #0d0e13 0%, #1a1a2e 55%, #ff4d00 100%)" }}>
        <div>
          <p tw="text-xs font-bold uppercase tracking-widest text-orange-400 mb-0">JAVIPAURRUN</p>
        </div>
        <div>
          <h1 tw="text-[52px] font-bold leading-tight mb-4" style={{ lineHeight: 1.1 }}>
            {race?.name || "Carrera popular"}
          </h1>
          <p tw="text-2xl text-white/75">
            {dateStr}
            {race?.location ? ` · ${race.location}` : ""}
            {race?.province ? `, ${race.province}` : ""}
          </p>
          {race?.distance && (
            <p tw="text-xl text-orange-400 mt-3">{race.distance}</p>
          )}
        </div>
      </div>
    ),
    { ...size },
  );
}