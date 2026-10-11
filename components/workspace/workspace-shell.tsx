'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderGit2,
  ReceiptText,
  Camera,
  Settings,
  Plus,
  Building2,
  ChevronRight,
  Menu,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Brand } from '@/components/brand';
import { cn, initials } from '@/lib/utils';
import { SignOutButton } from './sign-out-button';

type NavItem = { href: string; label: string; icon: LucideIcon; badge?: string };

const primaryNav: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderGit2 },
  { href: '/tickets', label: 'Work Tickets', icon: ReceiptText },
  { href: '/evidence', label: 'Evidence', icon: Camera },
];

function isActive(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getBreadcrumb(pathname: string) {
  if (pathname === '/dashboard') return [{ label: 'Overview', href: '/dashboard' }];
  if (pathname === '/projects') return [{ label: 'Projects', href: '/projects' }];
  if (pathname === '/projects/new') return [{ label: 'Projects', href: '/projects' }, { label: 'New Project', href: '/projects/new' }];
  if (pathname.startsWith('/projects/') && pathname.endsWith('/edit')) {
    return [{ label: 'Projects', href: '/projects' }, { label: 'Edit Project' }];
  }
  if (pathname.startsWith('/projects/')) return [{ label: 'Projects', href: '/projects' }, { label: 'Project Details' }];
  if (pathname === '/tickets') return [{ label: 'Work Tickets', href: '/tickets' }];
  if (pathname === '/tickets/new') return [{ label: 'Work Tickets', href: '/tickets' }, { label: 'New Ticket', href: '/tickets/new' }];
  if (pathname.startsWith('/tickets/') && pathname.endsWith('/edit')) {
    return [{ label: 'Work Tickets', href: '/tickets' }, { label: 'Edit Ticket' }];
  }
  if (pathname.startsWith('/tickets/')) return [{ label: 'Work Tickets', href: '/tickets' }, { label: 'Ticket Details' }];
  if (pathname === '/evidence') return [{ label: 'Evidence', href: '/evidence' }];
  if (pathname === '/settings') return [{ label: 'Settings', href: '/settings' }];
  return [{ label: 'Workspace', href: '/dashboard' }];
}

export function WorkspaceShell({
  children,
  email,
  fullName,
  companyName,
}: {
  children: React.ReactNode;
  email: string;
  fullName?: string | null;
  companyName: string;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const displayName = fullName || email;
  const breadcrumbs = getBreadcrumb(pathname);

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      {/* Desktop Sidebar */}
      <aside className="no-print sticky top-0 hidden h-screen flex-col border-r border-slate-200/90 bg-white lg:flex">
        {/* Brand & Workspace Switcher / Info */}
        <div className="border-b border-slate-100 p-5">
          <Brand href="/dashboard" />
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 py-2 text-xs">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-blue-600/10 text-blue-700">
              <Building2 size={15} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-slate-900">{companyName}</p>
              <p className="text-[10px] font-medium text-slate-500">Commercial Subcontractor</p>
            </div>
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="px-4 pt-4">
          <Link
            href="/tickets/new"
            className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-blue-700 active:bg-blue-800"
          >
            <Plus size={15} strokeWidth={2.5} />
            New Work Ticket
          </Link>
        </div>

        {/* Primary Nav */}
        <nav aria-label="Primary navigation" className="mt-4 flex-1 space-y-1 px-3">
          <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Workspace
          </p>
          {primaryNav.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group flex min-h-10 items-center justify-between rounded-xl px-3 text-sm font-semibold transition',
                  active
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                )}
              >
                <span className="flex items-center gap-3">
                  <Icon
                    size={18}
                    strokeWidth={active ? 2.4 : 2}
                    className={active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-700'}
                  />
                  <span>{item.label}</span>
                </span>
                {active && (
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600" aria-hidden="true" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section: Settings & User Profile */}
        <div className="border-t border-slate-100 p-3 space-y-1">
          <Link
            href="/settings"
            aria-current={pathname === '/settings' ? 'page' : undefined}
            className={cn(
              'group flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition',
              pathname === '/settings'
                ? 'bg-blue-50 text-blue-700 font-bold'
                : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
            )}
          >
            <Settings
              size={18}
              strokeWidth={pathname === '/settings' ? 2.4 : 2}
              className={pathname === '/settings' ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-700'}
            />
            <span>Settings</span>
          </Link>

          <div className="mt-2 rounded-xl border border-slate-200/70 bg-slate-50/70 p-2.5">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-900 text-xs font-bold text-white shadow-xs">
                {initials(displayName)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-900">{displayName}</p>
                <p className="truncate text-[11px] text-slate-500">{email}</p>
              </div>
            </div>
            <div className="mt-2 border-t border-slate-200/60 pt-2">
              <SignOutButton />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-col">
        {/* Top Header Bar */}
        <header className="no-print sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div className="hidden items-center gap-2 text-xs font-medium text-slate-500 lg:flex">
              <span className="font-semibold text-slate-900">{companyName}</span>
              {breadcrumbs.map((crumb, idx) => (
                <span key={idx} className="flex items-center gap-2">
                  <ChevronRight size={13} className="text-slate-400" />
                  {crumb.href && idx < breadcrumbs.length - 1 ? (
                    <Link href={crumb.href} className="hover:text-blue-600 transition">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="font-semibold text-slate-800">{crumb.label}</span>
                  )}
                </span>
              ))}
            </div>
            <div className="lg:hidden">
              <Brand compact href="/dashboard" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/tickets/new"
              className="hidden sm:inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:bg-blue-800 transition"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>New Ticket</span>
            </Link>
            <Link
              href="/evidence"
              className="hidden sm:inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
            >
              <Camera size={14} className="text-slate-500" />
              <span>Evidence</span>
            </Link>
            <Link
              href="/settings"
              className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
              aria-label="Settings"
            >
              <Settings size={18} />
            </Link>
            <div className="lg:hidden">
              <SignOutButton compact />
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="no-print border-b border-slate-200 bg-white px-4 py-3 shadow-md lg:hidden">
            <div className="mb-3 rounded-lg bg-slate-50 p-2.5 text-xs">
              <p className="font-bold text-slate-900">{companyName}</p>
              <p className="truncate text-slate-500">{email}</p>
            </div>
            <nav className="space-y-1">
              {primaryNav.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition',
                      active ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    <Icon size={18} className={active ? 'text-blue-600' : 'text-slate-400'} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <Link
                href="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Settings size={18} className="text-slate-400" />
                <span>Settings</span>
              </Link>
            </nav>
            <div className="mt-3 border-t border-slate-100 pt-3">
              <SignOutButton />
            </div>
          </div>
        )}

        {/* Content Body */}
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 pb-24 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pb-12">
          {children}
        </main>
      </div>

      {/* Mobile Fixed Bottom Nav */}
      <nav
        aria-label="Mobile bottom navigation"
        className="no-print fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-slate-200/90 bg-white/95 px-1 pb-[max(env(safe-area-inset-bottom),0.35rem)] pt-1.5 backdrop-blur-md lg:hidden"
      >
        {primaryNav.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-[50px] flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-bold transition',
                active ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              <Icon size={19} strokeWidth={active ? 2.5 : 2} />
              <span>{item.label === 'Work Tickets' ? 'Tickets' : item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
