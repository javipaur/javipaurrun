"use client";

import { useState } from "react";
import Image from "next/image";

/**
 * Imagen de cabecera de la ficha de carrera.
 *
 * Es un isla cliente solo por el `onError`: si la URL de origen devuelve 404 o
 * el dominio deja de servirla, ocultamos el hueco en vez de mostrar un icono
 * de imagen rota. El resto de la ficha se renderiza en servidor.
 */
export default function RaceHeroImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <div className="aspect-[2/1] sm:aspect-[3/1] bg-gray-100 relative overflow-hidden">
      <Image
        src={src}
        alt={alt}
        fill
        priority
        sizes="(max-width: 1024px) 100vw, 896px"
        className="object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
