import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * AmpTrail mark: an electric bolt inside a rounded field, paired with a
 * tight, confident wordmark. The mark alone is used in compact contexts.
 */
export function BrandMark({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const box = size === 'sm' ? 'h-7 w-7 rounded-[0.5rem]' : size === 'lg' ? 'h-10 w-10 rounded-xl' : 'h-8 w-8 rounded-[0.625rem]';
  const glyph = size === 'sm' ? 14 : size === 'lg' ? 21 : 17;

  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center bg-brand-600 text-white shadow-[0_1px_2px_rgb(11_18_32/0.25),inset_0_1px_0_rgb(255_255_255/0.18)]',
        box,
        className
      )}
      aria-hidden="true"
    >
      <svg width={glyph} height={glyph} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M13.6 2.2a.75.75 0 0 1 .72.95l-1.4 5.1h4.2a.75.75 0 0 1 .57 1.24l-8.6 10.4a.75.75 0 0 1-1.31-.7l1.5-5.44H5.1a.75.75 0 0 1-.57-1.24l8.5-10.2a.75.75 0 0 1 .57-.3Z" />
      </svg>
    </span>
  );
}

export function Brand({
  href = '/',
  size = 'md',
  inverted = false,
  compact = false,
  className,
}: {
  href?: string;
  size?: 'sm' | 'md' | 'lg';
  inverted?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const text = size === 'sm' ? 'text-[15px]' : size === 'lg' ? 'text-[19px]' : 'text-[17px]';

  return (
    <Link
      href={href}
      aria-label="AmpTrail home"
      className={cn(
        'group inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none',
        className
      )}
    >
      <BrandMark size={size} className="transition-transform duration-200 group-hover:scale-[1.04]" />
      {!compact && (
        <span className={cn('flex items-baseline font-semibold tracking-[-0.028em]', text)}>
          <span className={inverted ? 'text-white' : 'text-ink'}>Amp</span>
          <span className={inverted ? 'text-brand-300' : 'text-brand-600'}>Trail</span>
        </span>
      )}
    </Link>
  );
}
