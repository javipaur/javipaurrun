"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import es from "./es";
import eu from "./eu";

export type Lang = "es" | "eu";
export type Translations = typeof es;

const translations: Record<Lang, Translations> = { es, eu };

const I18nContext = createContext<{
  lang: Lang;
  t: Translations;
  setLang: (l: Lang) => void;
}>({ lang: "es", t: es, setLang: () => {} });

export function useI18n() {
  return useContext(I18nContext);
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("es");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("lang") as Lang | null;
    if (stored === "es" || stored === "eu") setLangState(stored);
    setMounted(true);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("lang", l);
    document.documentElement.lang = l;
  }

  if (!mounted) {
    return (
      <I18nContext.Provider value={{ lang: "es", t: es, setLang }}>
        {children}
      </I18nContext.Provider>
    );
  }

  return (
    <I18nContext.Provider value={{ lang, t: translations[lang], setLang }}>
      {children}
    </I18nContext.Provider>
  );
}
