import { Skeleton, StatSkeleton, TableSkeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-7" aria-busy="true">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-40 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>
      <StatSkeleton />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <TableSkeleton rows={5} />
        <div className="space-y-6">
          <Skeleton className="h-56 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
      <span className="sr-only">Loading overview…</span>
    </div>
  );
}
