import RaceCardSkeleton from "@/components/RaceCardSkeleton";

export default function CalendarLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
      <div className="mb-8">
        <div className="h-3 w-32 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse mb-2" />
        <div className="h-8 w-56 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse mb-2" />
        <div className="h-4 w-40 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <div className="hidden lg:block">
          <div className="card-premium p-5 sticky top-24 space-y-5">
            <div className="h-4 w-16 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RaceCardSkeleton count={4} />
        </div>
      </div>
    </div>
  );
}