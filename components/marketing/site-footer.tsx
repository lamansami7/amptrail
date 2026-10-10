import Link from 'next/link';
import { Brand } from '@/components/brand';

export function SiteFooter() {
  return <footer className="border-t border-line bg-white">
    <div className="mx-auto grid max-w-7xl gap-9 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8 lg:py-14">
      <div><Brand /><p className="mt-4 max-w-sm text-sm leading-6 text-muted">A practical field record for electrical subcontractors working beyond the original scope.</p></div>
      <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Explore</p><div className="mt-3 grid gap-2 text-sm font-medium text-ink"><a href="/#features" className="hover:text-orange-dark">Features</a><a href="/#how-it-works" className="hover:text-orange-dark">How it works</a><a href="/#pricing" className="hover:text-orange-dark">Pricing</a></div></div>
      <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Company</p><div className="mt-3 grid gap-2 text-sm font-medium text-ink"><Link href="/privacy" className="hover:text-orange-dark">Privacy</Link><Link href="/terms" className="hover:text-orange-dark">Terms</Link><Link href="/contact" className="hover:text-orange-dark">Contact</Link><Link href="/login" className="hover:text-orange-dark">Log in</Link></div></div>
    </div>
    <div className="border-t border-line"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><span>© {new Date().getFullYear()} AmpTrail</span><span>Work records support clear conversations; they do not guarantee approval or payment.</span></div></div>
  </footer>;
}
