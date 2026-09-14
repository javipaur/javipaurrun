export default function AtletaLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-8">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm animate-pulse">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 h-24 md:h-32" />
        <div className="px-6 md:px-8 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 mb-6">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-gray-200 dark:bg-gray-800 border-2 border-white dark:border-gray-900 shadow-md" />
            <div className="flex-1 space-y-2 pb-1">
              <div className="h-6 w-48 rounded-lg bg-gray-200 dark:bg-gray-800" />
              <div className="h-4 w-36 rounded-full bg-gray-200 dark:bg-gray-800" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-8">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-gray-200 dark:bg-gray-800" />
            ))}
          </div>

          <div className="h-5 w-32 rounded-full bg-gray-200 dark:bg-gray-800 mb-4" />
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-gray-200 dark:bg-gray-800" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}