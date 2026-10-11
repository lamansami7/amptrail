import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalSection, LegalShell } from '@/components/marketing/legal-shell';

export const metadata: Metadata = { title: 'Terms' };

export default function TermsPage() {
  return (
    <LegalShell
      eyebrow="Operating terms"
      title="Terms of service"
      updated="October 11, 2026"
      aside={
        <div className="rounded-xl border border-line bg-surface-2/70 p-5 text-[12.5px] leading-5 text-muted">
          <p className="font-semibold text-body">Deployment template</p>
          <p className="mt-1.5">
            This page describes how this build behaves. Review it with your own counsel before
            publishing it as your terms of service.
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
      <LegalSection heading="1. Nature of the service">
        <p>
          AmpTrail is software for commercial electrical subcontractors to record out-of-scope work,
          crew labor hours, materials and jobsite photo evidence, and to export a formatted work
          record. It is a documentation and tracking tool — not an engineering design tool, not an
          arbitration service, and not a substitute for formal construction contract administration.
        </p>
      </LegalSection>

      <LegalSection heading="2. Tracking statuses and totals">
        <p>
          Ticket statuses such as “Approved” or “Invoiced” are internal workflow labels your team
          assigns. Documented totals are calculated from the entries your team records. Neither
          constitutes verified contractual acceptance, change order entitlement, or guaranteed
          payment from a general contractor or owner.
        </p>
      </LegalSection>

      <LegalSection heading="3. Your responsibilities">
        <p>
          You are responsible for ensuring your personnel are authorised to photograph jobsite
          conditions and upload documentation, and for the accuracy of what your team records. You
          keep ownership of the data your workspace stores.
        </p>
      </LegalSection>

      <LegalSection heading="4. Security and access">
        <p>
          AmpTrail isolates workspace data in PostgreSQL using row-level security and keeps evidence
          in a private storage bucket. You are responsible for safeguarding login credentials and for
          who is granted access to your company workspace.
        </p>
      </LegalSection>

      <LegalSection heading="5. Availability">
        <p>
          AmpTrail is provided as-is. Deployments may be interrupted by hosting, database or network
          failures outside its control. Keep independent copies of records that matter to your
          business by using the PDF export or print options.
        </p>
      </LegalSection>

      <LegalSection heading="6. Contact">
        <p>
          For questions about these terms or workspace provisioning, use the{' '}
          <Link href="/contact" className="link">
            contact page
          </Link>
          .
        </p>
      </LegalSection>
    </LegalShell>
  );
}
