/**
 * Marca de JavipaurRun.
 *
 * Concepto: una pista de atletismo en perspectiva (las calles convergen) con un
 * corredor cruzando la meta. Funciona a 16px (favicon) y a 512px (PWA, OG image)
 * porque la silueta se apoya en pocas formas y alto contraste.
 */
export default function Logo({
  size = 36,
  markOnly = false,
  className = "",
  showWordmark = true,
}: {
  size?: number;
  markOnly?: boolean;
  className?: string;
  showWordmark?: boolean;
}) {
  const gradId = `jp-logo-${size}`;
  const showText = showWordmark && !markOnly;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www://www.w3.org/2000/svg"
        role="img"
        aria-label="JavipaurRun"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FF4D00" />
            <stop offset="0.55" stopColor="#FF7A47" />
            <stop offset="1" stopColor="#FFB08C" />
          </linearGradient>
        </defs>

        {/* Placa redondeada */}
        <rect x="1" y="1" width="62" height="62" rx="18" fill={`url(#${gradId})`} />

        {/* Carriles en perspectiva: dos líneas que convergen hacia la meta */}
        <path
          d="M11 54 L28 16"
          stroke="white"
          strokeOpacity="0.32"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path
          d="M23 56 L34 16"
          stroke="white"
          strokeOpacity="0.22"
          strokeWidth="2.6"
          strokeLinecap="round"
        />

        {/* Línea de meta (cinta a cuadros) */}
        <g>
          <rect x="45" y="10" width="9" height="44" rx="2" fill="white" fillOpacity="0.95" />
          <g fill="#FF4D00">
            <rect x="45" y="10" width="4.5" height="7.4" rx="1" />
            <rect x="49.5" y="17.4" width="4.5" height="7.4" rx="1" />
            <rect x="45" y="24.8" width="4.5" height="7.4" rx="1" />
            <rect x="49.5" y="32.2" width="4.5" height="7.4" rx="1" />
            <rect x="45" y="39.6" width="4.5" height="7.4" rx="1" />
            <rect x="49.5" y="47" width="4.5" height="7" rx="1" />
          </g>
        </g>

        {/* Corredor en zancada, orientado hacia la meta */}
        <g stroke="white" strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="32" cy="15" r="3" fill="white" stroke="none" />
          {/* tronco inclinado hacia delante */}
          <path d="M31.5 19 L36 27" />
          {/* pierna adelantada (tierra) */}
          <path d="M36 27 L43 36 L45 45" />
          {/* pierna atrasada (recogida) */}
          <path d="M34 30 L26 37 L23 44" />
          {/* brazo adelantado hacia la cinta */}
          <path d="M33 22 L42 19" />
          {/* brazo atrasado */}
          <path d="M34 24 L28 31" />
        </g>
      </svg>

      {showText && (
        <span className="text-[calc(0.95rem+4px)] sm:text-xl font-black tracking-tight text-gray-900 dark:text-white">
          Javipaur<span className="text-brand-gradient">Run</span>
        </span>
      )}
    </div>
  );
}