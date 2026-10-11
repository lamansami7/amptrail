import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Calculator,
  Camera,
  Check,
  ClipboardList,
  FileDown,
  MapPin,
  Package,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Timer,
  TrendingUp,
} from 'lucide-react';
import { SiteHeader } from '@/components/marketing/site-header';
import { SiteFooter } from '@/components/marketing/site-footer';
import { FaqAccordion } from '@/components/marketing/faq-accordion';
import { PreviewTabs } from '@/components/marketing/preview-tabs';
import {
  DashboardPreview,
  EditorPreview,
  EvidencePreview,
  PdfPreview,
  TicketDocPreview,
} from '@/components/marketing/previews';
import { ButtonLink } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'AmpTrail — Extra work, fully documented',
  description:
    'Capture extra work, crew labor, materials and jobsite photos in one workspace, then export a professional T&M record. Built for commercial electrical subcontractors.',
};

const problems = [
  {
    title: 'Verbal direction disappears',
    body: 'A superintendent asks for a reroute at 7am. By invoice time nobody remembers who directed it or why the drawings did not match.',
  },
  {
    title: 'Paper tickets die in the truck',
    body: 'Carbon copies crease, fade, or never make it back to the office — and the hours quietly become your company’s cost.',
  },
  {
    title: 'Photos get buried',
    body: 'Site photos land in a personal camera roll. Once drywall closes the ceiling, there is nothing left to point at.',
  },
  {
    title: 'Billing waits on the story',
    body: 'The office chases foremen for hours and descriptions weeks later, so the change order request lands even later.',
  },
];

const workflow = [
  {
    step: '01',
    title: 'Set up the job once',
    body: 'Project name, job number, jobsite address and general contractor — entered once, reused on every ticket.',
  },
  {
    step: '02',
    title: 'Document the work on site',
    body: 'Describe the condition and the direction received, add labor hours, materials and equipment, and attach captioned photos while the work is still visible.',
  },
  {
    step: '03',
    title: 'Send a record that holds up',
    body: 'Export a formatted PDF with line-item detail and blank acknowledgement lines for the site representative.',
  },
];

const productFeatures = [
  {
    icon: ClipboardList,
    title: 'Structured work tickets',
    body: 'Project, work date, area, reason outside scope and the customer representative — captured in the same order every time.',
  },
  {
    icon: Calculator,
    title: 'Live calculations',
    body: 'Line totals and subtotals recalculate as you type, so the number on the screen is the number on the document.',
  },
  {
    icon: Package,
    title: 'Labor, materials, equipment',
    body: 'Separate sections for crew hours and rates, material quantities and unit costs, and rented equipment or direct costs.',
  },
  {
    icon: Camera,
    title: 'Company-scoped evidence',
    body: 'Photos live in a private bucket and are only reachable through short-lived signed links issued to your workspace.',
  },
  {
    icon: Timer,
    title: 'Built for a phone, standing up',
    body: 'Large touch targets, sensible keyboards for numbers, and a running total that stays visible while you work.',
  },
  {
    icon: FileDown,
    title: 'PDF export and print',
    body: 'One click produces an 8.5 × 11 record with your company header, line items, subtotals and signature blocks.',
  },
];

const audience = [
  {
    icon: Smartphone,
    title: 'For the foreman on site',
    points: [
      'Document extra work while standing in the room where it happened.',
      'Add a labor line without hunting through menus or doing arithmetic.',
      'Photos and captions attached before the ceiling closes.',
      'Nothing to memorise — the next ticket looks like the last one.',
    ],
  },
  {
    icon: TrendingUp,
    title: 'For the owner and PM',
    points: [
      'See every open ticket and its documented value from one screen.',
      'Filter by status, project or search across descriptions.',
      'Export the record instead of reconstructing it from texts.',
      'Keep the field and the office working from the same numbers.',
    ],
  },
];

