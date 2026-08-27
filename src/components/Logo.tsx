export default function Logo({
  size = 36,
  markOnly = false,
  className = "",
}: {
  size?: number;
  markOnly?: boolean;
  className?: string;
}) {
  const gradId = `jp-grad-${size}`;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FF4D00" />
            <stop offset="0.55" stopColor="#FF7A47" />
            <stop offset="1" stopColor="#FFB08C" />
          </linearGradient>
          <linearGradient id={`${gradId}-tail`} x1="0" y1="64" x2="64" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FF4D00" stopOpacity="0" />
            <stop offset="1" stopColor="#FF4D00" />
          </linearGradient>
        </defs>

        {/* Rounded plate */}
        <rect x="2" y="2" width="60" height="60" rx="17" fill={`url(#${gradId})`} />
        <rect x="2" y="2" width="60" height="60" rx="17" fill="white" fillOpacity="0.08" />

        {/* Speed chevrons */}
        <path d="M8 46 L18 36" stroke="white" strokeOpacity="0.55" strokeWidth="4" strokeLinecap="round" />
        <path d="M16 50 L26 40" stroke="white" strokeOpacity="0.75" strokeWidth="4" strokeLinecap="round" />

        {/* Runner "J" - a sprinter leaning forward to the finish line */}
        <g stroke="white" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Head */}
          <circle cx="41" cy="17" r="3.2" fill="white" stroke="none" />
          {/* Torso/leaning body diagonally */}
          <path d="M41 21 Q46 27 43 33" />
          {/* Leading leg (extended stride forward/down) */}
          <path d="M44 30 L52 40 L55 48" />
          {/* Trailing leg (kicked back) */}
          <path d="M40 33 L33 43 L30 50" />
          {/* Extended arm forward to the tape */}
          <path d="M42 27 L52 22" />
          {/* Trailing arm */}
          <path d="M42 30 L37 37" />
        </g>

        {/* Finish line tape */}
        <rect x="52" y="14" width="6" height="42" rx="2.5" fill="white" fillOpacity="0.9" />
      </svg>

      {!markOnly && (
        <span className="text-[calc(0.95rem+4px)] sm:text-xl font-black tracking-tight text-gray-900 dark:text-white">
          Javipaur<span className="text-brand-gradient">Run</span>
        </span>
      )}
    </div>
  );
}
