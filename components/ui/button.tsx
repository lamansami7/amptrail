import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'quiet' | 'danger';
const variants: Record<Variant, string> = {
  primary: 'bg-orange text-white shadow-sm hover:bg-orange-dark focus-visible:ring-orange/30',
  secondary: 'border border-line bg-white text-ink hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-slate-300',
  quiet: 'bg-transparent text-muted hover:bg-slate-100 hover:text-ink focus-visible:ring-slate-300',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-300',
};
const base = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-50';

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; children: ReactNode }) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props}>{children}</button>;
}

export function ButtonLink({ href, variant = 'primary', className = '', children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; variant?: Variant; children: ReactNode }) {
  return <Link href={href} className={`${base} ${variants[variant]} ${className}`} {...props}>{children}</Link>;
}
