import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Brand } from '@/components/brand';

export const metadata: Metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
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
          <p className="eyebrow">Data Protection & Confidentiality</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Privacy Policy
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Last updated: October 11, 2026 · Field Operations Template
          </p>

          <div className="mt-8 space-y-6 text-xs sm:text-sm leading-relaxed text-slate-600">
            <section>
              <h2 className="text-sm font-bold text-slate-900">1. Data Storage & Ownership</h2>
              <p className="mt-1.5">
                When you create an account, AmpTrail securely stores your profile, company details, commercial projects, work tickets, and uploaded jobsite photographs. You maintain exclusive proprietary ownership of all uploaded content and business records.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-bold text-slate-900">2. Private Evidence Handling</h2>
              <p className="mt-1.5">
                Jobsite photographs are stored in private Supabase Storage buckets. Access to image files requires cryptographic signed URLs that expire after 1 hour. Photos are never exposed to public search engines or unauthenticated third parties.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-bold text-slate-900">3. Workspace Data Isolation</h2>
              <p className="mt-1.5">
                Every database table is protected by PostgreSQL Row-Level Security (RLS) policies. Only authenticated members of your company can view your projects, tickets, or evidence files.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-bold text-slate-900">4. Contact Information</h2>
              <p className="mt-1.5">
                For questions about data privacy, account deletion, or security audits, please review our{' '}
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
