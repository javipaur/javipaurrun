"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Search, Calendar, Home, Newspaper, User, Shield, MapPin, Moon, Sun, Timer, Trophy } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useI18n } from "@/lib/i18n/provider";
import SearchAutocomplete from "./SearchAutocomplete";
import LangSwitcher from "./LangSwitcher";
import Logo from "./Logo";

const categories = [
  { href: "/calendario", label: "Todas las carreras" },
  { href: "/calendario?tipo=ASFALTO", label: "Running" },
  { href: "/calendario?tipo=TRAIL", label: "Trail" },
  { href: "/calendario?tipo=MEDIA_MARATON", label: "Media Maratón" },
  { href: "/calendario?tipo=MARATON", label: "Maratón" },
  { href: "/calendario?tipo=MARCHA", label: "Marcha" },
  { href: "/calendario?tipo=ORIENTACION", label: "Orientación" },
  { href: "/mapa", label: "Mapa" },
  { href: "/calculadora-ritmo", label: "Calculadora" },
  { href: "/ranking", label: "Ranking" },
];

const bottomNav = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/calendario", label: "Carreras", icon: Calendar },
  { href: "/ranking", label: "Ranking", icon: Trophy },
  { href: "/calculadora-ritmo", label: "Calculadora", icon: Timer },
  { href: "/blog", label: "Blog", icon: Newspaper },
  { href: "/auth/login", label: "Cuenta", icon: User },
];

export default function Header({ session }: { session: any }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const { theme, toggle } = useTheme();
  const { lang } = useI18n();

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/85 dark:bg-[#09090b]/85 backdrop-blur-xl border-b border-gray-200/70 dark:border-gray-800/70 supports-[backdrop-filter]:bg-white/75">
        {/* Top Row */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link href="/" className="shrink-0">
              <Logo size={34} />
            </Link>

            {/* Search Bar - Desktop */}
            <div className="hidden lg:flex flex-1 max-w-md mx-6">
              <SearchAutocomplete />
            </div>

            {/* Right side */}
            <div className="hidden sm:flex items-center gap-2">
              <LangSwitcher />
              <button
                onClick={toggle}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Cambiar modo oscuro/claro"
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              {session ? (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full btn-primary"
                >
                  <Shield size={15} />
                  Panel
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <User size={15} />
                    Atleta
                  </Link>
                  <span className="text-gray-300 dark:text-gray-700">|</span>
                  <Link
                    href="/auth/register"
                    className="px-4 py-1.5 rounded-full border border-gray-300 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:border-orange-400 hover:text-orange-500 dark:hover:text-orange-400 transition-all"
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
        <div className="border-t border-gray-100/70 dark:border-gray-800/70 bg-white/60 dark:bg-[#09090b]/60 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 scrollbar-none">
              {categories.map((cat) => {
                const isActive = pathname === "/calendario" && cat.href.includes("tipo=")
                  ? new URLSearchParams(window.location.search).get("tipo") === cat.href.split("=")[1]
                  : pathname === cat.href;
                return (
                  <Link
                    key={cat.href}
                    href={cat.href}
                    className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                      isActive
                        ? "chip-active shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
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
              <div className="mb-3">
                <SearchAutocomplete />
              </div>

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
              <Link href="/ranking" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                <Trophy size={18} /> Ranking
              </Link>
              <div className="flex items-center gap-1 px-4 py-2">
                <LangSwitcher />
                <span className="text-xs text-gray-400 ml-1">
                  {lang === "es" ? "Idioma" : "Hizkuntza"}
                </span>
              </div>
              <button onClick={toggle} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 w-full">
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />} {theme === "dark" ? "Modo claro" : "Modo oscuro"}
              </button>
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
