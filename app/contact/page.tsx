import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Mail, MessageCircle } from 'lucide-react';
import { Brand } from '@/components/brand';
import { ButtonLink } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Contact' };

export default function ContactPage() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();
  return <main className="min-h-screen bg-canvas px-4 py-7 sm:px-6 lg:px-8"><div className="mx-auto max-w-3xl"><header className="flex items-center justify-between"><Brand /><Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft size={15} />Home</Link></header><section className="mt-10 rounded-2xl border border-line bg-white p-6 shadow-card sm:p-10"><p className="eyebrow">Contact AmpTrail</p><h1 className="mt-2 text-3xl font-extrabold tracking-[-0.05em] text-ink">We&apos;re here to listen.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted">Questions about the product or this deployment? Use the configured support contact below. If the address is not yet configured, the deployment owner should set it before launch.</p>
    {supportEmail ? <a href={`mailto:${supportEmail}`} className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-orange px-5 text-sm font-bold text-white hover:bg-orange-dark"><Mail size={17} />Email {supportEmail}</a> : <div className="mt-7 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"><MessageCircle size={18} className="mt-0.5 text-amber-700" /><div><p className="text-sm font-bold text-ink">Support email not configured</p><p className="mt-1 text-xs leading-5 text-muted">Set <code className="rounded bg-white px-1">NEXT_PUBLIC_SUPPORT_EMAIL</code> in the Vercel environment to publish a real support link.</p></div></div>}
    <div className="mt-8 flex flex-wrap gap-3"><ButtonLink href="/signup" variant="secondary">Create account</ButtonLink><ButtonLink href="/login" variant="quiet">Log in</ButtonLink></div></section><p className="mt-5 text-xs leading-5 text-muted">Do not send sensitive customer photos or jobsite records to a public support channel.</p></div></main>;
}
