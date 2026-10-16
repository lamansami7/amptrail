'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronRight,
  CircleHelp,
  FolderKanban,
  History,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  Plus,
  ReceiptText,
  Settings as SettingsIcon,
  ShieldCheck,
  Camera,
  UserRound,
  UsersRound,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Brand, BrandMark } from '@/components/brand';
import { cn, initials } from '@/lib/utils';
import { Menu } from '@/components/ui/menu';
import { useSignOut } from './sign-out-button';

type NavItem = { href: string; label: string; icon: LucideIcon; shortLabel?: string; badge?: string };

const primaryNav: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/tickets', label: 'Work tickets', icon: ReceiptText, shortLabel: 'Tickets' },
  { href: '/evidence', label: 'Evidence', icon: Camera },
];

const secondaryNav: NavItem[] = [
  { href: '/inbox', label: 'Inbox', icon: Inbox, badge: 'Soon' },
  { href: '/activity', label: 'Activity', icon: History },
  { href: '/team', label: 'Team', icon: UsersRound },
];

function isActive(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getBreadcrumbs(pathname: string): Array<{ label: string; href?: string }> {
  if (pathname === '/dashboard') return [{ label: 'Overview' }];
  if (pathname === '/settings') return [{ label: 'Settings' }];
  if (pathname === '/evidence') return [{ label: 'Evidence' }];
  if (pathname === '/inbox') return [{ label: 'Inbox' }];
  if (pathname === '/activity') return [{ label: 'Activity' }];
  if (pathname === '/team') return [{ label: 'Team' }];
  if (pathname === '/projects') return [{ label: 'Projects' }];
  if (pathname === '/projects/new') return [{ label: 'Projects', href: '/projects' }, { label: 'New project' }];
  if (pathname.startsWith('/projects/') && pathname.endsWith('/edit')) {
    return [{ label: 'Projects', href: '/projects' }, { label: 'Edit project' }];
  }
  if (pathname.startsWith('/projects/')) {
    return [{ label: 'Projects', href: '/projects' }, { label: 'Project' }];
  }
  if (pathname === '/tickets') return [{ label: 'Work tickets' }];
  if (pathname === '/tickets/new') return [{ label: 'Work tickets', href: '/tickets' }, { label: 'New ticket' }];
  if (pathname.startsWith('/tickets/') && pathname.endsWith('/edit')) {
    return [{ label: 'Work tickets', href: '/tickets' }, { label: 'Edit ticket' }];
  }
  if (pathname.startsWith('/tickets/')) {
    return [{ label: 'Work tickets', href: '/tickets' }, { label: 'Ticket record' }];
  }
  return [{ label: 'Workspace', href: '/dashboard' }];
}

function Avatar({
  name,
  className,
  tone = 'dark',
}: {
  name: string;
  className?: string;
  tone?: 'dark' | 'light';
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid shrink-0 place-items-center rounded-lg text-[11px] font-semibold tracking-tight',
        tone === 'dark' ? 'bg-ink text-white' : 'bg-brand-50 text-brand-800',
        className
      )}
    >
      {initials(name)}
    </span>
  );
}

function AccountMenu({
  email,
  displayName,
  align = 'end',
  side = 'bottom',
  compact = false,
}: {
  email: string;
  displayName: string;
  align?: 'start' | 'end';
  side?: 'top' | 'bottom';
  compact?: boolean;
}) {
  const { signOut } = useSignOut();

  return (
    <Menu
      label="Account menu"
      triggerLabel={compact ? `${initials(displayName)} account menu` : undefined}
      align={align}
      side={side}
      triggerClassName={compact ? undefined : 'w-full'}
      trigger={
        <span
          className={cn(
            'flex items-center gap-2.5 rounded-lg text-left transition-colors duration-150',
            compact
              ? 'h-9 w-9 justify-center text-body hover:bg-surface-3'
              : 'w-full border border-line bg-surface-2/70 p-2 hover:border-line-strong hover:bg-surface-3/70'
          )}
        >
          <Avatar name={displayName} className={compact ? 'h-8 w-8 text-[12px]' : 'h-8 w-8'} />
          {!compact && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold text-ink">{displayName}</span>
              <span className="block truncate text-[11px] text-muted">{email}</span>
            </span>
          )}
          {!compact && <ChevronRight size={14} className="shrink-0 rotate-[-90deg] text-subtle" />}
          {!compact && <span className="sr-only">account menu</span>}
        </span>
      }
      items={[
        {
          label: 'Account settings',
          icon: <SettingsIcon size={15} />,
          href: '/settings',
        },
        {
          label: 'Contact support',
          icon: <CircleHelp size={15} />,
          href: '/contact',
        },
        {
          label: 'Sign out',
          icon: <LogOut size={15} />,
          tone: 'danger',
          separatorBefore: true,
          onSelect: signOut,
        },
      ]}
      menuClassName="w-64"
    />
  );
}

