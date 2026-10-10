import { ArrowDown, ArrowRight, Camera, Check, ClipboardList, Clock3, FileDown, FileText, MapPin, ShieldCheck, Zap } from 'lucide-react';
import { SiteHeader } from '@/components/marketing/site-header';
import { SiteFooter } from '@/components/marketing/site-footer';
import { ProductPreview } from '@/components/marketing/product-preview';
import { ButtonLink } from '@/components/ui/button';

const featureCards = [
  { icon: Camera, title: 'Evidence that stays with the work', copy: 'Attach site photos, captions, and notes to a project or ticket. Private by default, not floating around in a camera roll.' },
  { icon: Clock3, title: 'Labor with the details attached', copy: 'Record worker or role, hours, and rate while the shift is still fresh. Line totals are calculated consistently.' },
  { icon: FileText, title: 'Materials and other costs', copy: 'Log quantities and unit costs beside the extra-work description so the record is easier to review later.' },
  { icon: FileDown, title: 'A clean record to share', copy: 'Print a simple, professional T&M work record with project details, entries, totals, notes, and status.' },
];
const steps = [
  { number: '01', title: 'Open the project', copy: 'Keep the job name, number, site, and general contractor together in one place.' },
  { number: '02', title: 'Capture it in the field', copy: 'Describe what changed. Add time, materials, notes, and photos before the moment passes.' },
  { number: '03', title: 'Prepare a clear ticket', copy: 'Review calculated totals, track its status, then print a record for your own billing process.' },
];
const faqs = [
  { q: 'Does AmpTrail get extra work approved or guarantee payment?', a: 'No. AmpTrail helps you keep an organized record. Approval, contract interpretation, and payment remain between your company and its customer.' },
  { q: 'Can I use this on a phone at the jobsite?', a: 'Yes. The ticket and evidence flows are designed for small screens, with large controls and a direct path to capture a photo or field note.' },
  { q: 'Are photos public?', a: 'No. Evidence uses a private Supabase Storage bucket with company-scoped access policies and short-lived signed preview links after you configure Supabase.' },
  { q: 'Can I submit a ticket to a general contractor from AmpTrail?', a: 'AmpTrail creates a print-ready work record. It does not currently send submissions to a GC portal or track an external approval automatically.' },
  { q: 'What happens if I have not connected Supabase yet?', a: 'The public site remains available. Sign-in, workspace data, and private uploads stay disabled until you connect your Supabase project and apply the included migration.' },
];

