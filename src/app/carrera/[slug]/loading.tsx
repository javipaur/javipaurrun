export default function RaceDetailLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-8">
      <div className="mb-6">
        <div className="h-3 w-28 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse mb-4" />
      </div>
      <div className="card-premium overflow-hidden">
        <div className="aspect-[2/1] sm:aspect-[3/1] bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-6 w-20 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div className="h-6 w-16 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
          </div>
          <div className="h-9 w-3/4 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse mb-7" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
                <div className="h-4 w-2/3 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mb-8">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 w-28 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
          <div className="h-24 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse mb-8" />
        </div>
      </div>
    </div>
  );
}