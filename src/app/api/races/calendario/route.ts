import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, RaceType } from "@/generated/prisma/client";
import { getAutonomousCommunity, parseKmFromDistance, distanceRanges } from "@/lib/utils";

const PAGE_SIZE = 12;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const where: Prisma.RaceWhereInput = {};
  where.date = { gte: new Date() };

  const tipo = searchParams.get("tipo");
  const provincia = searchParams.get("provincia");
  const buscar = searchParams.get("buscar");
  const comunidad = searchParams.get("comunidad");
  const distancia = searchParams.get("distancia");
  const pageParam = searchParams.get("page");

  if (tipo && Object.values(RaceType).includes(tipo as RaceType)) where.type = tipo as RaceType;
  if (provincia) where.province = provincia;
  if (buscar) {
    where.OR = [
      { name: { contains: buscar } },
      { location: { contains: buscar } },
    ];
  }

  try {
    const races = await prisma.race.findMany({
      where,
      orderBy: { date: "asc" },
    });

    const allFiltered = races.filter((r) => {
      if (comunidad && getAutonomousCommunity(r.province) !== comunidad) return false;
      if (distancia) {
        const distanceRange = distanceRanges.find((d) => d.value === distancia);
        if (distanceRange) {
          const km = parseKmFromDistance(r.distance);
          if (km == null) return distancia === "sin-distancia";
          if (!(km > distanceRange.min && km <= distanceRange.max)) return false;
        }
      }
      return true;
    });

    const total = allFiltered.length;
    const page = Math.min(Math.max(1, parseInt(pageParam || "1", 10)), Math.max(1, Math.ceil(total / PAGE_SIZE)));
    const paged = allFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return NextResponse.json({ races: paged, total, page, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 }
    );
  }
}