export default function HomePage() {
  return <>
    <SiteHeader />
    <main>
      <section className="relative overflow-hidden bg-canvas">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-14 sm:px-6 sm:pb-24 sm:pt-20 lg:grid-cols-[0.93fr_1.07fr] lg:gap-14 lg:px-8 lg:py-24">
          <div className="max-w-[600px]">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#e8d8cc] bg-white/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.13em] text-orange-dark"><Zap size={13} fill="currentColor" /> Field records for electrical subcontractors</p>
            <h1 className="mt-6 text-[clamp(2.65rem,6.2vw,5.2rem)] font-extrabold leading-[0.99] tracking-[-0.065em] text-ink">Extra work happens.<br /><span className="text-orange">Don&apos;t lose the record.</span></h1>
            <p className="mt-6 max-w-[510px] text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">The day gets busy. AmpTrail helps electrical subcontractors document work outside the original scope—photos, field notes, labor, and materials—before the details fade.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/signup" className="min-h-12 px-5 text-[15px]">Get started <ArrowRight size={17} /></ButtonLink>
              <ButtonLink href="/login" variant="secondary" className="min-h-12 px-5 text-[15px]">Log in</ButtonLink>
            </div>
            <p className="mt-4 text-xs leading-5 text-muted">A better record supports the conversation. It does not guarantee approval or payment.</p>
            <a href="#how-it-works" className="mt-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-500 hover:text-ink">See how it works <ArrowDown size={14} /></a>
          </div>
          <ProductPreview />
        </div>
      </section>

      <section className="border-y border-line bg-white">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-7 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {[
            ['01', 'Capture evidence'],
            ['02', 'Record time & materials'],
            ['03', 'Build a clear ticket'],
            ['04', 'Prepare billing records'],
          ].map(([number, label]) => <div key={number} className="flex items-center gap-3"><span className="text-xs font-extrabold tracking-[0.1em] text-orange">{number}</span><span className="text-sm font-bold text-ink">{label}</span></div>)}
        </div>
      </section>

      <section id="features" className="scroll-mt-24 bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl"><p className="eyebrow">Built around a field record</p><h2 className="mt-3 text-3xl font-extrabold tracking-[-0.05em] text-ink sm:text-4xl">The pieces of extra work,<br className="hidden sm:block" /> in one place.</h2><p className="mt-4 text-base leading-7 text-muted">Not another general-purpose project suite. Just a practical way to connect what happened, what it took, and what you need to document.</p></div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featureCards.map(({ icon: Icon, title, copy }, index) => <article key={title} className="rounded-2xl border border-line bg-canvas p-5 sm:p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-orange shadow-sm"><Icon size={20} /></span>
              <p className="mt-6 text-xs font-bold tracking-[0.12em] text-orange">0{index + 1}</p>
              <h3 className="mt-2 text-lg font-bold tracking-tight text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{copy}</p>
            </article>)}
          </div>
          <div className="mt-7 grid gap-4 rounded-2xl bg-navy px-5 py-6 text-white sm:grid-cols-2 sm:px-8 sm:py-8 lg:grid-cols-4">
            {[
              { icon: MapPin, title: 'A place to work', text: 'Projects, jobsite address, and GC.' },
              { icon: Clock3, title: 'A moment in time', text: 'Work date, area, and labor.' },
              { icon: Camera, title: 'Evidence attached', text: 'Photos and notes in a private workspace.' },
              { icon: ClipboardList, title: 'A useful status', text: 'Track draft through invoiced.' },
            ].map(({ icon: Icon, title, text }) => <div key={title} className="flex gap-3"><Icon size={18} className="mt-0.5 shrink-0 text-orange" /><div><h3 className="text-sm font-bold">{title}</h3><p className="mt-1 text-xs leading-5 text-white/60">{text}</p></div></div>)}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 bg-[#eeece5] px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">A simple workflow</p><h2 className="mt-3 text-3xl font-extrabold tracking-[-0.05em] text-ink sm:text-4xl">From field condition<br className="hidden sm:block" /> to organized record.</h2></div><p className="max-w-md text-sm leading-6 text-muted">Make the useful record at the time of work—then let your existing contract and billing process take it from there.</p></div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => <article key={step.number} className="relative rounded-2xl border border-[#ddd9cf] bg-white p-6 sm:p-7">
              <span className="text-xs font-extrabold tracking-[0.12em] text-orange">STEP {step.number}</span>
              <h3 className="mt-5 text-xl font-bold tracking-tight text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{step.copy}</p>
              {index < 2 && <ArrowRight size={19} className="absolute right-5 top-7 hidden text-slate-300 md:block" />}
            </article>)}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_0.8fr]">
          <div><p className="eyebrow">Made for the moment it happens</p><h2 className="mt-3 max-w-xl text-3xl font-extrabold leading-tight tracking-[-0.05em] text-ink sm:text-4xl">A pocket-sized habit for protecting the paper trail.</h2><p className="mt-4 max-w-xl text-base leading-7 text-muted">Extra work can be easy to miss once the crew has moved on. AmpTrail gives the field a straightforward place to save the who, what, when, where, and supporting details.</p><ul className="mt-7 grid gap-3 sm:grid-cols-2">{['Photos and captions', 'Time-stamped work notes', 'Labor and materials', 'Print-ready ticket records'].map((item) => <li key={item} className="flex items-center gap-2.5 text-sm font-semibold text-ink"><span className="grid h-5 w-5 place-items-center rounded-full bg-green/10 text-green"><Check size={13} strokeWidth={3} /></span>{item}</li>)}</ul></div>
          <div className="rounded-[1.75rem] bg-navy p-6 text-white sm:p-9"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-white/50">The point is simple</p><p className="mt-4 text-2xl font-extrabold leading-tight tracking-[-0.035em] sm:text-3xl">Remember the work.<br /><span className="text-orange">Keep the details.</span></p></div><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-orange"><ShieldCheck size={23} /></span></div><div className="mt-8 border-t border-white/15 pt-5"><p className="text-sm leading-6 text-white/70">AmpTrail is an organizing tool, not a substitute for contract review, a customer approval, or an invoice.</p><ButtonLink href="/signup" className="mt-6 min-h-11">Start a workspace <ArrowRight size={16} /></ButtonLink></div></div>
        </div>
      </section>

      <section id="pricing" className="scroll-mt-24 border-y border-line bg-canvas px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center"><p className="eyebrow">Pricing</p><h2 className="mt-3 text-3xl font-extrabold tracking-[-0.05em] text-ink sm:text-4xl">Straightforward is the plan.</h2><p className="mt-4 text-base leading-7 text-muted">Proposed plan structure only. AmpTrail has not launched paid subscriptions, and pricing is still being developed.</p></div>
          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {[
              { name: 'Solo', desc: 'For an owner-operator keeping the record close.', detail: 'Projects · work tickets · evidence' },
              { name: 'Crew', desc: 'For a small team sharing jobsite documentation.', detail: 'Shared workspace · team records' },
              { name: 'Office', desc: 'For office staff preparing organized billing records.', detail: 'Field capture · print-ready exports' },
            ].map((plan) => <article key={plan.name} className="rounded-2xl border border-line bg-white p-6 sm:p-7"><span className="rounded-full bg-orange/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-orange-dark">Proposed</span><h3 className="mt-5 text-xl font-bold text-ink">{plan.name}</h3><p className="mt-2 min-h-[48px] text-sm leading-6 text-muted">{plan.desc}</p><p className="mt-5 border-t border-line pt-4 text-sm font-semibold text-ink">{plan.detail}</p><p className="mt-2 text-xs text-muted">Pricing to be announced. No paid plan is currently offered.</p></article>)}
          </div>
          <p className="mt-5 text-center text-xs text-muted">The current build is a product preview. Connecting Supabase enables the account and workspace flows.</p>
        </div>
      </section>

      <section id="faq" className="scroll-mt-24 bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.7fr_1.3fr]">
          <div><p className="eyebrow">Good to know</p><h2 className="mt-3 text-3xl font-extrabold tracking-[-0.05em] text-ink sm:text-4xl">Frequently asked.</h2><p className="mt-4 max-w-sm text-sm leading-6 text-muted">A straightforward look at what AmpTrail does—and what it does not do.</p></div>
          <div className="divide-y divide-line">{faqs.map((item) => <details key={item.q} className="group py-5 first:pt-0"><summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-base font-bold text-ink marker:hidden"><span>{item.q}</span><span className="mt-0.5 text-xl leading-none text-orange transition group-open:rotate-45">+</span></summary><p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{item.a}</p></details>)}</div>
        </div>
      </section>

      <section className="bg-orange px-4 py-14 text-white sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-white/75">When the scope changes</p><h2 className="mt-2 text-3xl font-extrabold tracking-[-0.05em] sm:text-4xl">Make a record while it&apos;s fresh.</h2></div><ButtonLink href="/signup" variant="secondary" className="min-h-12 shrink-0 border-white bg-white px-5 text-orange-dark hover:bg-orange-50">Get started <ArrowRight size={16} /></ButtonLink></div>
      </section>
    </main>
    <SiteFooter />
  </>;
}
