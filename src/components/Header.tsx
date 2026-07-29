"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Search, Calendar, Home, Newspaper, User, Shield, MapPin } from "lucide-react";

const categories = [
  { href: "/calendario", label: "Todas las carreras" },
  { href: "/calendario?tipo=ASFALTO", label: "Running" },
  { href: "/calendario?tipo=TRAIL", label: "Trail" },
  { href: "/calendario?tipo=MEDIA_MARATON", label: "Media Maratón" },
  { href: "/calendario?tipo=MARATON", label: "Maratón" },
  { href: "/calendario?tipo=MARCHA", label: "Marcha" },
  { href: "/calendario?tipo=ORIENTACION", label: "Orientación" },
  { href: "/mapa", label: "Mapa" },
];

const bottomNav = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/calendario", label: "Carreras", icon: Calendar },
  { href: "/blog", label: "Blog", icon: Newspaper },
  { href: "/auth/login", label: "Cuenta", icon: User },
];

export default function Header({ session }: { session: any }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/calendario?buscar=${encodeURIComponent(searchQuery.trim())}`;
    }
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        {/* Top Row */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">J</span>
              </div>
              <span className="text-base sm:text-lg font-bold text-gray-900 hidden sm:block">
                JavipaurRun
              </span>
            </Link>

            {/* Search Bar - Desktop */}
            <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-md mx-6">
              <div className="relative w-full">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar carreras..."
                  className="w-full h-9 pl-9 pr-3 rounded-lg bg-gray-100 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>
            </form>

            {/* Right side */}
            <div className="hidden sm:flex items-center gap-2">
              {session ? (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors"
                >
                  <Shield size={15} />
                  Panel
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <User size={15} />
                    Atleta
                  </Link>
                  <span className="text-gray-300">|</span>
                  <Link
                    href="/auth/register"
                    className="px-4 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all"
                  >
                    Registrarse
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="sm:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Category Bar */}
        <div className="border-t border-gray-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none">
              {categories.map((cat) => {
                const isActive = pathname === "/calendario" && cat.href.includes("tipo=")
                  ? new URLSearchParams(window.location.search).get("tipo") === cat.href.split("=")[1]
                  : pathname === cat.href;
                return (
                  <Link
                    key={cat.href}
                    href={cat.href}
                    className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? "bg-orange-500 text-white"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    {cat.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="sm:hidden border-t border-gray-100 bg-white animate-fade-in">
            <div className="px-4 py-3 space-y-1">
              {/* Mobile search */}
              <form onSubmit={handleSearch} className="mb-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar carreras..."
                    className="w-full h-10 pl-9 pr-3 rounded-lg bg-gray-100 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              </form>

              <Link href="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                <Home size={18} /> Inicio
              </Link>
              <Link href="/calendario" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                <Calendar size={18} /> Calendario
              </Link>
              <Link href="/mapa" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                <MapPin size={18} /> Mapa
              </Link>
              <Link href="/blog" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                <Newspaper size={18} /> Blog
              </Link>
              <hr className="my-2 border-gray-100" />
              {session ? (
                <Link href="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-orange-600 bg-orange-50">
                  <Shield size={18} /> Panel de control
                </Link>
              ) : (
                <>
                  <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                    <User size={18} /> Acceder
                  </Link>
                  <Link href="/auth/register" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-orange-600 bg-orange-50">
                    Crear cuenta
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Bottom Nav - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around px-2 py-1">
          {bottomNav.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-medium transition-colors ${
                  isActive ? "text-orange-500" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
