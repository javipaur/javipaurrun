import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import BlogCard from "@/components/BlogCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 9;

export const metadata: Metadata = {
  title: "Blog de running - JavipaurRun",
  description:
    "Artículos sobre carreras populares, trail, entrenamiento y próximos eventos en Euskadi y norte de España.",
};

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function BlogPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const totalPosts = await prisma.blogPost.count({ where: { published: true } });
  const totalPages = Math.max(1, Math.ceil(totalPosts / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    skip: (safePage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (p > 1) params.set("page", String(p));
    return `/blog${params.toString() ? "?" + params.toString() : ""}`;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="mb-9">
        <p className="section-eyebrow mb-1.5">Contenido</p>
        <h1 className="section-title mb-2">Blog</h1>
        <p className="text-text-secondary text-sm">Noticias, consejos y artículos sobre running y trail.</p>
      </div>
      {posts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
          {totalPages > 1 && (
            <nav aria-label="Paginación blog" className="flex items-center justify-center gap-1.5 mt-10">
              {safePage > 1 && (
                <Link href={pageUrl(safePage - 1)} className="btn-secondary text-xs">
                  <ChevronLeft size={14} /> Anterior
                </Link>
              )}
              <span className="px-3 py-1.5 text-xs font-semibold text-text-primary">
                {safePage} / {totalPages}
              </span>
              {safePage < totalPages && (
                <Link href={pageUrl(safePage + 1)} className="btn-secondary text-xs">
                  Siguiente <ChevronRight size={14} />
                </Link>
              )}
            </nav>
          )}
        </>
      ) : (
        <div className="text-center py-16 card-premium">
          <p className="text-text-secondary">No hay artículos publicados aún</p>
        </div>
      )}
    </div>
  );
}
