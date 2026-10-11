import type { Metadata } from 'next';
import {
  ArrowDown,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  Clock3,
  FileDown,
  FileText,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  Wrench,
  Zap,
} from 'lucide-react';
import { SiteHeader } from '@/components/marketing/site-header';
import { SiteFooter } from '@/components/marketing/site-footer';
import { ProductPreview } from '@/components/marketing/product-preview';
import { ButtonLink } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'AmpTrail — Extra Work & T&M Documentation for Electrical Subcontractors',
  description:
    'Capture extra work, crew labor, material receipts, and jobsite photos in one organized workspace. Build audit-ready T&M work records and protect your margins.',
};

const problemPoints = [
  {
    icon: ShieldAlert,
    title: 'Disputed Extra Work',
    copy: 'Work performed under verbal direction gets forgotten or disputed weeks later when the GC project manager receives the change order request.',
  },
  {
    icon: FileText,
    title: 'Lost Paper Tickets',
    copy: 'Carbon paper tickets get stained, wrinkled in trucks, or left on clipboards, resulting in untracked costs that the subcontractor ends up eating.',
  },
  {
    icon: Camera,
    title: 'Missing Photo Evidence',
    copy: 'Photos taken on personal phone cameras get buried among personal photos or forgotten before walls and drywall ceilings are closed up.',
  },
  {
    icon: Clock3,
    title: 'Delayed Billing Cycles',
    copy: 'Office project managers spend hours hunting down foremen for hours, receipts, and descriptions before they can prepare billing documentation.',
  },
];

const workflowSteps = [
  {
    step: '01',
    title: 'Open the Jobsite Project',
    copy: 'Select the active project with its job number, site address, and general contractor pre-configured.',
  },
  {
    step: '02',
    title: 'Capture Field Details Fast',
    copy: 'Describe the out-of-scope work, record worker hours, material line items, and snap jobsite photos before moving on.',
  },
  {
    step: '03',
    title: 'Review Live Calculations',
    copy: 'Documented costs are automatically calculated down to the cent with transparent labor, materials, and equipment line items.',
  },
  {
    step: '04',
    title: 'Export Audit-Ready Records',
    copy: 'Download professional PDF records with dual signature blocks for customer review and your accounting pipeline.',
  },
];

