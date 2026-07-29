import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { raceUpdateSchema, getZodErrorMessage } from "@/lib/validation";
import { slugify } from "@/lib/utils";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const race = await prisma.race.findUnique({ where: { id } });
  if (!race) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }
  return NextResponse.json(race);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const body = await req.json();
  const parsed = raceUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: getZodErrorMessage(parsed.error) }, { status: 400 });
  }

  const data = parsed.data;
  const updateData: Record<string, unknown> = { ...data };
  if (data.date) updateData.date = new Date(data.date);
  if (data.endDate) updateData.endDate = new Date(data.endDate);
  if (data.name) updateData.slug = slugify(data.name).slice(0, 100);

  const race = await prisma.race.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(race);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  await prisma.race.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
