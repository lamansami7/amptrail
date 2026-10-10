import type { ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="text-[28px] font-extrabold tracking-[-0.045em] text-ink sm:text-[34px]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-[15px]">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function SectionHeading({ title, action }: { title: string; action?: ReactNode }) {
  return <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-base font-bold tracking-tight text-ink">{title}</h2>{action}</div>;
}

export function DataSetupMessage({ message = 'We could not load this workspace data. Check that the AmpTrail migration has been applied and your session is current.' }: { message?: string }) {
  return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950"><p className="font-bold">Workspace data is not ready</p><p className="mt-1">{message} If this keeps happening, ask your Supabase project administrator to review the setup guide.</p></div>;
}

export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action?: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-11 text-center sm:px-8">
    <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-orange/10 text-orange">{icon}</span>
    <h2 className="mt-4 text-lg font-bold text-ink">{title}</h2>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{description}</p>
    {action && <div className="mt-5 flex justify-center">{action}</div>}
  </div>;
}

export function SmallLink({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} className="inline-flex items-center gap-1 text-sm font-bold text-orange-dark hover:underline">{children}<ArrowUpRight size={14} /></a>;
}
