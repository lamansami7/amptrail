import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalSection, LegalShell } from '@/components/marketing/legal-shell';

export const metadata: Metadata = { title: 'Privacy' };

export default function PrivacyPage() {
  return (
    <LegalShell
      eyebrow="Data protection"
      title="Privacy"
      updated="October 11, 2026"
      aside={
        <div className="rounded-xl border border-line bg-surface-2/70 p-5 text-[12.5px] leading-5 text-muted">
          <p className="font-semibold text-body">Deployment template</p>
          <p className="mt-1.5">
            Review and adapt this page with your own legal counsel before relying on it. It describes
            how this build of AmpTrail handles data; it is not legal advice.
          </p>
          <p className="mt-3">
            Questions?{' '}
            <Link href="/contact" className="link">
              Contact us
            </Link>
            .
          </p>
        </div>
      }
    >
      <LegalSection heading="1. Data storage and ownership">
        <p>
          When you create an account, AmpTrail stores your profile, company details, projects, work
          tickets and uploaded jobsite photographs in the Supabase project connected to your
          deployment. You keep ownership of the content and business records your team uploads.
        </p>
      </LegalSection>

      <LegalSection heading="2. Private evidence handling">
        <p>
          Jobsite photographs are stored in a private Supabase Storage bucket. Access requires
          short-lived signed URLs issued to authenticated members of your company; links expire after
          one hour. Evidence is never exposed through public URLs or search engines.
        </p>
      </LegalSection>

      <LegalSection heading="3. Workspace data isolation">
        <p>
          Every application table has PostgreSQL row-level security enabled. Only authenticated
          members of your company can read its projects, tickets, line items and evidence records,
          and only the creator of a ticket can edit or delete it.
        </p>
      </LegalSection>

      <LegalSection heading="4. Account and session data">
        <p>
          Authentication is handled by Supabase Auth with email and password. AmpTrail stores a
          session cookie in your browser to keep you signed in and to authorise requests; signing out
          clears it.
        </p>
      </LegalSection>

      <LegalSection heading="5. Contact">
        <p>
          For questions about data privacy, account deletion or security reviews, use the{' '}
          <Link href="/contact" className="link">
            contact page
          </Link>
          .
        </p>
      </LegalSection>
    </LegalShell>
  );
}
