import Link from 'next/link';
import { Brand } from '@/components/brand';

const columns = [
  {
    title: 'Product',
    links: [
      { href: '/#workflow', label: 'How it works' },
      { href: '/#product', label: 'Work tickets' },
      { href: '/#product', label: 'Labor & materials' },
      { href: '/#records', label: 'PDF records' },
      { href: '/#faq', label: 'FAQ' },
    ],
  },
  {
    title: 'Who it’s for',
    links: [
      { href: '/#roles', label: 'Field foremen' },
      { href: '/#roles', label: 'Project managers' },
      { href: '/#roles', label: 'Business owners' },
    ],
  },
  {
    title: 'Account',
    links: [
      { href: '/signup', label: 'Create workspace' },
      { href: '/login', label: 'Log in' },
      { href: '/forgot-password', label: 'Reset password' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/contact', label: 'Contact' },
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
    ],
  },
];

export function SiteFooter() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();

  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(2,1fr)] lg:grid-cols-[1.6fr_repeat(4,1fr)] lg:gap-8">
          <div className="md:col-span-3 lg:col-span-1">
            <Brand />
            <p className="mt-4 max-w-xs text-[13px] leading-6 text-muted">
              Field documentation for electrical subcontractors. Capture extra work, crew time,
              materials and jobsite photos — then hand over a record that stands up.
            </p>
            {supportEmail && (
              <a href={`mailto:${supportEmail}`} className="link mt-4 inline-block text-[13px]">
                {supportEmail}
              </a>
            )}
          </div>

          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle">
                {column.title}
              </p>
              <ul className="mt-3.5 space-y-2.5">
                {column.links.map((link) => (
                  <li key={`${link.href}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-body transition-colors duration-150 hover:text-brand-700"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 border-t border-line pt-6">
          <p className="text-[12px] leading-5 text-muted">
            <strong className="font-semibold text-body">Not legal or billing advice.</strong> AmpTrail
            is an internal documentation tool. Ticket totals are calculated from what your team
            records, and statuses such as “Approved” are workflow labels only — they are not a
            customer signature, a verified change order, or a guarantee of payment.
          </p>
          <div className="mt-4 flex flex-col gap-2 text-[12px] text-subtle sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} AmpTrail. All rights reserved.</p>
            <p className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              Evidence stored privately, scoped to your company
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
