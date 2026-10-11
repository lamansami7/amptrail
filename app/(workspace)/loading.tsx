import { Skeleton, StatSkeleton, TableSkeleton } from '@/components/ui/skeleton';

/**
 * Route-level loading state for the workspace. Because pages are server
 * rendered against Supabase, this keeps the shell stable instead of flashing
 * an empty screen while data resolves.
 */
export default function WorkspaceLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <StatSkeleton />
      <TableSkeleton />
      <span className="sr-only">Loading workspace data…</span>
    </div>
  );
}
