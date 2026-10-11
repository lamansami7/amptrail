import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'quiet' | 'danger' | 'dark';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary: 'bg-blue-600 text-white shadow-sm shadow-blue-600/10 hover:bg-blue-700 active:bg-blue-800 focus-visible:ring-blue-600/30',
  secondary: 'border border-slate-200 bg-white text-slate-800 shadow-xs hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100 focus-visible:ring-slate-300',
  quiet: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-200',
  danger: 'bg-rose-600 text-white shadow-sm hover:bg-rose-700 active:bg-rose-800 focus-visible:ring-rose-300',
  dark: 'bg-slate-900 text-white shadow-sm hover:bg-slate-800 active:bg-slate-950 focus-visible:ring-slate-400',
};

const sizes: Record<Size, string> = {
  sm: 'min-h-9 px-3 py-1.5 text-xs font-semibold rounded-lg',
  md: 'min-h-10 px-4 py-2 text-sm font-semibold rounded-xl',
  lg: 'min-h-12 px-5 py-3 text-[15px] font-bold rounded-xl',
};

const base = 'inline-flex items-center justify-center gap-2 transition duration-150 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-50';

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}) {
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </Link>
  );
}
