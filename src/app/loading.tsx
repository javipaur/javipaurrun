export default function HomeLoading() {
  return (
    <div>
      <div className="relative h-[420px] md:h-[520px] bg-gray-200 dark:bg-gray-800 animate-pulse overflow-hidden" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 -mt-10 relative z-10">
          {[0, 1, 2].map((i) => (
            <div key={i} className="stats-card text-center animate-pulse">
              <div className="h-9 w-24 mx-auto rounded-lg bg-gray-200 dark:bg-gray-800" />
              <div className="h-4 w-32 mx-auto mt-3 rounded-full bg-gray-200 dark:bg-gray-800" />
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 w-24 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>

        <div className="mb-6">
          <div className="h-3 w-28 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse mb-2" />
          <div className="h-8 w-64 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="card-premium overflow-hidden animate-pulse">
              <div className="aspect-[16/9] bg-gray-200 dark:bg-gray-800" />
              <div className="p-5 space-y-3">
                <div className="h-5 w-16 rounded-full bg-gray-200 dark:bg-gray-800" />
                <div className="h-4 w-3/4 rounded-full bg-gray-200 dark:bg-gray-800" />
                <div className="h-3 w-1/2 rounded-full bg-gray-200 dark:bg-gray-800" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}