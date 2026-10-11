'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Menu, X } from 'lucide-react';
import { Brand } from '@/components/brand';
import { ButtonLink } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '#workflow', label: 'How it works' },
  { href: '#product', label: 'Product' },
  { href: '#records', label: 'PDF records' },
  { href: '#roles', label: 'Field & office' },
  { href: '#faq', label: 'FAQ' },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  // Lock the page behind the sheet and let Escape close it.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    if (!open) return () => { document.body.style.overflow = ''; };

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Brand />

        <nav aria-label="Marketing" className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-[13.5px] font-medium text-body transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-[13.5px] font-semibold text-body transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
          >
            Log in
          </Link>
          <ButtonLink href="/signup" size="sm">
            Create workspace
            <ArrowRight size={14} aria-hidden="true" />
          </ButtonLink>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="grid h-10 w-10 place-items-center rounded-lg text-body transition-colors duration-150 hover:bg-surface-2 hover:text-ink lg:hidden"
          aria-label="Open menu"
          aria-expanded={open}
        >
          <Menu size={20} aria-hidden="true" />
        </button>
      </div>

      {/* Mobile sheet */}
      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden',
          open ? 'pointer-events-auto' : 'pointer-events-none'
        )}
        aria-hidden={!open}
        // Keeps the closed sheet out of the tab order without unmounting it.
        inert={!open}
      >
        <div
          className={cn(
            'absolute inset-0 bg-ink/45 backdrop-blur-[2px] transition-opacity duration-200',
            open ? 'opacity-100' : 'opacity-0'
          )}
          onClick={() => setOpen(false)}
        />
        <div
          className={cn(
            'absolute inset-x-0 top-0 rounded-b-2xl border-b border-line bg-surface shadow-lg transition-transform duration-250',
            open ? 'translate-y-0' : '-translate-y-full'
          )}
        >
          <div className="flex h-16 items-center justify-between px-4">
            <Brand />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid h-10 w-10 place-items-center rounded-lg text-body transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
              aria-label="Close menu"
            >
              <X size={19} aria-hidden="true" />
            </button>
          </div>

          <nav aria-label="Marketing" className="px-3 pb-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex min-h-12 items-center rounded-lg px-3 text-[15px] font-medium text-body transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="grid gap-2 border-t border-line p-4">
            <ButtonLink
              href="/signup"
              size="lg"
              onClick={() => setOpen(false)}
              className="w-full"
            >
              Create workspace
            </ButtonLink>
            <ButtonLink
              href="/login"
              variant="secondary"
              size="lg"
              onClick={() => setOpen(false)}
              className="w-full"
            >
              Log in
            </ButtonLink>
            <p className="pt-1 text-center text-[12px] text-muted">
              Free to start · No credit card required
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
