import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ races: [], posts: [] });
  }

  const [races, posts] = await Promise.all([
    prisma.race.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { location: { contains: q } },
          { province: { contains: q } },
          { description: { contains: q } },
        ],
      },
      orderBy: { date: "asc" },
      take: 8,
    }),
    prisma.blogPost.findMany({
      where: {
        published: true,
        OR: [
          { title: { contains: q } },
          { excerpt: { contains: q } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);

  return NextResponse.json({ races, posts });
}
