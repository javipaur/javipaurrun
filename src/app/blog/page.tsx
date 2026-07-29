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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Blog</h1>
      {posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500">No hay artículos publicados aún</p>
        </div>
      )}
    </div>
  );
}
