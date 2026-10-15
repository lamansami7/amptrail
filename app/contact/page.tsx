import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BookOpen,
  Building2,
  FileDown,
  KeyRound,
  LifeBuoy,
  Mail,
  Paperclip,
  ShieldQuestion,
} from 'lucide-react';
import { LegalSection, LegalShell } from '@/components/marketing/legal-shell';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { SUPPORT_EMAIL, supportMailto } from '@/lib/support';

export const metadata: Metadata = {
  title: 'Contact support',
  description: `Contact AmpTrail support at ${SUPPORT_EMAIL} for help with your workspace, work tickets, evidence photos and PDF exports.`,
};

const quickLinks: Array<[string, string, string]> = [
  ['Reset a password', '/forgot-password', 'Send yourself a secure reset link'],
  ['Sign-in link expired', '/forgot-password', 'Request a fresh recovery email'],
  ['Workspace locked', '/workspace-setup', 'Membership provisioning steps'],
  ['How it works', '/#how-it-works', 'From jobsite evidence to a T&M ticket'],
];

const topics: Array<{ icon: typeof Mail; title: string; body: string }> = [
  {
    icon: KeyRound,
    title: 'Account & access',
    body: 'Password recovery, email confirmation, and signing in on the phones your crew uses.',
  },
  {
    icon: Building2,
    title: 'Workspace setup',
    body: 'Company details, connecting Supabase, migrations, and membership provisioning.',
  },
  {
    icon: Paperclip,
    title: 'Tickets & evidence',
    body: 'Work ticket totals, status tracking, photo uploads, captions and galleries.',
  },
  {
    icon: FileDown,
    title: 'PDF exports',
    body: 'Print-ready T&M records, line-item breakdowns, evidence thumbnails and signatures.',
  },
];

export default function ContactPage() {
  return (
    <LegalShell
      eyebrow="Support"
      title="Contact AmpTrail"
      aside={
        <Card flush>
          <CardHeader title="Before you write" description="Fast answers" bordered />
          <ul className="divide-y divide-line text-[13px]">
            {quickLinks.map(([label, href, description]) => (
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
      {/* Primary contact — one obvious, working action. */}
      <div className="overflow-hidden rounded-xl border border-brand-line bg-brand-50/50">
        <div className="p-6 sm:p-7">
          <p className="eyebrow">Official support email</p>
          <p className="mt-3 text-[15px] leading-7 text-body">
            The fastest way to reach us. Write to{' '}
            <strong className="font-semibold text-ink">{SUPPORT_EMAIL}</strong> — a person reads
            every message.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <a
              href={supportMailto({
                subject: 'AmpTrail support request',
                body: 'Hello AmpTrail support,\n\nWhat I was doing:\n\nWhat happened:\n\nProject or ticket number (if relevant):\n\nThank you.',
              })}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-600 px-5 text-[14px] font-semibold text-white shadow-xs transition-colors duration-150 hover:bg-brand-700 active:bg-brand-800"
            >
              <Mail size={16} aria-hidden="true" />
              Email {SUPPORT_EMAIL}
            </a>
            <ButtonLink href="/#faq" variant="secondary" size="lg">
              <BookOpen size={15} aria-hidden="true" />
              Read the FAQ
            </ButtonLink>
          </div>
          <p className="mt-4 text-[12.5px] leading-5 text-muted">
            The button opens your email app with a message ready to send. If nothing opens, write to{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="link">
              {SUPPORT_EMAIL}
            </a>{' '}
            directly.
          </p>
        </div>
      </div>

      <LegalSection heading="What to include in your message">
        <ul className="space-y-2">
          {[
            'The email address you use to sign in to AmpTrail',
            'The project name or ticket number, if it is about a specific record',
            'What you were doing, what you expected, and what happened instead',
            'A screenshot or photo of the error, if you have one — they help a lot',
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

      <LegalSection heading="What we can help with">
        <div className="grid gap-3 sm:grid-cols-2">
          {topics.map((topic) => {
            const Icon = topic.icon;
            return (
              <div
                key={topic.title}
                className="rounded-xl border border-line bg-surface-2/50 p-4 transition-colors duration-150 hover:border-line-strong hover:bg-surface-2"
              >
                <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-50 text-brand-700">
                    <Icon size={14} aria-hidden="true" />
                  </span>
                  {topic.title}
                </p>
                <p className="mt-2 text-[12.5px] leading-6 text-muted">{topic.body}</p>
              </div>
            );
          })}
        </div>
      </LegalSection>

      <LegalSection heading="Good to know">
        <ul className="space-y-2">
          {[
            'AmpTrail is a documentation tool — we can explain how totals and statuses work, but we do not approve work or guarantee payment.',
            'Your jobsite photos are stored privately and scoped to your company. Support will never ask for your password.',
            'If your reset or confirmation emails are not arriving, tell us — that is usually an email-delivery configuration issue we can diagnose together.',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <LifeBuoy size={15} className="mt-1.5 shrink-0 text-brand-600" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </LegalSection>
    </LegalShell>
  );
}
