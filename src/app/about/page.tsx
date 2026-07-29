import { User, Heart } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-200">
          <User size={28} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Sobre JavipaurRun</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm space-y-5 text-gray-600 leading-relaxed">
        <p>
          JavipaurRun nace con la idea de crear un calendario completo y actualizado
          de carreras populares en Euskadi y comunidades cercanas.
        </p>
        <p>
          Aquí encontrarás carreras de asfalto, trail, marchas y orientación en
          Álava, Bizkaia, Gipuzkoa, Cantabria, Burgos, La Rioja, Navarra y Zamora.
        </p>
        <p>
          El objetivo es ofrecer un sitio sencillo donde poder buscar tu próxima
          carrera sin tener que rebuscar en múltiples webs.
        </p>

        <div className="flex items-center gap-2 pt-4 text-sm text-gray-500">
          <Heart size={16} className="text-orange-500" />
          Hecho con pasión para la comunidad runner
        </div>
      </div>
    </div>
  );
}
