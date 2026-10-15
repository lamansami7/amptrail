import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, UsersRound } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { requireWorkspace } from '@/lib/data/workspace';
import { formatDate, initials } from '@/lib/utils';

export const metadata: Metadata = { title: 'Team' };

const plannedRoles = [
  ['Company owner', 'Full control of the workspace and its settings.'],
  ['Administrator', 'Manages people, projects and tickets.'],
  ['Project manager', 'Reviews tickets and evidence for their projects.'],
  ['Foreman', 'Documents field work and uploads evidence.'],
  ['Office staff', 'Prepares, reviews and exports tickets.'],
];

export default async function TeamPage() {
  const { user, workspace } = await requireWorkspace();
  const name = (user.user_metadata?.full_name as string | undefined) || user.email || 'You';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="Team"
        description={`People with access to ${workspace.name}.`}
      />

      <Card flush>
        <CardHeader title="Members" bordered icon={<UsersRound size={16} aria-hidden="true" />} />
        <ul className="divide-y divide-line">
          <li className="flex items-center gap-3 px-5 py-3.5">
            <span
              aria-hidden="true"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 text-[12px] font-semibold text-brand-800"
            >
              {initials(name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-semibold text-ink">{name} (you)</p>
              <p className="truncate text-[12px] text-muted">{user.email}</p>
            </div>
            <div className="text-right">
              <p className="text-[12.5px] font-semibold capitalize text-ink-soft">{workspace.role}</p>
              {user.created_at && (
                <p className="text-[11.5px] text-subtle">Joined {formatDate(user.created_at)}</p>
              )}
            </div>
          </li>
        </ul>
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
            <ShieldCheck size={17} aria-hidden="true" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="h3">Invitations and roles</h2>
              <span className="inline-flex items-center rounded-full border border-line bg-surface-3 px-2 py-0.5 text-[10.5px] font-semibold text-subtle">
                Planned
              </span>
            </div>
            <p className="mt-1 text-[13.5px] leading-6 text-muted">
              Inviting teammates is not built yet, and every account currently has its own
              workspace. When it ships, permissions will be enforced in the database rather than
              only hidden in the interface. The roles being designed:
            </p>
          </div>
        </div>
        <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
          {plannedRoles.map(([role, description]) => (
            <li key={role} className="rounded-lg border border-line bg-surface-2/60 px-3.5 py-3">
              <p className="text-[13px] font-semibold text-ink">{role}</p>
              <p className="mt-0.5 text-[12.5px] leading-5 text-muted">{description}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[12px] text-muted">
          Need to share access now?{' '}
          <Link href="/contact" className="link">
            Contact us
          </Link>
          .
        </p>
      </Card>
    </div>
  );
}
