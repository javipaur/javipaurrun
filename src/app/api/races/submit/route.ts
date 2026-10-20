import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/auth-helpers";
import { rateLimit } from "@/lib/rate-limit";
import { raceSubmissionSchema, getZodErrorMessage } from "@/lib/validation";
import { normalizeRaceSubmission } from "@/lib/race-submission";

const submitLimiter = rateLimit({ interval: 3_600_000, max: 5 });

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const { allowed } = submitLimiter.check(`race-submit:${ip}`);
  if (!allowed) {
    return NextResponse.json(
      { error: "Has enviado demasiadas propuestas. Inténtalo de nuevo más tarde." },
      { status: 429, headers: { "Retry-After": "3600" } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = raceSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: getZodErrorMessage(parsed.error) }, { status: 400 });
  }

  const data = normalizeRaceSubmission(parsed.data);

  try {
    const baseSlug = data.slug;
    let slug = baseSlug;
    let race = await createRace(data, slug);

    if (!race) {
      slug = `${baseSlug}-${Date.now()}`;
      race = await createRace(data, slug);
    }

    if (!race) {
      return NextResponse.json(
        { error: "No se pudo registrar la carrera. Inténtalo de nuevo." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message:
          "¡Gracias! Tu propuesta ha sido recibida y aparecerá en el directorio cuando sea revisada.",
        race: { slug: race.slug, name: race.name },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating submitted race:", error);
    return NextResponse.json(
      { error: "Error interno al registrar la carrera" },
      { status: 500 }
    );
  }
}

async function createRace(data: ReturnType<typeof normalizeRaceSubmission>, slug: string) {
  try {
    return await prisma.race.create({
      data: {
        name: data.name,
        slug,
        type: data.type,
        distance: data.distance,
        distanceKm: data.distanceKm,
        location: data.location,
        city: data.city,
        province: data.province,
        community: data.community,
        date: data.date,
        time: data.time,
        description: data.description,
        url: data.url,
        image: data.image,
        registrationUrl: data.registrationUrl,
        price: data.price,
        source: data.source,
        pendingReview: data.pendingReview,
        status: "PROXIMAMENTE",
      },
      select: { slug: true, name: true },
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return null;
    }
    throw error;
  }
}