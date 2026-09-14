export default function MapaLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
      <div className="mb-7">
        <div className="h-3 w-20 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse mb-2" />
        <div className="h-8 w-52 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse mb-2" />
        <div className="h-4 w-40 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
      </div>
      <div className="h-[480px] rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse overflow-hidden">
        <div className="relative w-full h-full">
          <div className="absolute inset-0" style={{
            backgroundImage: "linear-gradient(45deg, transparent 25%, rgba(255,255,255,0.25) 25%, rgba(255,255,255,0.25) 50%, transparent 50%, transparent 75%, rgba(255,255,255,0.25) 75%)",
            backgroundSize: "48px 48px",
          }} />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 animate-ping" />
        </div>
      </div>
    </div>
  );
}