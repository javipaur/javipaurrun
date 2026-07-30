"use client";

import { useI18n, type Lang } from "@/lib/i18n/provider";
import { Globe } from "lucide-react";

export default function LangSwitcher() {
  const { lang, setLang } = useI18n();

  function toggle() {
    setLang(lang === "es" ? "eu" : "es");
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="Cambiar idioma / Hizkuntza aldatu"
    >
      <Globe size={13} />
      {lang === "es" ? "ES" : "EU"}
    </button>
  );
}
