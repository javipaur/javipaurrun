import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/auth-helpers";
import { rateLimit } from "@/lib/rate-limit";
import { raceAlertSchema, getZodErrorMessage } from "@/lib/validation";
import {
  upsertRaceAlert,
  deactivateRaceAlert,
  getRaceAlertByEmail,
  alertToCalendarFilters,
} from "@/lib/alerts";

const alertLimiter = rateLimit({ interval: 60_000, max: 5 });

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 });
  }

  const alert = await getRaceAlertByEmail(email);
  if (!alert) {
    return NextResponse.json({ active: false });
  }

  return NextResponse.json({
    active: alert.active,
    email: alert.email,
    filters: alertToCalendarFilters({
      province: alert.province,
      community: alert.community,
      type: alert.type,
      minKm: alert.minKm,
      maxKm: alert.maxKm,
    }),
  });
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const { allowed } = alertLimiter.check(`alert:${ip}`);
  if (!allowed) {
    return NextResponse.json(
      { error: "Demasiadas peticiones. Inténtalo de nuevo en un minuto." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = raceAlertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: getZodErrorMessage(parsed.error) }, { status: 400 });
  }

  const alert = await upsertRaceAlert(parsed.data);

  const criteria: string[] = [];
  if (alert.province) criteria.push(alert.province);
  if (alert.community) criteria.push(alert.community);
  if (alert.type) criteria.push(alert.type);
  if (alert.minKm != null || alert.maxKm != null) {
    criteria.push(`${alert.minKm ?? 0}-${alert.maxKm ?? "∞"} km`);
  }

  return NextResponse.json(
    {
      message:
        criteria.length > 0
          ? `Te avisaremos de nuevas carreras: ${criteria.join(" · ")}.`
          : "Te avisaremos cuando publiquemos nuevas carreras.",
      email: alert.email,
    },
    { status: 201 }
  );
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 });
  }

  const { count } = await deactivateRaceAlert(email);

  if (count === 0) {
    return NextResponse.json({ error: "Alerta no encontrada" }, { status: 404 });
  }

  return NextResponse.json({ message: "Alerta desactivada" });
}