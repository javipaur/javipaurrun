import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Compass, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-orange-200">
        <Compass size={28} className="text-white" />
      </div>

      <p className="section-eyebrow mb-2">Error 404</p>
      <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-3">
        No encontramos esta página
      </h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
        Puede que el enlace esté mal escrito o que la carrera ya no esté publicada.
        Prueba desde el calendario o el directorio por provincia.
      </p>

      <div className="flex flex-wrap gap-3 justify-center">
        <Link href="/calendario" className="btn-primary">
          <CalendarDays size={16} />
          Ver calendario
        </Link>
        <Link href="/carreras" className="btn-secondary">
          <MapPin size={16} />
          Carreras por provincia
        </Link>
      </div>
    </div>
  );
}
