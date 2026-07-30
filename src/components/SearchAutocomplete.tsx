"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, Calendar, MapPin, FileText, X } from "lucide-react";
import { formatDateShort, getRaceTypeLabel } from "@/lib/utils";

interface RaceResult {
  id: string; name: string; slug: string; type: string;
  location: string; province: string; date: string; distance: string | null;
}

interface PostResult {
  id: string; title: string; slug: string;
}

export default function SearchAutocomplete() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [races, setRaces] = useState<RaceResult[]>([]);
  const [posts, setPosts] = useState<PostResult[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleChange(val: string) {
    setQuery(val);
    if (timer.current) clearTimeout(timer.current);
    if (val.length < 2) {
      setRaces([]);
      setPosts([]);
      setOpen(false);
      return;
    }
    timer.current = setTimeout(() => {
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(val)}`)
        .then((r) => r.json())
        .then((d) => {
          setRaces(d.races || []);
          setPosts(d.posts || []);
          setOpen(true);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 300);
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => { if (races.length || posts.length) setOpen(true); }}
          placeholder="Buscar carreras, lugares..."
          className="w-full h-10 pl-9 pr-8 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setOpen(false); setRaces([]); setPosts([]); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {open && (races.length > 0 || posts.length > 0) && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-50 max-h-96 overflow-y-auto">
          {races.length > 0 && (
            <div className="p-2">
              <p className="px-2 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Carreras ({races.length})
              </p>
              {races.map((r) => (
                <Link
                  key={r.id}
                  href={`/carrera/${r.slug}`}
                  onClick={() => { setOpen(false); setQuery(""); }}
                  className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Calendar size={14} className="shrink-0 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                      {r.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <span>{getRaceTypeLabel(r.type)}</span>
                      {r.distance && <span>· {r.distance}</span>}
                      <span>· {formatDateShort(r.date)}</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {posts.length > 0 && (
            <div className="p-2 border-t border-gray-100 dark:border-gray-700">
              <p className="px-2 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Blog ({posts.length})
              </p>
              {posts.map((p) => (
                <Link
                  key={p.id}
                  href={`/blog/${p.slug}`}
                  onClick={() => { setOpen(false); setQuery(""); }}
                  className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <FileText size={14} className="shrink-0 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                    {p.title}
                  </span>
                </Link>
              ))}
            </div>
          )}
          <div className="p-2 border-t border-gray-100 dark:border-gray-700">
            <Link
              href={`/calendario?buscar=${encodeURIComponent(query)}`}
              onClick={() => { setOpen(false); setQuery(""); }}
              className="flex items-center justify-center gap-1 px-2 py-2 text-xs font-medium text-orange-600 hover:text-orange-700 transition-colors"
            >
              Ver todos los resultados
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
