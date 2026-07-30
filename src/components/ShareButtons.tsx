"use client";

import { useState } from "react";
import {
  Share2, Check, Copy, ExternalLink,
} from "lucide-react";

const platforms = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    color: "bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50",
    getUrl: (url: string, text: string) => `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
  },
  {
    id: "twitter",
    label: "X",
    color: "bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700",
    getUrl: (url: string, text: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    id: "facebook",
    label: "Facebook",
    color: "bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50",
    getUrl: (url: string, text: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    id: "telegram",
    label: "Telegram",
    color: "bg-sky-50 text-sky-600 hover:bg-sky-100 dark:bg-sky-900/30 dark:text-sky-400 dark:hover:bg-sky-900/50",
    getUrl: (url: string, text: string) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  {
    id: "email",
    label: "Email",
    color: "bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700",
    getUrl: (url: string, text: string) => `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`,
  },
];

export default function ShareButtons({
  url,
  title,
  description,
  compact,
}: {
  url: string;
  title: string;
  description?: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const text = title + (description ? ` — ${description.slice(0, 100)}` : "");

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {}
    }
    setShowMore(!showMore);
  }

  function handleCopy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function openUrl(getUrl: (url: string, text: string) => string) {
    window.open(getUrl(url, text), "_blank", "noopener,noreferrer");
  }

  const visible = compact ? platforms.slice(0, 2) : platforms;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Native share / main button */}
      {typeof navigator !== "undefined" && typeof navigator.share !== "undefined" ? (
        <button
          onClick={handleNativeShare}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-semibold hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors"
        >
          <Share2 size={14} />
          {compact ? "" : "Compartir"}
        </button>
      ) : compact ? (
        <button
          onClick={() => setShowMore(!showMore)}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Share2 size={13} />
        </button>
      ) : null}

      {/* Platform buttons */}
      {(showMore || !compact) && (
        <>
          {visible.map((p) => (
            <button
              key={p.id}
              onClick={() => openUrl(p.getUrl)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${p.color}`}
              title={p.label}
            >
              {p.id === "twitter" ? "𝕏" : p.id === "whatsapp" ? "WA" : p.id === "facebook" ? "f" : p.id === "telegram" ? "TG" : <ExternalLink size={12} />}
            </button>
          ))}
          <button
            onClick={handleCopy}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Copiar enlace"
          >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          </button>
        </>
      )}

      {compact && !showMore && !(typeof navigator !== "undefined" && typeof navigator.share !== "undefined") && (
        <button
          onClick={() => setShowMore(true)}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Más opciones"
        >
          <ExternalLink size={12} />
        </button>
      )}
    </div>
  );
}
