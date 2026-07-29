import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { blogCreateSchema, getZodErrorMessage } from "@/lib/validation";
import { slugify } from "@/lib/utils";

export async function POST(req: Request) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const body = await req.json();
    const parsed = blogCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: getZodErrorMessage(parsed.error) }, { status: 400 });
    }

    const data = parsed.data;
    const slug = slugify(data.title).slice(0, 100);

    const post = await prisma.blogPost.create({
      data: {
        title: data.title,
        excerpt: data.excerpt,
        content: data.content,
        image: data.image || undefined,
        published: data.published ?? false,
        slug,
        authorId: session!.user.id,
      },
    });

    return NextResponse.json(post);
  } catch {
    return NextResponse.json(
      { error: "Error al crear el post" },
      { status: 500 }
    );
  }
}
