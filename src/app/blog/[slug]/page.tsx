import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";
import { BlogPostJsonLd } from "@/components/JsonLd";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug, published: true },
  });
  if (!post) return { title: "Post no encontrado" };

  return {
    title: `${post.title} - JavipaurRun`,
    description: post.excerpt || post.content.slice(0, 160),
    openGraph: post.image ? { images: [post.image] } : undefined,
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;

  const post = await prisma.blogPost.findUnique({
    where: { slug, published: true },
  });

  if (!post) notFound();

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <BlogPostJsonLd
        title={post.title}
        description={post.excerpt}
        datePublished={post.createdAt}
        image={post.image}
      />

      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Volver al blog
      </Link>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <Calendar size={14} />
          {formatDate(post.createdAt)}
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 leading-tight">
          {post.title}
        </h1>

        {post.image && (
          <img
            src={post.image}
            alt={post.title}
            className="w-full rounded-xl mb-8"
          />
        )}

        <div className="prose max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap text-[15px]">
          {post.content}
        </div>
      </div>
    </article>
  );
}
