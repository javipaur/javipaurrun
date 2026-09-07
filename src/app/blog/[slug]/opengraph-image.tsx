import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgBlogImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug }, select: { title: true, excerpt: true } });

  return new ImageResponse(
    (
      <div tw="w-full h-full flex flex-col justify-between p-12 text-white" style={{ background: "linear-gradient(135deg, #0d0e13 0%, #1e1e2e 50%, #ff7a47 100%)" }}>
        <div>
          <p tw="text-xs font-bold uppercase tracking-widest text-orange-400 mb-0">JAVIPAURRUN · BLOG</p>
        </div>
        <div>
          <h1 tw="text-[48px] font-bold leading-tight mb-4" style={{ lineHeight: 1.1 }}>
            {post?.title || "Artículo"}
          </h1>
          {post?.excerpt && (
            <p tw="text-xl text-white/70 line-clamp-2">{post.excerpt.slice(0, 120)}</p>
          )}
        </div>
      </div>
    ),
    { ...size },
  );
}