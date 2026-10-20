import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

interface Body {
  id?: string;
  action?: "approve" | "reject";
}

export async function POST(req: Request) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { id, action } = body;
  if (!id || (action !== "approve" && action !== "reject")) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const race = await prisma.race.findUnique({
    where: { id },
    select: { id: true, name: true, pendingReview: true },
  });

  if (!race) {
    return NextResponse.json({ error: "Carrera no encontrada" }, { status: 404 });
  }

  if (action === "approve") {
    const updated = await prisma.race.update({
      where: { id },
      data: {
        pendingReview: false,
        community: undefined,
      },
      select: { id: true, name: true, pendingReview: true },
    });
    return NextResponse.json({ ok: true, action, race: updated });
  }

  await prisma.race.delete({ where: { id } });
  return NextResponse.json({ ok: true, action, race: { id, name: race.name } });
}