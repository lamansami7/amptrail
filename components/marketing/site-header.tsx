'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Brand } from '@/components/brand';
import { ButtonLink } from '@/components/ui/button';

const links = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return <header className="sticky top-0 z-50 border-b border-line/80 bg-canvas/95 backdrop-blur">
    <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
      <Brand />
      <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
        {links.map((link) => <a key={link.href} href={link.href} className="text-sm font-semibold text-slate-600 transition hover:text-ink">{link.label}</a>)}
      </nav>
      <div className="hidden items-center gap-3 md:flex">
        <Link href="/login" className="px-3 py-2 text-sm font-bold text-ink hover:text-orange-dark">Log in</Link>
        <ButtonLink href="/signup" className="min-h-10 px-4">Get started</ButtonLink>
      </div>
      <button type="button" onClick={() => setOpen(!open)} className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-white text-ink md:hidden" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
        {open ? <X size={19} /> : <Menu size={19} />}
      </button>
    </div>
    {open && <div className="border-t border-line bg-white px-4 py-4 md:hidden">
      <nav className="mx-auto flex max-w-7xl flex-col gap-1" aria-label="Mobile navigation">
        {links.map((link) => <a key={link.href} href={link.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm font-semibold text-ink hover:bg-canvas">{link.label}</a>)}
        <div className="mt-2 grid grid-cols-2 gap-2 border-t border-line pt-3">
          <Link href="/login" onClick={() => setOpen(false)} className="rounded-xl border border-line py-3 text-center text-sm font-bold">Log in</Link>
          <ButtonLink href="/signup" onClick={() => setOpen(false)} className="min-h-[46px]">Get started</ButtonLink>
        </div>
      </nav>
    </div>}
  </header>;
}
