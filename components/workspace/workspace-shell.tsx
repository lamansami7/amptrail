'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, BriefcaseBusiness, ClipboardList, Images, Settings, type LucideIcon } from 'lucide-react';
import { Brand } from '@/components/brand';
import { cn, initials } from '@/lib/utils';
import { SignOutButton } from './sign-out-button';

type NavItem = { href: string; label: string; icon: LucideIcon };
const primaryNav: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: Activity },
  { href: '/projects', label: 'Projects', icon: BriefcaseBusiness },
  { href: '/tickets', label: 'Work tickets', icon: ClipboardList },
  { href: '/evidence', label: 'Evidence', icon: Images },
];

function isActive(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function WorkspaceShell({ children, email, fullName, companyName }: { children: React.ReactNode; email: string; fullName?: string | null; companyName: string }) {
  const pathname = usePathname();
  const displayName = fullName || email;
  return (
    <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="no-print sticky top-0 hidden h-screen flex-col border-r border-line bg-white px-4 py-5 lg:flex">
        <div className="px-2"><Brand /></div>
        <div className="mt-8 rounded-xl bg-canvas px-3 py-3">
          <p className="truncate text-sm font-bold text-ink">{companyName}</p>
          <p className="mt-0.5 text-xs text-muted">Field workspace</p>
        </div>
        <nav aria-label="Main navigation" className="mt-6 space-y-1">
          {primaryNav.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={cn('flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition', active ? 'bg-orange/10 text-orange-dark' : 'text-slate-600 hover:bg-slate-50 hover:text-ink')}><Icon size={18} strokeWidth={active ? 2.4 : 1.9} />{item.label}</Link>;
          })}
        </nav>
        <div className="mt-auto border-t border-line pt-4">
          <Link href="/settings" aria-current={pathname === '/settings' ? 'page' : undefined} className={cn('flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition', pathname === '/settings' ? 'bg-orange/10 text-orange-dark' : 'text-slate-600 hover:bg-slate-50 hover:text-ink')}>
            <Settings size={18} /> Settings
          </Link>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-canvas p-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-navy text-xs font-bold text-white">{initials(displayName)}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-bold text-ink">{displayName}</span>
              <span className="block truncate text-[11px] text-muted">{email}</span>
            </span>
          </div>
          <div className="mt-2"><SignOutButton /></div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="no-print sticky top-0 z-30 flex h-[66px] items-center justify-between border-b border-line bg-white/95 px-4 backdrop-blur-sm sm:px-6 lg:hidden">
          <Brand />
          <div className="flex items-center gap-1">
            <Link href="/settings" className="grid h-10 w-10 place-items-center rounded-xl text-muted hover:bg-slate-100" aria-label="Settings"><Settings size={19} /></Link>
            <SignOutButton compact />
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1440px] px-4 pb-28 pt-6 sm:px-6 sm:pt-8 lg:px-10 lg:pb-12">
          {children}
        </main>
      </div>

      <nav aria-label="Mobile navigation" className="no-print fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line bg-white/95 px-1 pb-[max(env(safe-area-inset-bottom),0.35rem)] pt-2 backdrop-blur-sm lg:hidden">
        {primaryNav.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={cn('flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-bold', active ? 'text-orange-dark' : 'text-slate-500')}><Icon size={19} strokeWidth={active ? 2.5 : 1.9} />{item.label === 'Work tickets' ? 'Tickets' : item.label}</Link>;
        })}
      </nav>
    </div>
  );
}
