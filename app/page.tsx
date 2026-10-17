import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  Camera,
  Check,
  ClipboardCheck,
  ClipboardList,
  FileDown,
  FolderKanban,
  History,
  Inbox,
  Mic,
  Package,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UsersRound,
  Wand2,
  MessageSquareText,
} from 'lucide-react';
import { SiteHeader } from '@/components/marketing/site-header';
import { SiteFooter } from '@/components/marketing/site-footer';
import { FaqAccordion } from '@/components/marketing/faq-accordion';
import { PreviewTabs } from '@/components/marketing/preview-tabs';
import { HeroVisual } from '@/components/marketing/hero-visual';
import { SmsDemo } from '@/components/marketing/sms-demo';
import {
  DashboardPreview,
  EditorPreview,
  EvidencePreview,
  PdfPreview,
} from '@/components/marketing/previews';
import { ButtonLink } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'AmpTrail — T&M documentation for electrical subcontractors',
  description:
    'Document extra electrical work with labor, materials and jobsite photos, then export a professional T&M ticket. Built for commercial electrical subcontractors; text-message intake is in development.',
  alternates: { canonical: '/' },
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

type Availability = 'available' | 'development' | 'planned';

const availabilityMeta: Record<Availability, { label: string; className: string }> = {
  available: {
    label: 'Available now',
    className: 'border-success-line bg-success-soft text-success',
  },
  development: {
    label: 'In development',
    className: 'border-brand-line bg-brand-50 text-brand-800',
  },
  planned: { label: 'Planned', className: 'border-line bg-surface-3 text-subtle' },
};

function AvailabilityChip({ value }: { value: Availability }) {
  const meta = availabilityMeta[value];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold leading-4',
        meta.className
      )}
    >
      {meta.label}
    </span>
  );
}

const steps = [
  {
    step: '01',
    icon: Camera,
    title: 'Capture',
    body: 'Add field notes, hours, materials and photos while the work is still visible. Text-message and voice-note intake is in development.',
    status: 'available' as Availability,
    note: 'Web capture available now',
  },
  {
    step: '02',
    icon: FolderKanban,
    title: 'Organize',
    body: 'Every ticket belongs to a project, with the work date, location and the reason it fell outside scope recorded the same way each time.',
    status: 'available' as Availability,
    note: 'Projects and tickets available now',
  },
  {
    step: '03',
    icon: ClipboardCheck,
    title: 'Review',
    body: 'Office staff check labor, materials and evidence, then move the ticket through its status. Nothing is finalized by software alone.',
    status: 'available' as Availability,
    note: 'Status tracking available now',
  },
  {
    step: '04',
    icon: FileDown,
    title: 'Export',
    body: 'Produce a formatted ticket with line-item detail, evidence thumbnails and blank signature lines for acknowledgement on site.',
    status: 'available' as Availability,
    note: 'PDF and print available now',
  },
];

