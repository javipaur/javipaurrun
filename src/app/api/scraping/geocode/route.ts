import { NextResponse } from "next/server";
import { requireAdmin, getClientIp } from "@/lib/auth-helpers";
import { apiLimiter } from "@/lib/rate-limit";
import { geocodeUnlocatedRaces } from "@/lib/geocode";

export async function POST(req: Request) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const ip = getClientIp(req);
  const { allowed } = apiLimiter.check(`geocode:${ip}`);
  if (!allowed) {
    return NextResponse.json({ error: "Demasiadas peticiones" }, { status: 429 });
  }

  try {
    const geocoded = await geocodeUnlocatedRaces();
    return NextResponse.json({ geocoded });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 }
    );
  }
}
