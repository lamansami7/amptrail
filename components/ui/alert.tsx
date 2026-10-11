import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';

const tones: Record<
  AlertTone,
  { wrap: string; icon: string; title: string; Icon: typeof Info }
> = {
  info: {
    wrap: 'border-info-line bg-brand-50/70',
    icon: 'text-brand-700',
    title: 'text-brand-900',
    Icon: Info,
  },
  success: {
    wrap: 'border-success-line bg-success-soft',
    icon: 'text-success',
    title: 'text-emerald-900',
    Icon: CheckCircle2,
  },
  warning: {
    wrap: 'border-warning-line bg-warning-soft',
    icon: 'text-warning',
    title: 'text-amber-900',
    Icon: AlertTriangle,
  },
  danger: {
    wrap: 'border-danger-line bg-danger-soft',
    icon: 'text-danger',
    title: 'text-rose-900',
    Icon: ShieldAlert,
  },
};

export function Alert({
  tone = 'info',
  title,
  children,
  className,
  action,
  role,
}: {
  tone?: AlertTone;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
  action?: ReactNode;
  role?: 'alert' | 'status';
}) {
  const config = tones[tone];
  const { Icon } = config;

  return (
    <div
      role={role}
      className={cn('flex items-start gap-3 rounded-xl border px-4 py-3', config.wrap, className)}
    >
      <Icon size={17} className={cn('mt-0.5 shrink-0', config.icon)} aria-hidden="true" />
      <div className="min-w-0 flex-1 text-[13px] leading-5">
        {title && <p className={cn('font-semibold', config.title)}>{title}</p>}
        {children && <div className={cn('text-body', title ? 'mt-0.5' : undefined)}>{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
