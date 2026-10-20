import { auth } from "./auth";
import { NextResponse } from "next/server";
import { prisma } from "./prisma";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    return { session: null, error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  }
  return { session, error: null };
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    return { session: null, error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  }
  if (session.user.role !== "ADMIN") {
    return { session: null, error: NextResponse.json({ error: "Acceso denegado" }, { status: 403 }) };
  }
  return { session, error: null };
}

export async function requireOrganizer(eventId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { session: null, error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  }

  const isAdmin = session.user.role === "ADMIN";
  if (!isAdmin) {
    const membership = await prisma.organizerMembership.findFirst({
      where: {
        userId: session.user.id,
        organization: { events: { some: { id: eventId } } },
      },
    });
    if (!membership) {
      return { session: null, error: NextResponse.json({ error: "Acceso denegado" }, { status: 403 }) };
    }
  }

  return { session, error: null };
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}
