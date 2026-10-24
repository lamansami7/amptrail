'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Menu, X } from 'lucide-react';
import { Brand } from '@/components/brand';
import { ButtonLink } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#demo', label: 'Demo' },
  { href: '/#features', label: 'Features' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/#faq', label: 'FAQ' },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Keep focus inside the open navigation and restore it on close.
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = sheetRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      menuButtonRef.current?.focus();
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

        <div className="hidden items-center gap-2 lg:flex">
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
          ref={menuButtonRef}
          type="button"
          onClick={() => setOpen(true)}
          className="grid h-10 w-10 place-items-center rounded-lg text-body transition-colors duration-150 hover:bg-surface-2 hover:text-ink lg:hidden"
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="marketing-mobile-navigation"
        >
          <Menu size={20} aria-hidden="true" />
        </button>
      </div>

      {/* Mobile sheet */}
      <div
        id="marketing-mobile-navigation"
        ref={sheetRef}
        className={cn(
          'fixed inset-0 z-50 lg:hidden',
          open ? 'pointer-events-auto' : 'pointer-events-none'
        )}
        role="dialog"
        aria-modal={open ? true : undefined}
        aria-label="Mobile navigation"
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
            'absolute inset-x-0 top-0 rounded-b-2xl border-b border-line bg-surface transition-[transform,box-shadow] duration-250',
            open ? 'translate-y-0 shadow-lg' : '-translate-y-full shadow-none'
          )}
        >
          <div className="flex h-16 items-center justify-between px-4">
            <Brand />
            <button
              ref={closeButtonRef}
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
              No credit card required
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
