import Link from 'next/link';
import { Brand } from '@/components/brand';
import { Zap } from 'lucide-react';

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200/90 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr_1fr] lg:px-8 lg:py-16">
        <div>
          <Brand />
          <p className="mt-4 max-w-sm text-xs sm:text-sm leading-relaxed text-slate-500">
            Dedicated field documentation and T&M tracking platform for commercial electrical subcontractors. Designed for foremen on jobsites and project managers in the office.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-700">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-blue-50 text-blue-600">
              <Zap size={12} className="fill-blue-600" />
            </span>
            <span>Commercial Electrical Operations</span>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Platform</p>
          <div className="mt-3.5 flex flex-col gap-2.5 text-xs font-semibold text-slate-600">
            <a href="/#the-problem" className="hover:text-blue-600 transition">The Problem</a>
            <a href="/#how-it-works" className="hover:text-blue-600 transition">How It Works</a>
            <a href="/#features" className="hover:text-blue-600 transition">Work Tickets</a>
            <a href="/#pdf-records" className="hover:text-blue-600 transition">PDF Records</a>
            <a href="/#faq" className="hover:text-blue-600 transition">FAQ</a>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Audience</p>
          <div className="mt-3.5 flex flex-col gap-2.5 text-xs font-semibold text-slate-600">
            <a href="/#foremen-owners" className="hover:text-blue-600 transition">Field Foremen</a>
            <a href="/#foremen-owners" className="hover:text-blue-600 transition">Project Managers</a>
            <a href="/#foremen-owners" className="hover:text-blue-600 transition">Business Owners</a>
            <Link href="/signup" className="hover:text-blue-600 transition">Start Free Trial</Link>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Legal & Support</p>
          <div className="mt-3.5 flex flex-col gap-2.5 text-xs font-semibold text-slate-600">
            <Link href="/privacy" className="hover:text-blue-600 transition">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-blue-600 transition">Terms of Service</Link>
            <Link href="/contact" className="hover:text-blue-600 transition">Contact & Help</Link>
            <Link href="/login" className="hover:text-blue-600 transition">Client Login</Link>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 bg-slate-50/50">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} AmpTrail Inc. All rights reserved.</p>
          <p className="text-[11px]">
            AmpTrail is an internal documentation system. Ticket records do not guarantee customer approval, change orders, or payment.
          </p>
        </div>
      </div>
    </footer>
  );
}
