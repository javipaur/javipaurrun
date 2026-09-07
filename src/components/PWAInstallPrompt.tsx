"use client";

import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const STORAGE_KEY = "jp-pwa-dismissed";

export default function PWAInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setTimeout(() => setVisible(true), 8000);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  async function handleInstall() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") setVisible(false);
    setDeferred(null);
  }

  function handleDismiss() {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, "1");
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-24 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-fade-in-up">
      <div className="card-premium p-4 flex items-start gap-3 shadow-xl">
        <button onClick={handleInstall} className="shrink-0 w-10 h-10 rounded-xl bg-brand-gradient text-white flex items-center justify-center">
          <Download size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary mb-0.5">Instala JavipaurRun</p>
          <p className="text-xs text-text-secondary leading-relaxed">
            Accede al calendario de carreras sin conexión y más rápido.
          </p>
          <button
            onClick={handleInstall}
            className="mt-2 text-xs font-bold text-primary hover:underline"
          >
            Instalar app
          </button>
        </div>
        <button onClick={handleDismiss} aria-label="Cerrar" className="shrink-0 p-1 rounded-lg text-text-tertiary hover:text-text-primary transition-colors">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}