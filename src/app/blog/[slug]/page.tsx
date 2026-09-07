import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/utils";
import Image from "next/image";
import { Calendar } from "lucide-react";
import { BlogPostJsonLd } from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";

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

      <Breadcrumbs
        items={[
          { href: "/blog", label: "Blog" },
          { label: post.title },
        ]}
      />

      <div className="bg-white dark:bg-[#131316] rounded-2xl border border-gray-100 dark:border-gray-800 p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <Calendar size={14} />
          {formatDate(post.createdAt)}
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 leading-tight">
          {post.title}
        </h1>

        {post.image && (
          <Image
            src={post.image}
            alt={post.title}
            width={1200}
            height={630}
            className="w-full h-auto rounded-xl mb-8"
          />
        )}

        <div className="prose max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap text-[15px]">
          {post.content}
        </div>
      </div>
    </article>
  );
}
