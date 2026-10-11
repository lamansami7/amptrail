import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Mail, MessageCircle } from 'lucide-react';
import { Brand } from '@/components/brand';
import { ButtonLink } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Contact Support' };

export default function ContactPage() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();

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

        <section className="card mt-10 p-6 sm:p-10">
          <p className="eyebrow">Direct Assistance</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Contact AmpTrail Support
          </h1>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-500">
            Have questions regarding deployment configuration, jobsite workflows, or company workspace administration? We are here to assist your team.
          </p>

          <div className="mt-8">
            {supportEmail ? (
              <a
                href={`mailto:${supportEmail}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
              >
                <Mail size={16} />
                <span>Email {supportEmail}</span>
              </a>
            ) : (
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900">
                <MessageCircle size={18} className="mt-0.5 shrink-0 text-amber-700" />
                <div>
                  <p className="font-bold">Support Email Not Specified</p>
                  <p className="mt-1 text-slate-600">
                    To publish a direct support channel, configure the <code className="rounded bg-white px-1 py-0.5 font-mono">NEXT_PUBLIC_SUPPORT_EMAIL</code> variable in your hosting environment.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-100 pt-6">
            <ButtonLink href="/signup">
              Create Free Workspace
            </ButtonLink>
            <ButtonLink href="/login" variant="secondary">
              Existing Member Sign In
            </ButtonLink>
          </div>
        </section>
      </div>
    </main>
  );
}
