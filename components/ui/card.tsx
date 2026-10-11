import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Card({
  as: Tag = 'section',
  className,
  children,
  flush = false,
  ...rest
}: {
  as?: 'section' | 'div' | 'article' | 'aside';
  className?: string;
  children: ReactNode;
  flush?: boolean;
} & Record<string, unknown>) {
  return (
    <Tag className={cn(flush ? 'card-flush' : 'card', className)} {...rest}>
      {children}
    </Tag>
  );
}

export function CardHeader({
  title,
  description,
  action,
  icon,
  className,
  bordered = false,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
  bordered?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-3 px-5 py-4 sm:px-6',
        bordered && 'border-b border-line',
        className
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-3 text-body">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="h3">{title}</h2>
          {description && <p className="mt-0.5 text-[13px] leading-5 text-muted">{description}</p>}
        </div>
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('px-5 py-4 sm:px-6', className)}>{children}</div>;
}

export function CardFooter({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface-2/60 px-5 py-3.5 sm:px-6',
        className
      )}
    >
      {children}
    </div>
  );
}
