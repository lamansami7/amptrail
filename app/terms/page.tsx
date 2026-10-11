import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Brand } from '@/components/brand';

export const metadata: Metadata = { title: 'Terms of Service' };

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between">
          <Brand />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
          >
            <ArrowLeft size={14} /> Back to site
          </Link>
        </header>

        <article className="card mt-10 p-6 sm:p-10">
          <p className="eyebrow">Legal & Operational Terms</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Terms of Service
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Last updated: October 11, 2026 · Field Operations Template
          </p>

          <div className="mt-8 space-y-6 text-xs sm:text-sm leading-relaxed text-slate-600">
            <section>
              <h2 className="text-sm font-bold text-slate-900">1. Nature of the Service</h2>
              <p className="mt-1.5">
                AmpTrail provides software tools designed to help commercial electrical subcontractors record out-of-scope work, crew labor hours, materials, and jobsite photo evidence. AmpTrail is a field documentation and tracking system. It is not an engineering design tool, an arbitration service, an invoice factoring platform, or a substitute for formal construction contract administration.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-bold text-slate-900">2. Customer Approvals & Invoicing</h2>
              <p className="mt-1.5">
                Work ticket tracking statuses (including &ldquo;Approved&rdquo; or &ldquo;Invoiced&rdquo;) are internal administrative labels assigned by your team. They do not constitute verified contractual acceptance, change order entitlement, or guaranteed invoice payment by general contractors or property owners.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-bold text-slate-900">3. User Responsibility & Jobsite Photos</h2>
              <p className="mt-1.5">
                You are responsible for ensuring that your personnel have appropriate authorization to photograph jobsite conditions, record crew members, and upload documentation. You retain full ownership of all proprietary data, images, and work tickets stored in your company workspace.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-bold text-slate-900">4. Multi-Tenant Security</h2>
              <p className="mt-1.5">
                AmpTrail isolates workspace data in PostgreSQL using Row-Level Security (RLS). You are responsible for safeguarding your login credentials and ensuring authorized access within your organization.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-bold text-slate-900">5. Contact & Inquiries</h2>
              <p className="mt-1.5">
                For questions regarding terms or enterprise workspace provisioning, please visit our{' '}
                <Link href="/contact" className="font-semibold text-blue-600 hover:underline">
                  Contact Page
                </Link>
                .
              </p>
            </section>
          </div>
        </article>
      </div>
    </main>
  );
}
