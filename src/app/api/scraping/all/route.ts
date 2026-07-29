import { NextResponse } from "next/server";
import { requireAdmin, getClientIp } from "@/lib/auth-helpers";
import { scrapingLimiter } from "@/lib/rate-limit";
import { runAllScrapers } from "@/lib/scraping";

export async function POST(req: Request) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const ip = getClientIp(req);
  const { allowed } = scrapingLimiter.check(`scraping-all:${ip}`);
  if (!allowed) {
    return NextResponse.json({ error: "Demasiadas peticiones" }, { status: 429 });
  }

  try {
    const results = await runAllScrapers();
    return NextResponse.json({ success: true, results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 }
    );
  }
}
