import Link from 'next/link';
import { cn } from '@/lib/utils';

type BrandSize = 'sm' | 'md' | 'lg';

const markSizes: Record<BrandSize, string> = {
  sm: 'h-7 w-7',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
};

const wordmarkSizes: Record<BrandSize, string> = {
  sm: 'text-[15px]',
  md: 'text-[17px]',
  lg: 'text-[20px]',
};

/**
 * AmpTrail's monogram: a custom-built capital A with a lightning cut running
 * through its counter and crossbar. The blue A stays consistent on both
 * surfaces; only the bolt changes for contrast.
 */
export function BrandMark({
  className,
  size = 'md',
  inverted = false,
}: {
  className?: string;
  size?: BrandSize;
  inverted?: boolean;
}) {
  return (
    <svg
      className={cn('block shrink-0', markSizes[size], className)}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M20.21 5.08c1.49-3.1 6.09-3.1 7.58 0L47.36 45.4H35.75l-3.89-8.2H16.14l-3.89 8.2H.64L20.21 5.08Zm3.79 10.27-5.6 12.8h11.2L24 15.35Z"
        fill={inverted ? '#4385FF' : '#2563EB'}
        fillRule="evenodd"
        clipRule="evenodd"
      />
      <path
        d="m25.1 17.2-5.65 9.7h4.4l-1.7 7.9 7.55-11.2H25.4l2.15-6.4H25.1Z"
        fill={inverted ? '#FFFFFF' : '#0D1B35'}
      />
    </svg>
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
  size?: BrandSize;
  inverted?: boolean;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label="AmpTrail home"
      className={cn(
        'group inline-flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-none',
        className
      )}
    >
      <BrandMark
        size={size}
        inverted={inverted}
        className="transition-transform duration-200 group-hover:scale-[1.035]"
      />
      {!compact && (
        <span
          aria-hidden="true"
          className={cn(
            'inline-flex items-center font-semibold leading-none tracking-[-0.045em]',
            wordmarkSizes[size]
          )}
        >
          <span className={inverted ? 'text-white' : 'text-ink'}>Amp</span>
          <span className={inverted ? 'text-[#6FA0FF]' : 'text-brand-600'}>Trail</span>
        </span>
      )}
    </Link>
  );
}
