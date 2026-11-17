import type { Metadata } from "next";
import { User, Heart } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sobre nosotros",
  description:
    "Qué es RunHub, de dónde salen los datos del calendario de pruebas deportivas en España y cómo puedes proponer o corregir una prueba.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-200">
          <User size={28} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Sobre RunHub</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm space-y-5 text-gray-600 leading-relaxed">
        <p>
          RunHub reúne el calendario de pruebas deportivas populares de toda
          España: running y asfalto, trail, media maratón y maratón, marchas,
          orientación, ciclismo, triatlón, natación e híbridos (HYROX y OCR).
        </p>
        <p>
          Los datos proceden de calendarios públicos y de las webs de los
          organizadores: fecha, provincia, distancia, tipo de prueba, precio,
          coordenadas y enlace de inscripción. Cuando un dato no está
          disponible lo marcamos como pendiente en lugar de rellenarlo con una
          suposición.
        </p>
        <p>
          La idea es sencilla: que encuentres tu próxima prueba sin tener que
          rebuscar en diez webs distintas, y que puedas comparar fechas,
          distancias y precios en un solo sitio.
        </p>
        <p>
          Si echas en falta una prueba o ves un dato incorrecto,{" "}
          <Link
            href="/enviar-carrera"
            className="text-orange-600 hover:text-orange-700 underline underline-offset-2 font-medium"
          >
            propón una carrera
          </Link>{" "}
          y la revisamos antes de publicarla. También puedes consultar la{" "}
          <Link
            href="/completitud"
            className="text-orange-600 hover:text-orange-700 underline underline-offset-2 font-medium"
          >
            cobertura de datos
          </Link>{" "}
          del calendario.
        </p>

        <div className="flex items-center gap-2 pt-4 text-sm text-gray-500">
          <Heart size={16} className="text-orange-500" />
          Hecho con pasión para la comunidad deportiva
        </div>
      </div>
    </div>
  );
}
