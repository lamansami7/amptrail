import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  meta,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  meta?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8',
        className
      )}
    >
      <div className="min-w-0 max-w-3xl">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="h1">{title}</h1>
        {description && (
          <p className="mt-1.5 text-[0.9375rem] leading-6 text-muted">{description}</p>
        )}
        {meta && <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">{meta}</div>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
    </header>
  );
}

export function SectionHeader({
  title,
  description,
  action,
  className,
  id,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <h2 id={id} className="h3">
          {title}
        </h2>
        {description && <p className="mt-0.5 text-[13px] leading-5 text-muted">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

/** Small inline link with a trailing chevron, used for "view all" affordances. */
export function TextLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a href={href} className={cn('link inline-flex items-center gap-1 text-[13px]', className)}>
      {children}
    </a>
  );
}