function SidebarNav({
  pathname,
  onNavigate,
  idPrefix = 'sidebar',
}: {
  pathname: string;
  onNavigate?: () => void;
  idPrefix?: string;
}) {
  return (
    <nav aria-label="Primary" className="space-y-5">
      {[
        { label: null, items: primaryNav },
        { label: 'Office', items: secondaryNav },
      ].map((group) => (
        <div key={group.label ?? 'main'}>
          {group.label && (
            <p className="mb-1.5 px-3 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-subtle">
              {group.label}
            </p>
          )}
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  id={`${idPrefix}-${item.href}`}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'group relative flex min-h-10 items-center gap-3 rounded-lg pl-3 pr-2.5 text-[13.5px] font-medium transition-colors duration-150',
                    active
                      ? 'bg-brand-50 font-semibold text-brand-800'
                      : 'text-body hover:bg-surface-3 hover:text-ink'
                  )}
                >
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-1/2 h-5 w-[2.5px] -translate-y-1/2 rounded-full bg-brand-600"
                    />
                  )}
                  <Icon
                    size={17}
                    strokeWidth={active ? 2.25 : 1.9}
                    className={cn('shrink-0', active ? 'text-brand-600' : 'text-subtle group-hover:text-body')}
                    aria-hidden="true"
                  />
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto rounded-full bg-surface-3 px-1.5 py-0.5 text-[10px] font-semibold text-subtle">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function WorkspaceShell({
  children,
  email,
  fullName,
  companyName,
  role,
}: {
  children: React.ReactNode;
  email: string;
  fullName?: string | null;
  companyName: string;
  role?: string;
}) {
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDialogElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const displayName = fullName?.trim() || email.split('@')[0] || 'Team member';
  const breadcrumbs = getBreadcrumbs(pathname);
  const currentSection = breadcrumbs[breadcrumbs.length - 1]?.label ?? 'Workspace';

  useEffect(() => {
    const dialog = drawerRef.current;
    if (!dialog) return;
    if (drawerOpen && !dialog.open) {
      dialog.showModal();
      document.body.style.overflow = 'hidden';
    } else if (!drawerOpen && dialog.open) {
      dialog.close();
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[var(--shell-sidebar)_minmax(0,1fr)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      {/* ---------------- Desktop sidebar ---------------- */}
      <aside className="no-print sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface lg:flex">
        <div className="flex h-14 items-center border-b border-line px-4">
          <Brand href="/dashboard" size="md" />
        </div>

        <div className="px-3 pt-4">
          <div className="flex items-start gap-2.5 rounded-lg border border-line bg-surface-2/70 px-2.5 py-2">
            <span className="mt-px grid h-7 w-7 shrink-0 place-items-center rounded-md bg-brand-50 text-brand-700">
              <ShieldCheck size={15} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-ink" title={companyName}>
                {companyName}
              </p>
              <p className="truncate text-[11px] capitalize text-muted">
                {role ? `${role} workspace` : 'Subcontractor workspace'}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Link
              href="/tickets/new"
              className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-brand-600 px-3 text-[13px] font-semibold text-white shadow-xs transition-colors duration-150 hover:bg-brand-700 active:bg-brand-800"
            >
              <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
              New ticket
            </Link>
            <Link
              href="/projects/new"
              title="New project"
              aria-label="New project"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line-strong bg-surface text-body shadow-xs transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
            >
              <FolderKanban size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="mt-5 flex-1 overflow-y-auto px-3 pb-4">
          <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle">
            Workspace
          </p>
          <SidebarNav pathname={pathname} />

          <p className="mt-5 px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle">
            Account
          </p>
          <Link
            href="/settings"
            aria-current={pathname === '/settings' ? 'page' : undefined}
            className={cn(
              'group relative flex min-h-10 items-center gap-3 rounded-lg pl-3 pr-2.5 text-[13.5px] font-medium transition-colors duration-150',
              pathname === '/settings'
                ? 'bg-brand-50 font-semibold text-brand-800'
                : 'text-body hover:bg-surface-3 hover:text-ink'
            )}
          >
            {pathname === '/settings' && (
              <span
                aria-hidden="true"
                className="absolute left-0 top-1/2 h-5 w-[2.5px] -translate-y-1/2 rounded-full bg-brand-600"
              />
            )}
            <SettingsIcon
              size={17}
              strokeWidth={pathname === '/settings' ? 2.25 : 1.9}
              className={cn(
                'shrink-0',
                pathname === '/settings' ? 'text-brand-600' : 'text-subtle group-hover:text-body'
              )}
              aria-hidden="true"
            />
            Settings
          </Link>
        </div>

        <div className="border-t border-line p-3">
          <AccountMenu email={email} displayName={displayName} side="top" />
        </div>
      </aside>

      {/* ---------------- Main column ---------------- */}
      <div className="flex min-w-0 flex-col">
        <header className="no-print sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-surface/85 px-3 backdrop-blur-md sm:px-5 lg:px-7">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-body transition-colors duration-150 hover:bg-surface-3 hover:text-ink lg:hidden"
            aria-label="Open navigation menu"
            aria-expanded={drawerOpen}
          >
            <MenuIcon size={19} aria-hidden="true" />
          </button>

          <div className="lg:hidden">
            <Brand href="/dashboard" compact />
          </div>

          <nav aria-label="Breadcrumb" className="hidden min-w-0 lg:block">
            <ol className="flex items-center gap-1.5 text-[13px]">
              <li className="shrink-0 font-semibold text-ink">{companyName}</li>
              {breadcrumbs.map((crumb, index) => {
                const last = index === breadcrumbs.length - 1;
                return (
                  <li key={`${crumb.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
                    <ChevronRight size={13} className="shrink-0 text-faint" aria-hidden="true" />
                    {crumb.href && !last ? (
                      <Link
                        href={crumb.href}
                        className="truncate rounded text-muted transition-colors duration-150 hover:text-brand-700"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span aria-current="page" className="truncate font-medium text-body">
                        {crumb.label}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>

          <p className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-ink lg:hidden">
            {currentSection}
          </p>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/tickets/new"
              className="hidden min-h-9 items-center gap-1.5 rounded-lg bg-brand-600 px-3 text-[13px] font-semibold text-white shadow-xs transition-colors duration-150 hover:bg-brand-700 sm:inline-flex lg:hidden xl:inline-flex"
            >
              <Plus size={15} strokeWidth={2.5} aria-hidden="true" />
              New ticket
            </Link>
            <Link
              href="/evidence"
              className="hidden h-9 w-9 place-items-center rounded-lg border border-line-strong bg-surface text-body shadow-xs transition-colors duration-150 hover:bg-surface-2 hover:text-ink xl:grid"
              aria-label="Upload evidence"
              title="Upload evidence"
            >
              <Camera size={16} aria-hidden="true" />
            </Link>

            <div className="lg:hidden">
              <AccountMenu email={email} displayName={displayName} compact />
            </div>
          </div>
        </header>

        <main
          id="main-content"
          className="mx-auto w-full max-w-[1360px] flex-1 px-4 pb-28 pt-6 sm:px-6 sm:pt-8 lg:px-7 lg:pb-14"
        >
          {children}
        </main>
      </div>

      {/* ---------------- Mobile drawer ---------------- */}
      <dialog
        ref={drawerRef}
        aria-label="Workspace navigation"
        onClose={() => setDrawerOpen(false)}
        className="no-print fixed left-0 top-0 m-0 h-dvh max-h-none w-[min(19rem,86vw)] max-w-none bg-surface p-0 text-ink shadow-lg backdrop:bg-ink/45 backdrop:backdrop-blur-[2px]"
        style={{ marginInlineEnd: 'auto' }}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center justify-between border-b border-line px-4">
            <Brand href="/dashboard" />
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="grid h-9 w-9 place-items-center rounded-lg text-body transition-colors duration-150 hover:bg-surface-3 hover:text-ink"
              aria-label="Close navigation menu"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            <div className="flex items-start gap-2.5 rounded-lg border border-line bg-surface-2/70 px-2.5 py-2">
              <span className="mt-px grid h-7 w-7 shrink-0 place-items-center rounded-md bg-brand-50 text-brand-700">
                <ShieldCheck size={15} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-ink">{companyName}</p>
                <p className="truncate text-[11px] capitalize text-muted">
                  {role ? `${role} workspace` : 'Subcontractor workspace'}
                </p>
              </div>
            </div>

            <Link
              href="/tickets/new"
              onClick={() => setDrawerOpen(false)}
              className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-3 text-sm font-semibold text-white shadow-xs transition-colors duration-150 hover:bg-brand-700"
            >
              <Plus size={17} strokeWidth={2.5} aria-hidden="true" />
              New work ticket
            </Link>

            <p className="px-3 pb-1.5 pt-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle">
              Workspace
            </p>
            <SidebarNav
              pathname={pathname}
              idPrefix="drawer"
              onNavigate={() => setDrawerOpen(false)}
            />

            <p className="px-3 pb-1.5 pt-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle">
              Account
            </p>
            <Link
              href="/settings"
              onClick={() => setDrawerOpen(false)}
              className="flex min-h-10 items-center gap-3 rounded-lg px-3 text-[13.5px] font-medium text-body transition-colors duration-150 hover:bg-surface-3 hover:text-ink"
            >
              <SettingsIcon size={17} className="text-subtle" aria-hidden="true" />
              Settings
            </Link>
            <Link
              href="/projects/new"
              onClick={() => setDrawerOpen(false)}
              className="flex min-h-10 items-center gap-3 rounded-lg px-3 text-[13.5px] font-medium text-body transition-colors duration-150 hover:bg-surface-3 hover:text-ink"
            >
              <FolderKanban size={17} className="text-subtle" aria-hidden="true" />
              New project
            </Link>
          </div>

          <div className="border-t border-line p-3">
            <div className="flex items-center gap-2.5 px-1 pb-2.5">
              <Avatar name={displayName} className="h-9 w-9" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-ink">{displayName}</p>
                <p className="truncate text-[11px] text-muted">{email}</p>
              </div>
            </div>
            <DrawerSignOut />
          </div>
        </div>
      </dialog>

      {/* ---------------- Mobile bottom navigation ---------------- */}
      <nav
        aria-label="Workspace"
        className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        <ul className="relative grid h-14 grid-cols-5 items-stretch px-1">
          {[primaryNav[0], primaryNav[1]].map((item) => (
            <BottomNavItem key={item.href} item={item} pathname={pathname} />
          ))}

          <li className="relative flex items-center justify-center">
            <Link
              href="/tickets/new"
              aria-label="Create work ticket"
              className="absolute -top-5 grid h-12 w-12 place-items-center rounded-full bg-brand-600 text-white shadow-md ring-4 ring-canvas transition-transform duration-150 active:scale-95"
            >
              <Plus size={22} strokeWidth={2.5} aria-hidden="true" />
            </Link>
            <span className="mt-7 text-[10px] font-semibold text-subtle">New</span>
          </li>

          {[primaryNav[2], primaryNav[3]].map((item) => (
            <BottomNavItem key={item.href} item={item} pathname={pathname} />
          ))}
        </ul>
      </nav>
    </div>
  );
}

function BottomNavItem({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item.href);
  const Icon = item.icon;
  return (
    <li className="flex">
      <Link
        href={item.href}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-semibold transition-colors duration-150',
          active ? 'text-brand-700' : 'text-muted hover:text-ink'
        )}
      >
        {active && (
          <span
            aria-hidden="true"
            className="absolute inset-x-3 top-0 h-[2px] rounded-full bg-brand-600"
          />
        )}
        <Icon size={19} strokeWidth={active ? 2.35 : 1.9} aria-hidden="true" />
        <span className="truncate">{item.shortLabel ?? item.label}</span>
      </Link>
    </li>
  );
}

function DrawerSignOut() {
  const { signOut, pending, error } = useSignOut();
  return (
    <div>
      <button
        type="button"
        onClick={signOut}
        disabled={pending}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-line-strong bg-surface text-[13px] font-semibold text-body shadow-xs transition-colors duration-150 hover:bg-surface-2 hover:text-ink disabled:opacity-60"
      >
        <LogOut size={15} aria-hidden="true" />
        {pending ? 'Signing out…' : 'Sign out'}
      </button>
      {error && (
        <p role="alert" className="pt-2 text-center text-[11px] font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** Small helper used by the settings page header. */
export function UserBadge({ name, email }: { name: string; email: string }) {
  return (
    <span className="flex items-center gap-3">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-surface-3 text-body">
        <UserRound size={17} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-semibold text-ink">{name}</span>
        <span className="block truncate text-[11px] text-muted">{email}</span>
      </span>
    </span>
  );
}

export { BrandMark };
