import { Skeleton, TableSkeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>
      <Skeleton className="h-24 w-full rounded-xl" />
      <TableSkeleton rows={5} />
      <span className="sr-only">Loading records…</span>
    </div>
  );
}
