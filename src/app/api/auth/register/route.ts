import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { registerSchema, getZodErrorMessage } from "@/lib/validation";
import { authLimiter } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/auth-helpers";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const { allowed } = authLimiter.check(`register:${ip}`);
  if (!allowed) {
    return NextResponse.json({ error: "Demasiados intentos. Intenta de nuevo en 1 minuto" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: getZodErrorMessage(parsed.error) },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un usuario con ese email" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Error al crear el usuario" },
      { status: 500 }
    );
  }
}
