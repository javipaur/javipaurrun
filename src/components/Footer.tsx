import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="bg-[#0d0e13] dark:bg-[#0a0a0c] border-t border-white/5 mt-auto text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
          <div>
            <Link href="/" className="mb-4 inline-block">
              <Logo size={38} markOnly />
            </Link>
            <span className="sr-only">JavipaurRun</span>
            <p className="text-sm text-gray-500 leading-relaxed mt-2">
              El calendario de carreras populares de España. Ascene a los trails, maratones y marchas de todo el país.
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
              <li><Link href="/auth/register" className="text-sm text-gray-400 hover:text-white transition-colors">Crear cuenta</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm mb-4">Sígueme</h4>
            <p className="text-sm text-gray-500 mb-4">Próximamente en redes sociales</p>
            <div className="flex gap-2">
              <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-orange-500 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
              </div>
              <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-orange-500 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 016.11 2.525c.636-.247 1.363-.416 2.427-.465C8.83 2.013 9.175 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"/></svg>
              </div>
            </div>
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
            Calendario actualizado a diario
          </p>
        </div>
      </div>
    </footer>
  );
}