const faqs = [
  {
    q: 'Does AmpTrail guarantee customer approval or payment?',
    a: 'No. AmpTrail is a documentation and tracking system. It gives electrical subcontractors a clean, verifiable record of field conditions, crew hours, materials, and photo evidence. Approval, contract entitlement, and payment remain subject to your agreement with the general contractor or owner.',
  },
  {
    q: 'Can foremen use AmpTrail on their phones at the jobsite?',
    a: 'Yes. The ticket creation and evidence upload workflows are optimized for mobile touch targets, responsive inputs, and direct access to phone cameras without requiring complicated software training.',
  },
  {
    q: 'Are evidence photos private and secure?',
    a: 'Yes. Photo evidence is stored in private, company-scoped storage buckets with PostgreSQL Row-Level Security (RLS). Photos are accessible only via short-lived signed URLs generated for authenticated members of your company.',
  },
  {
    q: 'Can we download PDF work records to present to general contractors?',
    a: 'Yes. Every ticket can be exported directly into a clean, professional PDF document complete with your company branding, project details, line item breakdowns, and acknowledgment signature blocks.',
  },
  {
    q: 'How are ticket statuses tracked?',
    a: 'Tickets follow a clear progression: Draft → Ready for Review → Submitted → Approved → Invoiced (or Rejected). These are internal team tracking labels used to coordinate work between the field and the office.',
  },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* SECTION 1 & 2: HERO & PRODUCT PREVIEW */}
        <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50/50 py-16 sm:py-20 lg:py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:px-8">
            <div className="max-w-[620px]">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-700">
                <Zap size={14} className="fill-blue-600" />
                Electrical Subcontractor Operations
              </span>

              <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl sm:leading-[1.08]">
                Document the work.<br />
                <span className="text-blue-600">Protect the paper trail.</span>
              </h1>

              <p className="mt-6 text-base leading-relaxed text-slate-600 sm:text-lg sm:leading-8">
                AmpTrail helps electrical subcontractors capture extra work, labor, materials, and jobsite evidence in one organized workspace.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <ButtonLink href="/signup" size="lg" className="min-w-44 shadow-md">
                  Get Started Free <ArrowRight size={16} />
                </ButtonLink>
                <a
                  href="#how-it-works"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-[15px] font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition"
                >
                  See How It Works <ArrowDown size={15} />
                </a>
              </div>

              <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck size={16} className="text-blue-600 shrink-0" />
                <span>
                  Audit-ready field documentation. Protect your contract margins without lost paperwork.
                </span>
              </div>
            </div>

            {/* Interactive/Live Product Preview */}
            <ProductPreview />
          </div>
        </section>

        {/* SECTION 3: THE PROBLEM — UNDOCUMENTED EXTRA WORK */}
        <section id="the-problem" className="scroll-mt-20 border-y border-slate-200/80 bg-white py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="eyebrow">The Cost of Missing Evidence</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Undocumented extra work is money left on the table.
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-500 leading-relaxed">
                On fast-moving commercial jobsites, electrical foremen get verbal instructions every day. Without instant, structured field documentation, your company absorbs the cost.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {problemPoints.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="card flex flex-col justify-between p-6 transition hover:border-slate-300"
                  >
                    <div>
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-600/10">
                        <Icon size={18} />
                      </span>
                      <h3 className="mt-4 text-base font-bold text-slate-900">{item.title}</h3>
                      <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">{item.copy}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 4: HOW AMPTRAIL WORKS */}
        <section id="how-it-works" className="scroll-mt-20 bg-slate-50 py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow">Simple Field Workflow</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                  From jobsite condition to verified ticket.
                </h2>
              </div>
              <p className="max-w-md text-xs sm:text-sm text-slate-500 leading-relaxed">
                Designed for field foremen standing in a mechanical room, not computer specialists sitting at a desk.
              </p>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {workflowSteps.map((step) => (
                <div
                  key={step.step}
                  className="card relative flex flex-col justify-between p-6 bg-white"
                >
                  <div>
                    <span className="font-mono text-xs font-black text-blue-600">
                      STEP {step.step}
                    </span>
                    <h3 className="mt-4 text-base font-bold text-slate-900">{step.title}</h3>
                    <p className="mt-2 text-xs text-slate-500 leading-relaxed">{step.copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 5: PROJECTS & WORK TICKETS DEEP DIVE */}
        <section id="features" className="scroll-mt-20 bg-white py-16 sm:py-20 lg:py-24 border-t border-slate-200/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div>
                <p className="eyebrow">Project-Centric Architecture</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                  Keep every work record tied to the right contract.
                </h2>
                <p className="mt-4 text-sm text-slate-600 leading-relaxed">
                  Every work ticket, photo, and line item belongs to a specific project. Track general contractor contacts, jobsite addresses, and internal job numbers in one place.
                </p>

                <div className="mt-6 space-y-3.5 text-xs sm:text-sm text-slate-700">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-blue-600 shrink-0 mt-0.5" />
                    <span>Active and archived project isolation preserves past billing history.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-blue-600 shrink-0 mt-0.5" />
                    <span>Real-time aggregation of documented costs across all tickets per job.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-blue-600 shrink-0 mt-0.5" />
                    <span>Searchable project filters by job number, GC, or physical address.</span>
                  </div>
                </div>

                <div className="mt-8">
                  <ButtonLink href="/signup">
                    Start Documenting Projects <ArrowRight size={15} />
                  </ButtonLink>
                </div>
              </div>

              {/* Graphical Visual Box */}
              <div className="card overflow-hidden bg-slate-900 p-6 sm:p-8 text-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <span className="font-mono text-xs font-bold text-blue-400">PROJECT DASHBOARD</span>
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
                    ACTIVE JOB
                  </span>
                </div>
                <div className="mt-5 space-y-3">
                  <h3 className="text-xl font-bold">Harborview Tech Campus — Building B</h3>
                  <p className="text-xs text-slate-400">General Contractor: Hensel Phelps Construction</p>
                  <p className="text-xs text-slate-400">Job #: PRJ-2026-104 · 800 Harbor Blvd, Seattle, WA</p>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-800 pt-5">
                  <div className="rounded-xl bg-slate-800/80 p-3">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Documented Extra Work</p>
                    <p className="mt-1 font-mono text-lg font-black text-white">$14,820.00</p>
                  </div>
                  <div className="rounded-xl bg-slate-800/80 p-3">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Field Tickets Logged</p>
                    <p className="mt-1 font-mono text-lg font-black text-white">9 Tickets</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6 & 7: LABOR, MATERIALS, COSTS & EVIDENCE */}
        <section className="bg-slate-50 py-16 sm:py-20 lg:py-24 border-t border-slate-200/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="eyebrow">Comprehensive T&M Tracking</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Built specifically for electrical contractors.
              </h2>
              <p className="mt-3 text-sm text-slate-500">
                Fast line-item entries for labor, materials, equipment, and private photo evidence.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {/* Card 1: Labor */}
              <div className="card p-6 bg-white">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                  <Clock3 size={18} />
                </span>
                <h3 className="mt-4 text-base font-bold text-slate-900">Crew Labor & Roles</h3>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                  Log hours and hourly rates for Journeymen, Apprentices, and Foremen. Live line totals calculate automatically to eliminate arithmetic mistakes.
                </p>
              </div>

              {/* Card 2: Materials & Equipment */}
              <div className="card p-6 bg-white">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                  <Wrench size={18} />
                </span>
                <h3 className="mt-4 text-base font-bold text-slate-900">Materials & Direct Costs</h3>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                  Record conduit sticks, wire runs, breakers, panelboards, lift rentals, and specialty tool fees with quantities and unit pricing.
                </p>
              </div>

              {/* Card 3: Photo Evidence */}
              <div className="card p-6 bg-white">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                  <Camera size={18} />
                </span>
                <h3 className="mt-4 text-base font-bold text-slate-900">Secure Photo Evidence</h3>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                  Take jobsite photos directly with your phone camera. Private cloud storage with encrypted company access and high-resolution lightbox viewing.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 8: PROFESSIONAL PDF RECORDS */}
        <section id="pdf-records" className="scroll-mt-20 bg-white py-16 sm:py-20 lg:py-24 border-t border-slate-200/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div className="order-2 lg:order-1">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Standard Commercial Work Record
                    </span>
                    <FileDown size={16} className="text-blue-600" />
                  </div>
                  <ul className="mt-4 space-y-2.5 text-xs text-slate-600">
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-blue-600" />
                      Subcontractor company branding & contact details
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-blue-600" />
                      Project number, jobsite address, and GC superintendent name
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-blue-600" />
                      Detailed scope explanation and reason outside contract
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-blue-600" />
                      Itemized labor, material, and equipment tables with subtotals
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-blue-600" />
                      Dual signature blocks for field verification and acknowledgment
                    </li>
                  </ul>
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <p className="eyebrow">Publication-Grade Output</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                  PDF documents you can proudly hand to a general contractor.
                </h2>
                <p className="mt-4 text-sm text-slate-600 leading-relaxed">
                  General contractors reject messy handwritten carbon slips. AmpTrail generates crisp, print-ready 8.5&quot; × 11&quot; PDF records formatted for formal submission and billing review.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <ButtonLink href="/signup">
                    Try AmpTrail Free <ArrowRight size={15} />
                  </ButtonLink>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 9: BENEFITS FOR FOREMEN AND OWNERS */}
        <section id="foremen-owners" className="scroll-mt-20 bg-slate-900 text-white py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-400">
                Field & Office Alignment
              </span>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                Built for the field foreman.<br />
                Loved by the business owner.
              </h2>
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-2">
              {/* Foremen */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white">
                    <Smartphone size={20} />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold">For Field Foremen</h3>
                    <p className="text-xs text-slate-400">Fast, friction-free jobsite documentation</p>
                  </div>
                </div>

                <ul className="mt-6 space-y-3.5 text-xs text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <Check size={14} className="text-blue-400 shrink-0 mt-0.5" />
                    <span>Complete tickets on your phone in under 3 minutes without typing long essays.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check size={14} className="text-blue-400 shrink-0 mt-0.5" />
                    <span>Snap photos directly with your phone camera before conduit runs get covered.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check size={14} className="text-blue-400 shrink-0 mt-0.5" />
                    <span>No more lost carbon tickets or arguments about who directed what work.</span>
                  </li>
                </ul>
              </div>

              {/* Owners & PMs */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white">
                    <TrendingUp size={20} />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold">For Owners & Project Managers</h3>
                    <p className="text-xs text-slate-400">Protect profit margins and accelerate billing</p>
                  </div>
                </div>

                <ul className="mt-6 space-y-3.5 text-xs text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <Check size={14} className="text-blue-400 shrink-0 mt-0.5" />
                    <span>Instant visibility into all unbilled extra work across active jobsites.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check size={14} className="text-blue-400 shrink-0 mt-0.5" />
                    <span>Standardized, audit-ready PDF exports that GCs accept without endless pushback.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check size={14} className="text-blue-400 shrink-0 mt-0.5" />
                    <span>Preserve company margins and stop doing free work for general contractors.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 10: FAQ ACCORDION */}
        <section id="faq" className="scroll-mt-20 bg-white py-16 sm:py-20 lg:py-24 border-t border-slate-200/80">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="eyebrow">Straightforward Answers</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Frequently Asked Questions
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Everything you need to know about AmpTrail and field T&M tracking.
              </p>
            </div>

            <div className="mt-10 divide-y divide-slate-200">
              {faqs.map((faq) => (
                <details key={faq.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-sm font-bold text-slate-900 marker:hidden">
                    <span>{faq.q}</span>
                    <span className="text-base text-blue-600 transition group-open:rotate-45 shrink-0">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-600">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 11: FINAL CALL TO ACTION */}
        <section className="bg-gradient-to-br from-blue-600 to-indigo-700 py-16 text-white sm:py-20 lg:py-24">
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8 space-y-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
              <Zap size={14} className="fill-white" /> Protect Your Jobsite Margins
            </span>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              Stop letting extra work slip away.
            </h2>
            <p className="mx-auto max-w-2xl text-sm sm:text-base leading-relaxed text-blue-100">
              Set up your AmpTrail workspace today. Document crew hours, materials, and photos before the details fade from memory.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
              <ButtonLink
                href="/signup"
                variant="dark"
                size="lg"
                className="bg-slate-950 hover:bg-slate-900 text-white shadow-xl"
              >
                Create Free Workspace <ArrowRight size={16} />
              </ButtonLink>
              <ButtonLink
                href="/login"
                variant="secondary"
                size="lg"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                Existing Member Login
              </ButtonLink>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
