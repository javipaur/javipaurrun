import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { apiLimiter } from "@/lib/rate-limit";
import { raceCreateSchema, getZodErrorMessage } from "@/lib/validation";
import { slugify } from "@/lib/utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as string | null;
  const province = searchParams.get("province") as string | null;
  const search = searchParams.get("search") as string | null;

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (province) where.province = province;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { location: { contains: search } },
    ];
  }

  const races = await prisma.race.findMany({
    where,
    orderBy: { date: "asc" },
  });

  return NextResponse.json(races);
}

export async function POST(req: Request) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const body = await req.json();
    const parsed = raceCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: getZodErrorMessage(parsed.error) }, { status: 400 });
    }

    const data = parsed.data;
    const slug = slugify(data.name).slice(0, 100);

    const race = await prisma.race.create({
      data: {
        name: data.name,
        type: data.type,
        distance: data.distance,
        location: data.location,
        province: data.province,
        date: new Date(data.date),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        time: data.time,
        description: data.description,
        url: data.url || undefined,
        image: data.image,
        price: data.price,
        status: data.status || "PROXIMAMENTE",
        featured: data.featured,
        slug,
      },
    });

    return NextResponse.json(race);
  } catch {
    return NextResponse.json(
      { error: "Error al crear la carrera" },
      { status: 500 }
    );
  }
}
