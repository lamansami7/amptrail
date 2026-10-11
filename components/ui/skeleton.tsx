import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-surface-3', className)}
    />
  );
}

/** Loading scaffold for list pages: header, filter bar and table rows. */
export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="card-flush" aria-hidden="true">
      <div className="flex items-center gap-4 border-b border-line bg-surface-2/80 px-5 py-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-40" />
        <Skeleton className="ml-auto h-3 w-20" />
      </div>
      <div className="divide-y divide-line">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 px-5 py-4">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3.5 w-48" />
            <Skeleton className="hidden h-3.5 w-64 sm:block" />
            <Skeleton className="ml-auto h-5 w-20 rounded-full" />
            <Skeleton className="h-3.5 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card p-5">
          <div className="flex items-start justify-between">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <Skeleton className="mt-4 h-7 w-24" />
          <Skeleton className="mt-2 h-3 w-32" />
        </div>
      ))}
    </div>
  );
}
