import { Alert } from '@/components/ui/alert';

/**
 * Shown when a workspace query fails. Deliberately reassuring and actionable —
 * never a raw database error.
 */
export function WorkspaceDataNotice({
  message = 'We could not load this workspace data right now.',
  tone = 'warning',
}: {
  message?: string;
  tone?: 'warning' | 'danger';
}) {
  return (
    <Alert
      tone={tone}
      role="status"
      title="Workspace data unavailable"
      action={
        <a
          href="/dashboard"
          className="link text-[13px] whitespace-nowrap"
        >
          Retry
        </a>
      }
    >
      {message} If this continues, confirm the Supabase migration has been applied and that your
      session is current.
    </Alert>
  );
}
