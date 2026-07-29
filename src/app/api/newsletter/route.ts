import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { newsletterSchema } from "@/lib/validation";
import { newsletterLimiter } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/auth-helpers";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const { allowed } = newsletterLimiter.check(`newsletter:${ip}`);
  if (!allowed) {
    return NextResponse.json({ error: "Demasiados intentos. Intenta más tarde" }, { status: 429 });
  }

  const origin = req.headers.get("origin") || req.headers.get("referer") || "";
  const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  if (!origin.includes(allowedOrigin.replace(/https?:\/\//, ""))) {
    return NextResponse.json({ error: "Petición inválida" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = newsletterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    const { email } = parsed.data;

    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existing) {
      if (!existing.active) {
        await prisma.newsletterSubscriber.update({
          where: { email },
          data: { active: true },
        });
      }
    } else {
      await prisma.newsletterSubscriber.create({
        data: { email },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Error al suscribirse" },
      { status: 500 }
    );
  }
}
