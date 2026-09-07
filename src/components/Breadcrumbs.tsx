import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface Crumb {
  href?: string;
  label: string;
}

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-text-secondary">
        <li>
          <Link
            href="/"
            className="inline-flex items-center gap-1 hover:text-primary transition-colors"
          >
            <Home size={13} />
            <span className="hidden sm:inline">Inicio</span>
          </Link>
        </li>
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1.5">
              <ChevronRight size={12} className="text-text-tertiary" />
              {!isLast && item.href ? (
                <Link href={item.href} className="hover:text-primary transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className="font-medium text-text-primary line-clamp-1" aria-current="page">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}