const features: {
  icon: typeof Camera;
  title: string;
  body: string;
  status: Availability;
}[] = [
  {
    icon: ClipboardList,
    title: 'Structured T&M tickets',
    body: 'Project, work date, area, reason outside scope and the customer representative, captured in the same order every time.',
    status: 'available',
  },
  {
    icon: Package,
    title: 'Labor, materials and equipment',
    body: 'Separate sections for crew hours and rates, material quantities and unit costs, and rented equipment. Totals recalculate as you type.',
    status: 'available',
  },
  {
    icon: Camera,
    title: 'Private photo evidence',
    body: 'Photos are stored in a private bucket scoped to your company and shown through short-lived signed links.',
    status: 'available',
  },
  {
    icon: FileDown,
    title: 'PDF export and print',
    body: 'An 8.5 × 11 record with your company header, line items, subtotals, evidence thumbnails and blank signature lines.',
    status: 'available',
  },
  {
    icon: FolderKanban,
    title: 'Projects and ticket history',
    body: 'Keep every project’s tickets together, search and filter them, and duplicate a past ticket as a starting point.',
    status: 'available',
  },
  {
    icon: Inbox,
    title: 'Field-note inbox',
    body: 'Log what the crew reported, with photos. The office assigns a project, flags anything missing, and turns the note into a ticket. The original wording is never edited.',
    status: 'available',
  },
  {
    icon: History,
    title: 'Activity history',
    body: 'A running record of notes logged, tickets created and approvals recorded, so you can see what changed and when.',
    status: 'available',
  },
  {
    icon: MessageSquareText,
    title: 'Text and photo intake',
    body: 'Crews text a company number and their notes and photos arrive in the inbox automatically. Today the inbox is filled by your team typing notes in.',
    status: 'development',
  },
  {
    icon: Mic,
    title: 'Voice-note transcription',
    body: 'Voice recordings transcribed into the original record. Standard SMS cannot carry audio, so this depends on messaging provider support and a web upload fallback.',
    status: 'planned',
  },
  {
    icon: Wand2,
    title: 'Assisted extraction',
    body: 'Hours, names and quantities suggested from a message for a person to correct. Missing values are flagged, never invented.',
    status: 'planned',
  },
  {
    icon: UsersRound,
    title: 'Team roles and invitations',
    body: 'Invite foremen, project managers and office staff with permissions enforced in the database, not just the interface.',
    status: 'planned',
  },
];

const audience = [
  {
    icon: Smartphone,
    title: 'Foremen',
    lead: 'Less paperwork, nothing new to learn.',
    points: [
      'Document extra work while standing in the room where it happened.',
      'Add a labor line without menus or arithmetic.',
      'Attach captioned photos before the ceiling closes.',
    ],
  },
  {
    icon: Building2,
    title: 'Project managers',
    lead: 'See extra work and its support in one place.',
    points: [
      'Every ticket, its status and its documented value on one screen.',
      'Filter by status or project, or search across descriptions.',
      'Export the record instead of reconstructing it from texts.',
    ],
  },
  {
    icon: Inbox,
    title: 'Office administrators',
    lead: 'Faster ticket prep, tidier records.',
    points: [
      'Consistent formatting on every ticket, every time.',
      'Duplicate a past ticket instead of retyping the header.',
      'Photos, hours and notes already attached, not chased later.',
    ],
  },
];

