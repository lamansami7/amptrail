import { AlertCircle, Camera, Check, FileText, Signal } from 'lucide-react';

/**
 * Hero composition: a crew text thread beside the draft ticket it would produce.
 *
 * Everything here is SAMPLE DATA and the SMS intake it depicts is in
 * development, so the visual says so in plain text. No rates, totals, customers
 * or approvals are invented: rates read "not provided" exactly as the product
 * principle (never fabricate missing values) requires.
 */

const rise = (ms: number) => ({ ['--d' as string]: `${ms}ms` }) as React.CSSProperties;

function PhotoChip({ tone }: { tone: string }) {
  return (
    <span
      className={`relative grid h-12 w-[3.35rem] shrink-0 place-items-center overflow-hidden rounded-lg border border-white/60 ${tone}`}
    >
      <Camera size={15} className="text-white/85" aria-hidden="true" />
    </span>
  );
}

function PhoneThread() {
  return (
    <div className="relative mx-auto w-[15.75rem] max-w-full rounded-[2.1rem] lg:w-[13.75rem] border border-ink-soft bg-ink p-[7px] shadow-lg">
      <div className="overflow-hidden rounded-[1.65rem] bg-[#f4f6fa]">
        {/* status bar */}
        <div className="flex items-center justify-between bg-white px-4 pb-1.5 pt-2.5 text-[10px] font-semibold text-ink">
          <span>9:41</span>
          <span className="flex items-center gap-1 text-subtle">
            <Signal size={10} aria-hidden="true" />
            5G
          </span>
        </div>
        <div className="border-b border-line bg-white px-4 pb-2.5">
          <p className="text-[12px] font-semibold text-ink">AmpTrail crew line</p>
          <p className="text-[10px] text-subtle">Sample thread</p>
        </div>

        <div className="space-y-2 px-3 py-3 text-[11px] leading-[1.4]">
          <p className="text-center text-[10px] font-medium uppercase tracking-wider text-muted">
            Today · Level 2
          </p>

          <div className="hero-slide flex justify-end" style={rise(500)}>
            <p className="max-w-[88%] rounded-2xl rounded-br-md bg-brand-600 px-3 py-2 text-white">
              Extra conduit run on Level 2. Mike and James, 4 hrs each. 120 ft of 3/4&quot; EMT, 12
              connectors, 8 couplings.
            </p>
          </div>

          <div className="hero-slide flex justify-end gap-1.5" style={rise(900)}>
            <PhotoChip tone="bg-gradient-to-br from-slate-500 to-slate-700" />
            <PhotoChip tone="bg-gradient-to-br from-brand-700 to-ink-soft" />
            <PhotoChip tone="bg-gradient-to-br from-slate-600 to-brand-800" />
          </div>

          <div className="hero-slide flex" style={rise(1500)}>
            <p className="max-w-[88%] rounded-2xl rounded-bl-md border border-line bg-white px-3 py-2 text-ink-soft">
              Got it: 8 labor-hours, 3 materials, 3 photos. Which project is this for?
            </p>
          </div>
        </div>

        <div className="mx-3 mb-3 flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-[10px] text-faint">
          Text message
        </div>
      </div>
    </div>
  );
}

function DraftTicket() {
  return (
    <figure
      role="img"
      aria-label="Sample draft T&M ticket: labor for two workers totaling 8 labor-hours, three material lines, and a flag noting the project and rates were not provided."
      className="overflow-hidden rounded-2xl border border-line bg-surface shadow-lg"
    >
      <div aria-hidden="true">
        <div className="flex items-center justify-between gap-3 border-b border-line bg-surface-2/80 px-4 py-2.5">
          <span className="flex items-center gap-2 text-[11px] font-semibold text-ink">
            <FileText size={13} className="text-brand-700" />
            Draft T&amp;M ticket
          </span>
          <span className="rounded-full border border-warning-line bg-warning-soft px-2 py-0.5 text-[10px] font-semibold text-warning">
            Needs review
          </span>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <div className="hero-rise" style={rise(1900)}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle">
              Work description
            </p>
            <p className="mt-1 text-[13px] font-medium text-ink">
              Extra conduit run, Level 2 (field-directed)
            </p>
          </div>

          <div className="hero-rise" style={rise(2150)}>
            <div className="flex items-baseline justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle">
                Labor
              </p>
              <p className="font-mono text-[11px] font-semibold text-ink">8.0 labor-hrs</p>
            </div>
            <ul className="mt-1.5 divide-y divide-line rounded-lg border border-line text-[12px]">
              {[
                ['Mike', '4.0 hrs'],
                ['James', '4.0 hrs'],
              ].map(([name, hrs]) => (
                <li key={name} className="flex items-center justify-between px-3 py-1.5">
                  <span className="text-ink-soft">{name}</span>
                  <span className="flex items-center gap-3">
                    <span className="text-[11px] text-faint">rate not provided</span>
                    <span className="font-mono text-ink">{hrs}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="hero-rise" style={rise(2400)}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle">
              Materials
            </p>
            <ul className="mt-1.5 divide-y divide-line rounded-lg border border-line text-[12px]">
              {[
                ['3/4" EMT conduit', '120 ft'],
                ['Connectors', '12 ea'],
                ['Couplings', '8 ea'],
              ].map(([item, qty]) => (
                <li key={item} className="flex items-center justify-between px-3 py-1.5">
                  <span className="text-ink-soft">{item}</span>
                  <span className="font-mono text-ink">{qty}</span>
                </li>
              ))}
            </ul>
          </div>

          <div
            className="hero-rise flex items-start gap-2 rounded-lg border border-warning-line bg-warning-soft px-3 py-2 text-[12px] text-warning"
            style={rise(2700)}
          >
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <p>
              <span className="font-semibold">2 items need a person:</span> project and work date
              were not in the message.
            </p>
          </div>

          <div className="hero-rise flex items-center gap-2 text-[11px] text-muted" style={rise(2950)}>
            <Check size={13} className="text-success" />
            Original message and 3 photos stay attached, unedited.
          </div>
        </div>
      </div>
    </figure>
  );
}

export function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[36rem] lg:max-w-none">
      <div
        aria-hidden="true"
        className="bg-blueprint pointer-events-none absolute -inset-6 rounded-[2rem] opacity-70 [mask-image:radial-gradient(70%_70%_at_60%_40%,black,transparent)]"
      />

      <div className="relative grid gap-6 lg:grid-cols-[13.75rem_minmax(0,1fr)] lg:items-start lg:gap-4">
        <div className="hero-rise lg:mt-24" style={rise(100)}>
          <PhoneThread />
        </div>
        <div className="hero-rise" style={rise(250)}>
          <DraftTicket />
        </div>
      </div>

      <p className="relative mt-5 text-center text-[11.5px] text-muted lg:mt-6 lg:text-left">
        <span className="font-semibold text-ink-soft">Preview with sample data.</span> Text-message
        intake is in development; the ticket builder is available today.
      </p>
    </div>
  );
}
