import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { ArrowRight, Calendar } from "lucide-react";

interface BlogCardProps {
  post: {
    id: string;
    title: string;
    slug: string;
    excerpt?: string | null;
    image?: string | null;
    createdAt: Date | string;
  };
}

export default function BlogCard({ post }: BlogCardProps) {
  return (
    <article className="card-premium group overflow-hidden animate-fade-in-up">
      {post.image ? (
        <div className="aspect-[16/9] bg-gray-100 overflow-hidden">
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="aspect-[16/9] bg-brand-gradient/10 flex items-center justify-center">
          <span className="text-3xl">📝</span>
        </div>
      )}
      <div className="p-6">
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
          <Calendar size={12} />
          {formatDate(post.createdAt)}
        </div>
        <h3 className="font-bold text-gray-900 dark:text-white text-[15px] mb-2.5 line-clamp-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
          <Link href={`/blog/${post.slug}`}>
            {post.title}
          </Link>
        </h3>
        {post.excerpt && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed">{post.excerpt}</p>
        )}
        <Link
          href={`/blog/${post.slug}`}
          className="inline-flex items-center gap-1 mt-4 text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors"
        >
          Leer más <ArrowRight size={12} />
        </Link>
      </div>
    </article>
  );
}