const faqs = [
  {
    question: 'What is AmpTrail?',
    answer:
      'AmpTrail is a documentation tool for electrical subcontractors. It organizes the labor, materials, notes and photos behind extra work into a time-and-materials ticket your office can review and export as a PDF.',
  },
  {
    question: 'Does AmpTrail approve work or guarantee payment?',
    answer:
      'No. AmpTrail records what your crew did, what it cost and what evidence exists. Approval, contract entitlement and payment stay with your agreement with the general contractor or owner. Statuses are internal workflow labels your team sets for tracking, and generating a PDF is never treated as an approval.',
  },
  {
    question: 'Do foremen need to install an app?',
    answer:
      'No. AmpTrail runs in a phone or desktop browser. Text-message intake, which would let a foreman simply text a number, is in development and not available yet.',
  },
  {
    question: 'Can crews submit photos and voice notes?',
    answer:
      'Photos can be uploaded in the web app today (JPEG, PNG or WebP up to 10 MB each), either on a ticket or on a field note in the office inbox. Photos arriving by text message are in development. Voice notes are planned: standard SMS cannot carry audio, so they will depend on messaging provider support, with a web upload fallback.',
  },
  {
    question: 'How are T&M tickets created?',
    answer:
      'Today a person fills in the ticket in the web editor: project, work description, labor, materials, equipment and photos. Assisted extraction from text messages is planned, and any suggested values will always be editable and reviewed by a person before use.',
  },
  {
    question: 'Can office staff review tickets before they go out?',
    answer:
      'Yes. Tickets move through review statuses so the field and the office can see where each record stands. Only the person who created a ticket can edit it today, and only an untouched draft can be deleted.',
  },
  {
    question: 'Can I download a PDF?',
    answer:
      'Yes. The PDF includes your company name, ticket number and date, project details, the work description and reason outside scope, itemized labor, material and equipment lines with subtotals, evidence thumbnails, and blank signature lines.',
  },
  {
    question: 'Is my project data private?',
    answer:
      'Records are scoped to your company in the database using row-level security, and photos live in a private storage bucket displayed through signed links that expire after one hour. There are no public photo links. Before relying on any system for sensitive records, review the Privacy page and test it with your own accounts.',
  },
  {
    question: 'Does AmpTrail integrate with other systems?',
    answer:
      'Not yet. There are no accounting, project-management or general-contractor portal integrations today. Tickets leave AmpTrail as a PDF or a print.',
  },
  {
    question: 'What happens when information is missing?',
    answer:
      'AmpTrail never fills in hours, quantities, dates or rates for you. Required fields must be completed before a ticket is saved. In the planned text intake, anything not stated in a message will be flagged for a person to resolve.',
  },
  {
    question: 'Can multiple foremen use it?',
    answer:
      'Team invitations and roles are planned but not built. Today each account has its own company workspace, so a shared crew login is not something we recommend.',
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
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_70%_-10%,rgba(37,99,235,0.11),transparent_55%)]"
          />
          <div className="relative mx-auto grid max-w-6xl gap-14 px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-10 lg:px-8 lg:pb-24 lg:pt-20">
            <div className="max-w-xl">
              <p
                className="hero-rise inline-flex items-center gap-2 rounded-full border border-brand-line bg-brand-50/70 py-1 pl-1.5 pr-3 text-[12.5px] font-medium text-brand-800"
                style={{ ['--d' as string]: '0ms' }}
              >
                <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-600 text-white">
                  <Sparkles size={11} aria-hidden="true" />
                </span>
                Built for commercial electrical subcontractors
              </p>

              <h1 className="display hero-rise mt-6 lg:text-[2.7rem]" style={{ ['--d' as string]: '80ms' }}>
                The work happened.
                <br />
                <span className="text-brand-600">Make sure it’s documented.</span>
              </h1>

              <p
                className="hero-rise mt-6 text-[1.0625rem] leading-7 text-body sm:text-lg sm:leading-8"
                style={{ ['--d' as string]: '160ms' }}
              >
                AmpTrail turns jobsite evidence, like photos, hours, materials and notes, into
                organized T&amp;M tickets your office can review and export. Build tickets in your
                browser today. Text-message intake is in development.
              </p>

              <div
                className="hero-rise mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
                style={{ ['--d' as string]: '240ms' }}
              >
                <ButtonLink href="/signup" size="lg" className="sm:min-w-48">
                  Create your workspace
                  <ArrowRight size={16} aria-hidden="true" />
                </ButtonLink>
                <ButtonLink href="#demo" variant="secondary" size="lg">
                  See how it works
                </ButtonLink>
              </div>

              <ul
                className="hero-rise mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-muted"
                style={{ ['--d' as string]: '320ms' }}
              >
                {[
                  'No credit card required',
                  'Works on phones on site',
                  'A person reviews every ticket',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <Check size={14} className="shrink-0 text-brand-600" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <HeroVisual />
          </div>
        </section>

        {/* ---------------- Problem ---------------- */}
        <section id="problem" className="border-b border-line bg-surface py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="eyebrow">The cost of a missing record</p>
              <h2 className="section-title mt-3">
                Undocumented extra work becomes your company’s cost.
              </h2>
              <p className="mt-3 text-[15px] leading-7 text-muted">
                On a commercial jobsite, direction arrives verbally and construction moves fast. If
                the record is not captured while the work is visible, the money follows the memory.
              </p>
            </div>

            <ol className="mt-12 grid gap-x-8 gap-y-8 sm:grid-cols-2">
              {problems.map((problem, index) => (
                <li key={problem.title} className="reveal flex gap-4">
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

        {/* ---------------- How it works ---------------- */}
        <section id="how-it-works" className="py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="eyebrow">How it works</p>
              <h2 className="section-title mt-3">
                From jobsite evidence to a ticket your office can stand behind.
              </h2>
              <p className="mt-3 text-[15px] leading-7 text-muted">
                Four steps, built for someone standing in a mechanical room with a phone and a
                superintendent waiting.
              </p>
            </div>

            <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((item) => {
                const Icon = item.icon;
                return (
                  <li
                    key={item.step}
                    className="reveal card flex flex-col p-5 transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-700">
                        <Icon size={19} aria-hidden="true" />
                      </span>
                      <span className="font-mono text-[12px] font-semibold text-faint">
                        {item.step}
                      </span>
                    </div>
                    <h3 className="mt-4 text-[1.0625rem] font-semibold tracking-[-0.015em] text-ink">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 flex-1 text-[13.5px] leading-6 text-muted">{item.body}</p>
                    <p className="mt-4 flex items-center gap-1.5 text-[12px] font-medium text-success">
                      <Check size={13} aria-hidden="true" />
                      {item.note}
                    </p>
                  </li>
                );
              })}
            </ol>

            <div className="mt-14">
              <PreviewTabs
                panels={[
                  {
                    id: 'editor',
                    label: 'Ticket editor',
                    content: <EditorPreview />,
                    hint: 'Labor, material and equipment lines recalculate as you type. Sample data.',
                  },
                  {
                    id: 'dashboard',
                    label: 'Overview',
                    content: <DashboardPreview />,
                    hint: 'Every open ticket, its status and its documented value on one screen. Sample data.',
                  },
                ]}
              />
            </div>
          </div>
        </section>

        {/* ---------------- Interactive demo ---------------- */}
        <section id="demo" className="border-y border-line bg-surface py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="eyebrow">Try the workflow</p>
              <h2 className="section-title mt-3">
                See how a text becomes a reviewable ticket.
              </h2>
              <p className="mt-3 text-[15px] leading-7 text-muted">
                Step through the planned text-message workflow with a sample message. This
                walkthrough runs entirely in your browser with sample data, and it is not connected
                to a phone number, an AI service or your account.
              </p>
            </div>

            <div className="mt-10">
              <SmsDemo />
            </div>
          </div>
        </section>

        {/* ---------------- Features ---------------- */}
        <section id="features" className="py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="eyebrow">Features</p>
              <h2 className="section-title mt-3">One workspace for the whole record.</h2>
              <p className="mt-3 text-[15px] leading-7 text-muted">
                Not a form builder and not a spreadsheet. We label what works today and what does
                not, so you are never guessing.
              </p>
            </div>

            <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <li
                    key={feature.title}
                    className={cn(
                      'reveal card p-5 transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-md',
                      feature.status !== 'available' && 'bg-surface-2/60 shadow-none'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-surface text-brand-700">
                        <Icon size={17} aria-hidden="true" />
                      </span>
                      <AvailabilityChip value={feature.status} />
                    </div>
                    <h3 className="mt-3.5 h3">{feature.title}</h3>
                    <p className="mt-1.5 text-[13.5px] leading-6 text-muted">{feature.body}</p>
                  </li>
                );
              })}
            </ul>

            <div className="mt-16 grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
              <div>
                <p className="eyebrow">Output</p>
                <h3 className="section-title mt-3">A record you can hand over, not explain.</h3>
                <p className="mt-3 text-[15px] leading-7 text-muted">
                  Export or print an 8.5 × 11 document with the project and job number, the work
                  performed and why it fell outside scope, itemized lines with subtotals, and blank
                  signature lines for acknowledgement on site.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    'Company header, ticket number and work date',
                    'Project, job number, jobsite address and general contractor',
                    'Labor, material and equipment tables with subtotals',
                    'Evidence thumbnails where the browser can load the private links',
                    'Blank signature lines, never a fabricated approval',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-[13.5px] leading-6 text-body">
                      <Check size={15} className="mt-1 shrink-0 text-brand-600" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <PdfPreview />
            </div>

            <div className="mt-16 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center lg:gap-16">
              <div className="order-2 lg:order-1">
                <EvidencePreview />
              </div>
              <div className="order-1 lg:order-2">
                <p className="eyebrow">Evidence</p>
                <h3 className="section-title mt-3">Photos that stay with the ticket.</h3>
                <p className="mt-3 text-[15px] leading-7 text-muted">
                  Attach captioned jobsite photos to the ticket they support. Files are private to
                  your company, viewed through links that expire after one hour, and removable only
                  by the person who uploaded them.
                </p>
                <p className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[12.5px] text-muted">
                  {['JPEG, PNG or WebP', '10 MB per photo', 'Signed links, 1-hour expiry'].map(
                    (label) => (
                      <span key={label} className="flex items-center gap-1.5">
                        <ShieldCheck size={13} className="text-brand-600" aria-hidden="true" />
                        {label}
                      </span>
                    )
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- Roles ---------------- */}
        <section id="roles" className="border-y border-line bg-surface py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="eyebrow">Field &amp; office</p>
              <h2 className="section-title mt-3">One record, three points of view.</h2>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {audience.map((group) => {
                const Icon = group.icon;
                return (
                  <Card key={group.title} className="reveal p-6">
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-700">
                      <Icon size={19} aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 text-[1.0625rem] font-semibold tracking-[-0.015em] text-ink">
                      {group.title}
                    </h3>
                    <p className="mt-1 text-[13.5px] text-muted">{group.lead}</p>
                    <ul className="mt-4 space-y-3">
                      {group.points.map((point) => (
                        <li
                          key={point}
                          className="flex items-start gap-2.5 text-[13.5px] leading-6 text-body"
                        >
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

        {/* ---------------- Pricing ---------------- */}
        <section id="pricing" className="py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="eyebrow">Pricing</p>
              <h2 className="section-title mt-3">Early access while pricing is finalized.</h2>
              <p className="mt-3 text-[15px] leading-7 text-muted">
                We are still deciding plans, so we are not publishing prices we might not honor.
              </p>
            </div>

            <div className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-2xl border border-line bg-surface shadow-md">
              <div className="grid md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                <div className="p-6 sm:p-8">
                  <span className="inline-flex rounded-full border border-brand-line bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold text-brand-800">
                    Early access
                  </span>
                  <h3 className="mt-4 text-xl font-semibold tracking-[-0.02em] text-ink">
                    Use the ticket builder today
                  </h3>
                  <p className="mt-2 text-[13.5px] leading-6 text-muted">
                    Create a workspace and document real extra work. No billing is active in the
                    product, and no credit card is requested.
                  </p>
                  <ul className="mt-5 space-y-2.5">
                    {[
                      'Projects, tickets, labor, materials and equipment',
                      'Private photo evidence',
                      'PDF export and print',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-[13.5px] leading-6 text-body">
                        <Check size={15} className="mt-1 shrink-0 text-brand-600" aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <ButtonLink href="/signup">
                      Create your workspace
                      <ArrowRight size={15} aria-hidden="true" />
                    </ButtonLink>
                    <ButtonLink href="/contact" variant="secondary">
                      Ask about pricing
                    </ButtonLink>
                  </div>
                </div>

                <div className="border-t border-line bg-surface-2/70 p-6 sm:p-8 md:border-l md:border-t-0">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-subtle">
                    Why there is no price yet
                  </p>
                  <p className="mt-3 text-[13.5px] leading-6 text-body">
                    Text intake, voice transcription and assisted extraction carry real per-message
                    and per-minute costs. Plans for those features will be set separately, once the
                    features exist and their costs are known.
                  </p>
                  <p className="mt-3 text-[13.5px] leading-6 text-body">
                    Nothing here is a commitment on future pricing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- FAQ ---------------- */}
        <section id="faq" className="border-t border-line bg-surface py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="eyebrow">Questions</p>
              <h2 className="section-title mt-3">Straight answers before you start.</h2>
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
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-2xl bg-ink px-6 py-12 text-white sm:px-12 sm:py-14">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_85%_0%,rgba(59,118,246,0.35),transparent_60%)]"
              />
              <div className="relative mx-auto max-w-2xl text-center">
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
                <p className="mt-5 text-[12.5px] text-slate-400">No credit card required.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
