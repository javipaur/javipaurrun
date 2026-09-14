interface RaceCardSkeletonProps {
  count?: number;
  withImage?: boolean;
}

export default function RaceCardSkeleton({ count = 4, withImage = true }: RaceCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="card-premium overflow-hidden animate-pulse"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          {withImage && (
            <div className="aspect-[16/9] bg-gray-200 dark:bg-gray-800" />
          )}
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-5 w-16 rounded-full bg-gray-200 dark:bg-gray-800" />
              <div className="h-4 w-12 rounded-full bg-gray-200 dark:bg-gray-800" />
            </div>
            <div className="h-4 w-3/4 rounded-full bg-gray-200 dark:bg-gray-800" />
            <div className="space-y-2">
              <div className="h-3 w-1/2 rounded-full bg-gray-200 dark:bg-gray-800" />
              <div className="h-3 w-2/3 rounded-full bg-gray-200 dark:bg-gray-800" />
            </div>
            <div className="h-px bg-gray-100 dark:bg-gray-800 my-1" />
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 rounded-full bg-gray-200 dark:bg-gray-800" />
              <div className="flex gap-1.5">
                <div className="h-7 w-16 rounded-lg bg-gray-200 dark:bg-gray-800" />
                <div className="h-7 w-16 rounded-lg bg-gray-200 dark:bg-gray-800" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
