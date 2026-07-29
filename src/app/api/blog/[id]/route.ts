import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { blogUpdateSchema, getZodErrorMessage } from "@/lib/validation";
import { slugify } from "@/lib/utils";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  return NextResponse.json(post);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const body = await req.json();
  const parsed = blogUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: getZodErrorMessage(parsed.error) }, { status: 400 });
  }

  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  if (post.authorId && post.authorId !== session!.user.id && session!.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No tienes permiso para editar este artículo" }, { status: 403 });
  }

  const data = parsed.data;
  const updateData: Record<string, unknown> = { ...data };
  if (data.title) updateData.slug = slugify(data.title).slice(0, 100);

  const updated = await prisma.blogPost.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(updated);
}
