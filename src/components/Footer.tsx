import Link from "next/link";
import Logo from "./Logo";
import { getLastSync, timeAgo } from "@/lib/data-quality";

export default async function Footer() {
  const lastSync = await getLastSync();

  return (
    <footer className="bg-[#0d0e13] dark:bg-[#0a0a0c] border-t border-white/5 mt-auto text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <Link href="/" className="mb-4 inline-block">
              <Logo size={38} markOnly />
            </Link>
            <span className="sr-only">JavipaurRun</span>
            <p className="text-sm text-gray-500 leading-relaxed mt-2">
              El calendario de carreras populares de España. Accede a los trails, maratones y marchas de todo el país.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm mb-4">Carreras</h4>
            <ul className="space-y-2.5">
              <li><Link href="/calendario?tipo=ASFALTO" className="text-sm text-gray-400 hover:text-white transition-colors">Running</Link></li>
              <li><Link href="/calendario?tipo=TRAIL" className="text-sm text-gray-400 hover:text-white transition-colors">Trail</Link></li>
              <li><Link href="/calendario?tipo=MEDIA_MARATON" className="text-sm text-gray-400 hover:text-white transition-colors">Media Maratón</Link></li>
              <li><Link href="/calendario?tipo=MARATON" className="text-sm text-gray-400 hover:text-white transition-colors">Maratón</Link></li>
              <li><Link href="/calendario?tipo=MARCHA" className="text-sm text-gray-400 hover:text-white transition-colors">Marcha</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm mb-4">Provincias</h4>
            <ul className="space-y-2.5">
              <li><Link href="/carreras/alava" className="text-sm text-gray-400 hover:text-white transition-colors">Álava/Araba</Link></li>
              <li><Link href="/carreras/bizkaia" className="text-sm text-gray-400 hover:text-white transition-colors">Bizkaia</Link></li>
              <li><Link href="/carreras/gipuzkoa" className="text-sm text-gray-400 hover:text-white transition-colors">Gipuzkoa</Link></li>
              <li><Link href="/carreras/cantabria" className="text-sm text-gray-400 hover:text-white transition-colors">Cantabria</Link></li>
              <li><Link href="/carreras/burgos" className="text-sm text-gray-400 hover:text-white transition-colors">Burgos</Link></li>
              <li><Link href="/carreras/navarra" className="text-sm text-gray-400 hover:text-white transition-colors">Navarra</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm mb-4">Contenido</h4>
            <ul className="space-y-2.5">
              <li><Link href="/blog" className="text-sm text-gray-400 hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/about" className="text-sm text-gray-400 hover:text-white transition-colors">Sobre mí</Link></li>
              <li><Link href="/calculadora-ritmo" className="text-sm text-gray-400 hover:text-white transition-colors">Calculadora de ritmo</Link></li>
              <li><Link href="/ranking" className="text-sm text-gray-400 hover:text-white transition-colors">Ranking</Link></li>
              <li><Link href="/completitud" className="text-sm text-gray-400 hover:text-white transition-colors">Estado de los datos</Link></li>
              <li><Link href="/auth/register" className="text-sm text-gray-400 hover:text-white transition-colors">Crear cuenta</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm mb-4">Legal</h4>
            <ul className="space-y-2.5">
              <li><Link href="/about" className="text-sm text-gray-400 hover:text-white transition-colors">Aviso legal</Link></li>
              <li><Link href="/about" className="text-sm text-gray-400 hover:text-white transition-colors">Privacidad</Link></li>
              <li><Link href="/about" className="text-sm text-gray-400 hover:text-white transition-colors">Cookies</Link></li>
              <li><Link href="/about" className="text-sm text-gray-400 hover:text-white transition-colors">Contacto</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} JavipaurRun. Todos los derechos reservados.
          </p>
          <p className="text-xs text-gray-600 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {lastSync ? (
              <>
                Datos sincronizados {timeAgo(lastSync)} ·{" "}
                <Link href="/completitud" className="hover:text-gray-400 transition-colors">
                  ver cobertura
                </Link>
              </>
            ) : (
              "Calendario actualizado a diario"
            )}
          </p>
        </div>
      </div>
    </footer>
  );
}
