import { NextResponse } from "next/server";
import { requireAdmin, getClientIp } from "@/lib/auth-helpers";
import { scrapingLimiter } from "@/lib/rate-limit";
import { scrapingSchema } from "@/lib/validation";
import {
  scrapeFromLasterketak,
  scrapeFromRockTheSport,
  scrapeFromBuscametas,
  importScrapedRaces,
} from "@/lib/scraping";
import { prisma } from "@/lib/prisma";

const sources: Record<string, { scrape: () => Promise<unknown[]>; label: string }> = {
  lasterketak: { scrape: scrapeFromLasterketak, label: "Lasterketak.eus" },
  rockthesport: { scrape: scrapeFromRockTheSport, label: "RockTheSport" },
  buscametas: { scrape: scrapeFromBuscametas, label: "Buscametas" },
};

export async function POST(req: Request) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const ip = getClientIp(req);
  const { allowed } = scrapingLimiter.check(`scraping:${ip}`);
  if (!allowed) {
    return NextResponse.json({ error: "Demasiadas peticiones. Espera 5 minutos" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = scrapingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Fuente no soportada. Usa: lasterketak, rockthesport, buscametas" }, { status: 400 });
    }

    const { source } = parsed.data;
    const sourceConfig = sources[source];
    const scraped = await sourceConfig.scrape();
    const imported = await importScrapedRaces(scraped as import("@/lib/scraping").ScrapedRace[], source);

    await prisma.scrapeLog.create({
      data: { source, count: imported, status: "SUCCESS" },
    });

    return NextResponse.json({
      success: true,
      source: sourceConfig.label,
      found: scraped.length,
      imported,
    });
  } catch {
    await prisma.scrapeLog.create({
      data: { source: "unknown", count: 0, status: "ERROR", error: "Internal error" },
    });

    return NextResponse.json(
      { error: "Error interno en el scraping" },
      { status: 500 }
    );
  }
}
