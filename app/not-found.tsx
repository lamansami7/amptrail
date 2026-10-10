import Link from 'next/link';
import { ArrowLeft, Home, SearchX } from 'lucide-react';
import { Brand } from '@/components/brand';
import { ButtonLink } from '@/components/ui/button';

export default function NotFound() {
  return <main className="grid min-h-screen place-items-center bg-canvas px-4 py-10"><div className="w-full max-w-xl text-center"><div className="mb-10 flex justify-center"><Brand /></div><span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white text-orange shadow-card"><SearchX size={28} /></span><p className="eyebrow mt-6">404 · Trail not found</p><h1 className="mt-2 text-3xl font-extrabold tracking-[-0.05em] text-ink">This page is off the map.</h1><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted">The link may have changed, or the record may no longer be available in this workspace.</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><ButtonLink href="/" variant="secondary"><Home size={16} />Go to homepage</ButtonLink><ButtonLink href="/dashboard"><ArrowLeft size={16} />Back to workspace</ButtonLink></div><Link href="/contact" className="mt-6 inline-block text-xs font-semibold text-muted underline underline-offset-4 hover:text-ink">Need help? Contact us</Link></div></main>;
}
