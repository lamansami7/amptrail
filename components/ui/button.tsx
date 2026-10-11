import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'soft'
  | 'ghost'
  | 'danger'
  | 'dangerSoft'
  | 'inverse';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 text-white shadow-xs hover:bg-brand-700 active:bg-brand-800 disabled:bg-brand-600',
  secondary:
    'border border-line-strong bg-surface text-ink-soft shadow-xs hover:bg-surface-2 hover:text-ink active:bg-surface-3',
  soft: 'bg-brand-50 text-brand-800 hover:bg-brand-100 active:bg-brand-200/70',
  ghost: 'text-body hover:bg-surface-3 hover:text-ink active:bg-line',
  danger: 'bg-danger text-white shadow-xs hover:bg-rose-800 active:bg-rose-900',
  dangerSoft: 'border border-danger-line bg-danger-soft text-danger hover:bg-rose-100',
  inverse: 'bg-ink text-white shadow-xs hover:bg-ink-soft active:bg-black',
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'min-h-7 gap-1.5 rounded-md px-2 text-xs font-semibold',
  sm: 'min-h-8 gap-1.5 rounded-lg px-2.5 text-[13px] font-semibold',
  md: 'min-h-10 gap-2 rounded-lg px-3.5 text-sm font-semibold',
  lg: 'min-h-11 gap-2 rounded-xl px-5 text-[0.9375rem] font-semibold',
};

const iconOnlySize: Record<ButtonSize, string> = {
  xs: 'h-7 w-7 rounded-md',
  sm: 'h-8 w-8 rounded-lg',
  md: 'h-10 w-10 rounded-lg',
  lg: 'h-11 w-11 rounded-xl',
};

const base =
  'relative inline-flex select-none items-center justify-center whitespace-nowrap align-middle transition-[background-color,color,border-color,box-shadow,transform] duration-150 ease-out disabled:pointer-events-none disabled:opacity-55 [&_svg]:shrink-0 active:translate-y-px';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  iconOnly?: boolean;
  ref?: Ref<HTMLButtonElement>;
  children: ReactNode;
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  iconOnly = false,
  className,
  children,
  disabled,
  type = 'button',
  ref,
  ...props
}: ButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        base,
        iconOnly ? iconOnlySize[size] : sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {loading && (
        <LoaderCircle
          size={size === 'lg' ? 16 : 14}
          className="animate-spin"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  iconOnly = false,
  className,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconOnly?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        base,
        iconOnly ? iconOnlySize[size] : sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
