'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Brand } from '@/components/brand';
import { ButtonLink } from '@/components/ui/button';

const navLinks = [
  { href: '#the-problem', label: 'The Problem' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#features', label: 'Features' },
  { href: '#foremen-owners', label: 'Foremen & Owners' },
  { href: '#pdf-records', label: 'PDF Records' },
  { href: '#faq', label: 'FAQ' },
];

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Brand />

        {/* Desktop Links */}
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Marketing navigation">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-blue-600 transition"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="hidden items-center gap-3 sm:flex">
          <Link
            href="/login"
            className="px-3 py-2 text-xs font-bold text-slate-700 hover:text-blue-600 transition"
          >
            Log In
          </Link>
          <ButtonLink href="/signup" size="sm" className="shadow-xs">
            Get Started
            <ArrowRight size={13} />
          </ButtonLink>
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 shadow-lg lg:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Log In
              </Link>
              <ButtonLink
                href="/signup"
                onClick={() => setMobileOpen(false)}
                size="sm"
              >
                Get Started
              </ButtonLink>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
