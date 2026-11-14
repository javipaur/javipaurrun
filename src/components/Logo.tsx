/**
 * Marca de RunHub.
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
  const gradId = `rh-logo-${size}`;
  const showText = showWordmark && !markOnly;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="RunHub"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#0284c7" />
            <stop offset="0.55" stopColor="#0ea5e9" />
            <stop offset="1" stopColor="#38bdf8" />
          </linearGradient>
        </defs>

        <rect x="2" y="2" width="60" height="60" rx="16" fill={`url(#${gradId})`} />
        <path d="M14 50 C20 34, 26 30, 32 32 C38 34, 42 22, 50 14" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="50" cy="14" r="4.2" fill="white" />
        <path d="M20 20h8M20 26h5M40 40h8M40 46h5" stroke="white" strokeOpacity="0.55" strokeWidth="2.2" strokeLinecap="round" />
      </svg>

      {showText && (
        <span className="text-[calc(0.95rem+4px)] sm:text-xl font-black tracking-tight text-gray-900 dark:text-white">
          Run<span className="text-sky-600 dark:text-sky-400">Hub</span>
        </span>
      )}
    </div>
  );
}
