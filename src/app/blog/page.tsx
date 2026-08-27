import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import BlogCard from "@/components/BlogCard";

export const metadata: Metadata = {
  title: "Blog de running - JavipaurRun",
  description:
    "Artículos sobre carreras populares, trail, entrenamiento y próximos eventos en Euskadi y norte de España.",
};

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="mb-9">
        <p className="section-eyebrow mb-1.5">Contenido</p>
        <h1 className="section-title mb-2">Blog</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Noticias, consejos y artículos sobre running y trail.</p>
      </div>
      {posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 card-premium">
          <p className="text-gray-500">No hay artículos publicados aún</p>
        </div>
      )}
    </div>
  );
}
