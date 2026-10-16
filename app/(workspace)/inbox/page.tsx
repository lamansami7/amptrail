import type { Metadata } from 'next';
import Link from 'next/link';
import { Inbox, MessageSquareText } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { requireWorkspace } from '@/lib/data/workspace';

export const metadata: Metadata = { title: 'Inbox' };

const plannedStates = [
  ['New', 'A submission arrived and nobody has looked at it yet.'],
  ['Needs project', 'The message did not clearly name a project, so a person assigns it.'],
  ['Missing details', 'Hours, dates or quantities were not stated and need a follow-up.'],
  ['Ready for review', 'Everything needed is present and the office can build the ticket.'],
  ['Processed', 'The submission has been turned into a ticket or dismissed.'],
];

export default async function InboxPage() {
  await requireWorkspace();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="Inbox"
        description="Where field submissions will land for office review."
        meta={
          <span className="inline-flex items-center rounded-full border border-brand-line bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold text-brand-800">
            In development
          </span>
        }
      />

      <EmptyState
        icon={<Inbox size={20} aria-hidden="true" />}
        title="Text and photo intake is not available yet"
        description={
          <>
            There is no phone number connected to this workspace, so nothing can arrive here today.
            Until intake exists, document field work directly with a work ticket and attach photos
            as evidence.
          </>
        }
        action={<ButtonLink href="/tickets/new">Create a work ticket</ButtonLink>}
        secondaryAction={
          <ButtonLink href="/evidence" variant="secondary">
            Open evidence
          </ButtonLink>
        }
      />

      <Card className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
            <MessageSquareText size={17} aria-hidden="true" />
          </span>
          <div>
            <h2 className="h3">How submissions are planned to be triaged</h2>
            <p className="mt-1 text-[13.5px] leading-6 text-muted">
              Each incoming message would be kept exactly as received and sorted into one of these
              states. Nothing would be attached to a project without a person confirming it when
              the project is unclear.
            </p>
          </div>
        </div>
        <ol className="mt-5 grid gap-2.5 sm:grid-cols-2">
          {plannedStates.map(([name, description]) => (
            <li key={name} className="rounded-lg border border-line bg-surface-2/60 px-3.5 py-3">
              <p className="text-[13px] font-semibold text-ink">{name}</p>
              <p className="mt-0.5 text-[12.5px] leading-5 text-muted">{description}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-[12px] text-muted">
          Want this sooner?{' '}
          <Link href="/contact" className="link">
            Tell us how your crews send field notes today
          </Link>
          .
        </p>
      </Card>
    </div>
  );
}
