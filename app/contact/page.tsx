import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, LifeBuoy, Mail, ShieldQuestion } from 'lucide-react';
import { LegalSection, LegalShell } from '@/components/marketing/legal-shell';
import { Alert } from '@/components/ui/alert';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Contact' };

export default function ContactPage() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();

  return (
    <LegalShell
      eyebrow="Support"
      title="Contact AmpTrail"
      aside={
        <Card flush>
          <CardHeader title="Before you write" description="Fast answers" bordered />
          <ul className="divide-y divide-line text-[13px]">
            {[
              ['Reset a password', '/forgot-password', 'Send yourself a reset link'],
              ['Workspace locked', '/workspace-setup', 'Membership provisioning steps'],
              ['How it works', '/#workflow', 'The four-step field workflow'],
            ].map(([label, href, description]) => (
              <li key={label}>
                <Link
                  href={href}
                  className="block px-5 py-3 transition-colors duration-150 hover:bg-surface-2"
                >
                  <span className="block font-semibold text-ink">{label}</span>
                  <span className="mt-0.5 block text-[12px] text-muted">{description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      }
    >
      <LegalSection heading="Talk to us">
        <p>
          Questions about deployment configuration, field workflow, or administering your company
          workspace? Send them over with the project or ticket number if it relates to a specific
          record.
        </p>
      </LegalSection>

      {supportEmail ? (
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={`mailto:${supportEmail}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-600 px-5 text-[14px] font-semibold text-white shadow-xs transition-colors duration-150 hover:bg-brand-700"
          >
            <Mail size={16} aria-hidden="true" />
            Email {supportEmail}
          </a>
          <ButtonLink href="/#faq" variant="secondary" size="lg">
            <BookOpen size={15} aria-hidden="true" />
            Read the FAQ
          </ButtonLink>
        </div>
      ) : (
        <>
          <Alert tone="warning" title="No support address is published yet">
            This deployment has not configured a support email. An operator can set{' '}
            <code className="rounded bg-surface-3 px-1 py-0.5 font-mono text-[11.5px]">
              NEXT_PUBLIC_SUPPORT_EMAIL
            </code>{' '}
            in the hosting environment to publish a direct contact channel here.
          </Alert>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/signup">
              <LifeBuoy size={15} aria-hidden="true" />
              Create a workspace
            </ButtonLink>
            <ButtonLink href="/login" variant="secondary">
              Sign in
            </ButtonLink>
          </div>
        </>
      )}

      <LegalSection heading="What we can help with">
        <ul className="space-y-2">
          {[
            'Connecting your deployment to a Supabase project',
            'Applying the schema migration and fixing workspace membership problems',
            'Understanding ticket statuses, totals, or PDF output',
            'Issues uploading evidence photos or signing in',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <ShieldQuestion
                size={15}
                className="mt-1.5 shrink-0 text-brand-600"
                aria-hidden="true"
              />
              {item}
            </li>
          ))}
        </ul>
      </LegalSection>
    </LegalShell>
  );
}
