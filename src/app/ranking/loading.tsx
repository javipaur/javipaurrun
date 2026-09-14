export default function RankingLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
      <div className="mb-7">
        <div className="h-3 w-24 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse mb-2" />
        <div className="h-8 w-52 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse mb-2" />
        <div className="h-4 w-64 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-8 w-24 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
        ))}
      </div>

      <div className="card-premium overflow-hidden">
        <div className="bg-gray-200 dark:bg-gray-800 h-12 animate-pulse" />
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-800" />
              <div className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-800" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 rounded-full bg-gray-200 dark:bg-gray-800" />
                <div className="h-3 w-56 rounded-full bg-gray-200 dark:bg-gray-800" />
              </div>
              <div className="h-4 w-16 rounded-full bg-gray-200 dark:bg-gray-800" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}