const faqs = [
  {
    question: 'Does AmpTrail approve work or guarantee payment?',
    answer:
      'No. AmpTrail is a documentation tool. It records what your crew did, what it cost, and what evidence exists. Approval, contract entitlement and payment stay with your agreement with the general contractor or owner. Statuses such as “Approved” are internal workflow labels your team sets for tracking.',
  },
  {
    question: 'How are my jobsite photos stored?',
    answer:
      'Evidence is uploaded to a private Supabase storage bucket scoped to your company. Access is enforced by row-level security and object policies, and the interface displays images through signed URLs that expire after one hour. There are no public photo links.',
  },
  {
    question: 'Can foremen use it on a phone on site?',
    answer:
      'Yes — the ticket editor is built for phones first. Numeric fields open the decimal keypad, the running total stays pinned, and the main navigation is reachable with one thumb. The same account works on desktop in the office.',
  },
  {
    question: 'What does the exported PDF contain?',
    answer:
      'A formatted work record with your company name, the ticket number and date, the project and job number, the general contractor, the work description and reason outside scope, itemised labor, material and equipment lines with subtotals, any attached evidence thumbnails, and blank signature lines for acknowledgement.',
  },
  {
    question: 'What happens to a ticket after it is created?',
    answer:
      'Tickets move through Draft, Ready for review, Submitted, Approved, Invoiced or Rejected so the field and the office can see where each record stands. Only the person who created a ticket can edit it, and only an untouched draft can be deleted.',
  },
  {
    question: 'Do I need to install anything?',
    answer:
      'No. AmpTrail runs in the browser and is designed to be usable the moment your account is created — add a project, create a ticket, and export it.',
  },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      <main id="main">
        {/* ---------------- Hero ---------------- */}
        <section className="relative overflow-hidden border-b border-line">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_-10%,rgba(37,99,235,0.10),transparent_55%)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(to_right,#e4e9f0_1px,transparent_1px),linear-gradient(to_bottom,#e4e9f0_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(80%_60%_at_50%_0%,black,transparent)]"
          />

          <div className="relative mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,1fr)] lg:items-center lg:gap-16 lg:px-8 lg:pb-24 lg:pt-24">
            <div className="max-w-xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-brand-line bg-brand-50/70 py-1 pl-1.5 pr-3 text-[12.5px] font-medium text-brand-800">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-600 text-white">
                  <Sparkles size={11} aria-hidden="true" />
                </span>
                Built for commercial electrical subcontractors
              </p>

              <h1 className="display mt-6">
                Document the work.
                <br />
                <span className="text-brand-600">Protect the paper trail.</span>
              </h1>

              <p className="mt-6 text-[1.0625rem] leading-7 text-body sm:text-lg sm:leading-8">
                Document extra electrical work, capture jobsite evidence, and create professional
                work tickets — one workspace built for electrical subcontractors.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <ButtonLink href="/signup" size="lg" className="sm:min-w-48">
                  Create your workspace
                  <ArrowRight size={16} aria-hidden="true" />
                </ButtonLink>
                <ButtonLink href="#product" variant="secondary" size="lg">
                  See the product
                </ButtonLink>
              </div>

              <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-muted">
                {[
                  'Free to start',
                  'No credit card required',
                  'Works on phones on site',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <Check size={14} className="shrink-0 text-brand-600" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative mx-auto w-full max-w-[34rem] pb-8 sm:pb-10">
              <TicketDocPreview />
              <div className="absolute -bottom-1 left-0 z-20 hidden w-52 rounded-xl border border-line bg-surface p-3 shadow-lg sm:block lg:-left-8">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-subtle">
                  <Calculator size={11} aria-hidden="true" />
                  Labor · live
                </p>
                <p className="mt-1.5 font-mono text-[15px] font-semibold text-ink">$4,450.00</p>
                <p className="mt-0.5 text-[11px] text-muted">Recalculated per line</p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- Problem ---------------- */}
        <section id="problem" className="border-b border-line bg-surface py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="eyebrow">The cost of a missing record</p>
              <h2 className="mt-3 text-[1.75rem] font-semibold tracking-[-0.025em] text-ink sm:text-[2rem]">
                Undocumented extra work becomes your company’s cost.
              </h2>
              <p className="mt-3 text-[15px] leading-7 text-muted">
                On a commercial jobsite, direction arrives verbally and construction moves fast. If
                the record is not captured while the work is visible, the money follows the memory.
              </p>
            </div>

            <ol className="mt-12 grid gap-x-8 gap-y-8 sm:grid-cols-2">
              {problems.map((problem, index) => (
                <li key={problem.title} className="flex gap-4">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line bg-surface-2 font-mono text-[12px] font-semibold text-subtle">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="h3">{problem.title}</h3>
                    <p className="mt-1.5 text-[13.5px] leading-6 text-muted">{problem.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------------- Workflow ---------------- */}
        <section id="workflow" className="py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start lg:gap-16">
              <div className="lg:sticky lg:top-24">
                <p className="eyebrow">How it works</p>
                <h2 className="mt-3 text-[1.75rem] font-semibold tracking-[-0.025em] text-ink sm:text-[2rem]">
                  Three steps from the jobsite to a finished record.
                </h2>
                <p className="mt-3 text-[15px] leading-7 text-muted">
                  The workflow is designed for someone standing in a mechanical room, holding a
                  phone, with a superintendent waiting.
                </p>

                <ol className="mt-8 space-y-5">
                  {workflow.map((item) => (
                    <li key={item.step} className="flex gap-4">
                      <span className="mt-0.5 font-mono text-[12px] font-semibold text-brand-600">
                        {item.step}
                      </span>
                      <div>
                        <h3 className="h3">{item.title}</h3>
                        <p className="mt-1 text-[13.5px] leading-6 text-muted">{item.body}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <PreviewTabs
                panels={[
                  {
                    id: 'editor',
                    label: 'Ticket editor',
                    content: <EditorPreview />,
                    hint: 'Labor, material and equipment lines recalculate as you type.',
                  },
                  {
                    id: 'dashboard',
                    label: 'Overview',
                    content: <DashboardPreview />,
                    hint: 'Every open ticket, its status and its documented value on one screen.',
                  },
                ]}
              />
            </div>
          </div>
        </section>

        {/* ---------------- Product ---------------- */}
        <section id="product" className="border-y border-line bg-surface py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="eyebrow">The product</p>
              <h2 className="mt-3 text-[1.75rem] font-semibold tracking-[-0.025em] text-ink sm:text-[2rem]">
                One workspace for the whole record.
              </h2>
              <p className="mt-3 text-[15px] leading-7 text-muted">
                Not a form builder and not a spreadsheet. AmpTrail is one structured workflow that
                produces a document a general contractor can read.
              </p>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start">
              <ul className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
                {productFeatures.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <li key={feature.title}>
                      <span className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-surface-2 text-brand-700">
                        <Icon size={17} aria-hidden="true" />
                      </span>
                      <h3 className="mt-3.5 h3">{feature.title}</h3>
                      <p className="mt-1.5 text-[13.5px] leading-6 text-muted">{feature.body}</p>
                    </li>
                  );
                })}
              </ul>

              <div className="space-y-6">
                <EvidencePreview />
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-[12.5px] text-muted">
                  {[
                    ['JPEG, PNG, WebP', Camera],
                    ['10 MB per photo', ShieldCheck],
                    ['Signed links, 1-hour expiry', MapPin],
                  ].map(([label], index) => (
                    <span key={label as string} className="flex items-center gap-1.5">
                      {index === 0 ? (
                        <Camera size={13} className="text-brand-600" aria-hidden="true" />
                      ) : index === 1 ? (
                        <ShieldCheck size={13} className="text-brand-600" aria-hidden="true" />
                      ) : (
                        <Timer size={13} className="text-brand-600" aria-hidden="true" />
                      )}
                      {label as string}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- Records / PDF ---------------- */}
        <section id="records" className="py-16 sm:py-20 lg:py-24">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8">
            <div>
              <p className="eyebrow">Output</p>
              <h2 className="mt-3 text-[1.75rem] font-semibold tracking-[-0.025em] text-ink sm:text-[2rem]">
                A record you can hand over, not explain.
              </h2>
              <p className="mt-3 text-[15px] leading-7 text-muted">
                Export or print an 8.5 × 11 document with your company header, the project and job
                number, the work performed and why it fell outside scope, itemised lines with
                subtotals, and blank signature lines for acknowledgement on site.
              </p>

              <ul className="mt-7 space-y-3">
                {[
                  'Company header, ticket number and work date',
                  'Project, job number, jobsite address and general contractor',
                  'Labor, material and equipment tables with subtotals',
                  'Evidence thumbnails where the browser can load the private links',
                  'Blank signature lines — never a fabricated approval',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[13.5px] leading-6 text-body">
                    <Check size={15} className="mt-1 shrink-0 text-brand-600" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/signup">
                  Create your workspace
                  <ArrowRight size={15} aria-hidden="true" />
                </ButtonLink>
                <ButtonLink href="/login" variant="secondary">
                  Log in
                </ButtonLink>
              </div>
            </div>

            <PdfPreview />
          </div>
        </section>

        {/* ---------------- Roles ---------------- */}
        <section id="roles" className="border-y border-line bg-surface py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="eyebrow">Field &amp; office</p>
              <h2 className="mt-3 text-[1.75rem] font-semibold tracking-[-0.025em] text-ink sm:text-[2rem]">
                One record, two points of view.
              </h2>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {audience.map((group) => {
                const Icon = group.icon;
                return (
                  <Card key={group.title} className="p-6 sm:p-7">
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-700">
                      <Icon size={19} aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 text-[1.0625rem] font-semibold tracking-[-0.015em] text-ink">
                      {group.title}
                    </h3>
                    <ul className="mt-4 space-y-3">
                      {group.points.map((point) => (
                        <li key={point} className="flex items-start gap-2.5 text-[13.5px] leading-6 text-body">
                          <Check size={15} className="mt-1 shrink-0 text-brand-600" aria-hidden="true" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* ---------------- FAQ ---------------- */}
        <section id="faq" className="py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="eyebrow">Questions</p>
              <h2 className="mt-3 text-[1.75rem] font-semibold tracking-[-0.025em] text-ink sm:text-[2rem]">
                Straight answers before you start.
              </h2>
            </div>
            <div className="mt-10">
              <FaqAccordion items={faqs} />
            </div>
            <p className="mt-6 text-center text-[13px] text-muted">
              Something else on your mind?{' '}
              <Link href="/contact" className="link">
                Contact us
              </Link>
              .
            </p>
          </div>
        </section>

        {/* ---------------- Final CTA ---------------- */}
        <section className="border-t border-line bg-surface py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-2xl bg-ink px-6 py-12 text-white sm:px-12 sm:py-14">
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-[1.75rem] font-semibold tracking-[-0.025em] sm:text-[2rem]">
                  Start the record on your next extra work order.
                </h2>
                <p className="mt-3 text-[15px] leading-7 text-slate-300">
                  Create a workspace, add your first project, and document the next change while the
                  crew is still on site.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <ButtonLink href="/signup" size="lg" className="bg-white text-ink hover:bg-slate-100">
                    Create your workspace
                    <ArrowRight size={16} aria-hidden="true" />
                  </ButtonLink>
                  <ButtonLink
                    href="/login"
                    variant="secondary"
                    size="lg"
                    className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  >
                    Log in
                  </ButtonLink>
                </div>
                <p className="mt-5 text-[12.5px] text-slate-400">
                  Free to start. No credit card required.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
