'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  FileText,
  Lock,
  MessageSquare,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Interactive walkthrough of the planned text-message-to-ticket workflow.
 *
 * Honesty rules baked in:
 *  - every value is labeled sample data and the component never talks to a backend;
 *  - the SMS intake it depicts is marked "in development";
 *  - missing values (project, date, rates) are flagged and left blank, never guessed;
 *  - the export step shows blank signature lines and states that a PDF is not an approval.
 */

type Segment = { text: string; kind?: 'labor' | 'material' };
const SEGMENTS: Segment[] = [
  { text: 'Extra conduit run on Level 2. ' },
  { text: 'Mike and James worked 4 hours each', kind: 'labor' },
  { text: '. Used ' },
  { text: '120 feet of 3/4-inch EMT', kind: 'material' },
  { text: ', ' },
  { text: '12 connectors', kind: 'material' },
  { text: ', and ' },
  { text: '8 couplings', kind: 'material' },
  { text: '. Photos attached.' },
];

const STEPS = [
  { id: 'receive', title: 'Message received', blurb: 'A foreman texts what happened. No app to open.' },
  {
    id: 'extract',
    title: 'Labor & materials extracted',
    blurb: 'Hours per person and quantities are pulled out for review.',
  },
  {
    id: 'evidence',
    title: 'Evidence attached',
    blurb: 'Photos and the original wording are stored unedited.',
  },
  {
    id: 'flags',
    title: 'Missing details flagged',
    blurb: 'Anything not stated is flagged, never invented.',
  },
  { id: 'review', title: 'Office review', blurb: 'A person confirms every flagged item.' },
  { id: 'export', title: 'Export', blurb: 'A formatted ticket with blank signature lines.' },
] as const;

const REVIEW_STEP = 4;

const SAMPLE_PROJECTS = [
  'Sample project A · Northgate office fit-out',
  'Sample project B · Riverside clinic, Level 2',
  'Sample project C · Eastview warehouse retrofit',
];

function MessageBubble({ step }: { step: number }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2/70 p-3.5">
      <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-subtle">
        <MessageSquare size={12} aria-hidden="true" />
        Foreman text · sample
      </p>
      <p className="mt-2 text-[13.5px] leading-6 text-ink">
        {SEGMENTS.map((segment, index) => (
          <span
            key={index}
            className={cn(
              'rounded transition-colors duration-300',
              step >= 1 && segment.kind === 'labor' && 'bg-brand-100 px-0.5 text-brand-900',
              step >= 1 && segment.kind === 'material' && 'bg-success-soft px-0.5 text-success'
            )}
          >
            {segment.text}
          </span>
        ))}
      </p>
      {step >= 1 && (
        <p className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-brand-300" aria-hidden="true" /> Labor
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-emerald-300" aria-hidden="true" /> Materials
          </span>
        </p>
      )}
    </div>
  );
}

function Panel({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="animate-pop-in rounded-xl border border-line bg-surface p-4" key={label}>
      {children}
    </div>
  );
}

function ExtractPanel() {
  return (
    <Panel label="extract">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle">Labor</p>
          <ul className="mt-2 divide-y divide-line rounded-lg border border-line text-[13px]">
            {[
              ['Mike', '4.0 hrs'],
              ['James', '4.0 hrs'],
            ].map(([name, hrs]) => (
              <li key={name} className="flex justify-between px-3 py-2">
                <span className="text-ink-soft">{name}</span>
                <span className="font-mono text-ink">{hrs}</span>
              </li>
            ))}
            <li className="flex justify-between bg-brand-50/70 px-3 py-2 font-semibold">
              <span className="text-brand-900">Total</span>
              <span className="font-mono text-brand-900">8.0 labor-hours</span>
            </li>
          </ul>
          <p className="mt-2 text-[11.5px] leading-5 text-muted">
            Two workers at 4 hours each is 8 labor-hours, not 4. Elapsed time and labor-hours are
            kept separate.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle">
            Materials
          </p>
          <ul className="mt-2 divide-y divide-line rounded-lg border border-line text-[13px]">
            {[
              ['3/4" EMT conduit', '120 ft'],
              ['Connectors', '12 ea'],
              ['Couplings', '8 ea'],
            ].map(([item, qty]) => (
              <li key={item} className="flex justify-between px-3 py-2">
                <span className="text-ink-soft">{item}</span>
                <span className="font-mono text-ink">{qty}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11.5px] leading-5 text-muted">
            No prices, rates or markup are added. Those come from your own records.
          </p>
        </div>
      </div>
    </Panel>
  );
}

function EvidencePanel() {
  return (
    <Panel label="evidence">
      <div className="flex flex-wrap items-center gap-3">
        {[
          'from-slate-500 to-slate-700',
          'from-brand-700 to-ink-soft',
          'from-slate-600 to-brand-800',
        ].map((tone, index) => (
          <figure key={tone} className="w-24">
            <span
              className={cn(
                'grid h-20 w-24 place-items-center rounded-lg bg-gradient-to-br',
                tone
              )}
              aria-hidden="true"
            >
              <Camera size={18} className="text-white/85" />
            </span>
            <figcaption className="mt-1 text-[11px] text-muted">Photo {index + 1} · sample</figcaption>
          </figure>
        ))}
      </div>
      <p className="mt-3.5 flex items-start gap-2 rounded-lg bg-surface-2 px-3 py-2 text-[12.5px] leading-5 text-body">
        <Lock size={14} className="mt-0.5 shrink-0 text-brand-700" aria-hidden="true" />
        The original message and photos are preserved as received. Editing the ticket later never
        overwrites them.
      </p>
    </Panel>
  );
}

function FlagsPanel() {
  const flags = [
    { label: 'Project', detail: 'Not stated in the message. Needs a person to choose.' },
    { label: 'Work date', detail: 'Not stated. Needs confirmation.' },
    { label: 'Labor rates', detail: 'Not provided. Left blank, never estimated.' },
  ];
  return (
    <Panel label="flags">
      <ul className="space-y-2">
        {flags.map((flag) => (
          <li
            key={flag.label}
            className="flex items-start gap-2.5 rounded-lg border border-warning-line bg-warning-soft px-3 py-2 text-[13px]"
          >
            <AlertCircle size={15} className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />
            <span className="text-warning">
              <span className="font-semibold">{flag.label}:</span> {flag.detail}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 rounded-lg border border-line bg-surface-2 px-3 py-2 text-[12.5px] text-body">
        <span className="font-semibold text-ink">Planned follow-up text:</span> “Which project was
        this work for?” One targeted question, not a barrage.
      </p>
    </Panel>
  );
}

type ReviewState = { project: string; dateOk: boolean; hoursOk: boolean };

function ReviewPanel({
  review,
  setReview,
}: {
  review: ReviewState;
  setReview: (next: ReviewState) => void;
}) {
  const projectId = useId();
  const done = review.project !== '' && review.dateOk && review.hoursOk;
  return (
    <Panel label="review">
      <div className="space-y-3.5">
        <div>
          <label htmlFor={projectId} className="label">
            Project
          </label>
          <select
            id={projectId}
            className="field-control mt-1.5"
            value={review.project}
            onChange={(event) => setReview({ ...review, project: event.target.value })}
          >
            <option value="">Choose a project…</option>
            {SAMPLE_PROJECTS.map((project) => (
              <option key={project} value={project}>
                {project}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="space-y-2">
          <legend className="label">Confirm</legend>
          {[
            ['dateOk', 'Work date confirmed with the foreman'],
            ['hoursOk', 'Hours per person look right (8.0 labor-hours)'],
          ].map(([key, text]) => (
            <label
              key={key}
              className="flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg border border-line px-3 text-[13px] text-ink-soft transition-colors hover:bg-surface-2"
            >
              <input
                type="checkbox"
                className="h-4 w-4 accent-brand-600"
                checked={review[key as 'dateOk' | 'hoursOk']}
                onChange={(event) =>
                  setReview({ ...review, [key]: event.target.checked } as ReviewState)
                }
              />
              {text}
            </label>
          ))}
        </fieldset>

        <p
          className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-2 text-[12.5px] font-medium',
            done
              ? 'border border-success-line bg-success-soft text-success'
              : 'border border-warning-line bg-warning-soft text-warning'
          )}
          role="status"
        >
          {done ? <Check size={14} aria-hidden="true" /> : <AlertCircle size={14} aria-hidden="true" />}
          {done ? 'Status: Ready to export' : 'Status: Needs review. Resolve the items above.'}
        </p>
      </div>
    </Panel>
  );
}

function ExportPanel({ project }: { project: string }) {
  return (
    <Panel label="export">
      <div className="mx-auto max-w-sm rounded-lg border border-line-strong bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between border-b border-line pb-2.5">
          <div>
            <p className="flex items-center gap-1.5 text-[12px] font-semibold text-ink">
              <FileText size={13} className="text-brand-700" aria-hidden="true" />
              T&amp;M ticket · sample
            </p>
            <p className="mt-0.5 text-[11px] text-muted">{project || 'Project not selected'}</p>
          </div>
          <span className="font-mono text-[11px] text-faint">AT-SAMPLE</span>
        </div>
        <dl className="mt-3 space-y-1.5 text-[12px]">
          <div className="flex justify-between">
            <dt className="text-muted">Extra conduit run, Level 2</dt>
            <dd className="font-mono text-ink">8.0 labor-hrs</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">3/4&quot; EMT, connectors, couplings</dt>
            <dd className="font-mono text-ink">3 lines</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Photos attached</dt>
            <dd className="font-mono text-ink">3</dd>
          </div>
        </dl>
        <div className="mt-5 grid grid-cols-2 gap-4 text-[10.5px] text-faint">
          {['Foreman signature', 'Customer signature'].map((label) => (
            <div key={label}>
              <div className="h-px bg-line-strong" />
              <p className="mt-1">{label} (blank)</p>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 text-center text-[12.5px] leading-5 text-muted">
        Generating a PDF is not an approval. Signature lines stay blank until someone signs.
      </p>
    </Panel>
  );
}

export function SmsDemo() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [visible, setVisible] = useState(false);
  const [review, setReview] = useState<ReviewState>({ project: '', dateOk: false, hoursOk: false });
  const rootRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useRef(false);

  const reviewComplete = review.project !== '' && review.dateOk && review.hoursOk;
  const canAdvance = step < STEPS.length - 1 && (step !== REVIEW_STEP || reviewComplete);

  // Start autoplay only once the demo is on screen, and never for people who
  // prefer reduced motion.
  useEffect(() => {
    reducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.45 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const [autoplayArmed, setAutoplayArmed] = useState(true);
  useEffect(() => {
    if (visible && autoplayArmed && !reducedMotion.current) setPlaying(true);
  }, [visible, autoplayArmed]);

  useEffect(() => {
    if (!playing) return;
    if (step >= REVIEW_STEP) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setStep((current) => current + 1), 3800);
    return () => window.clearTimeout(timer);
  }, [playing, step]);

  function go(next: number) {
    setAutoplayArmed(false);
    setPlaying(false);
    setStep(Math.max(0, Math.min(STEPS.length - 1, next)));
  }

  function restart() {
    setReview({ project: '', dateOk: false, hoursOk: false });
    setAutoplayArmed(false);
    setPlaying(false);
    setStep(0);
  }

  const panel = useMemo(() => {
    switch (STEPS[step].id) {
      case 'extract':
        return <ExtractPanel />;
      case 'evidence':
        return <EvidencePanel />;
      case 'flags':
        return <FlagsPanel />;
      case 'review':
        return <ReviewPanel review={review} setReview={setReview} />;
      case 'export':
        return <ExportPanel project={review.project} />;
      default:
        return null;
    }
  }, [step, review]);

  return (
    <div
      ref={rootRef}
      className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-8"
      role="group"
      aria-label="Interactive walkthrough of the planned text-message-to-ticket workflow, using sample data"
    >
      {/* Compact step picker for phones: keeps the stage on screen. */}
      <nav aria-label="Demo steps" className="flex items-center justify-between gap-1.5 lg:hidden">
        {STEPS.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => go(index)}
            aria-label={`Step ${index + 1}: ${item.title}`}
            aria-current={index === step ? 'step' : undefined}
            className={cn(
              'grid h-10 flex-1 place-items-center rounded-lg text-[13px] font-semibold transition-colors',
              index === step
                ? 'bg-brand-600 text-white'
                : index < step
                  ? 'bg-brand-100 text-brand-800'
                  : 'bg-surface-3 text-subtle'
            )}
          >
            {index < step ? <Check size={14} aria-hidden="true" /> : index + 1}
          </button>
        ))}
      </nav>

      {/* Full step list for larger screens */}
      <div className="hidden lg:block">
        <ol className="space-y-1.5">
          {STEPS.map((item, index) => {
            const active = index === step;
            const done = index < step;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => go(index)}
                  aria-current={active ? 'step' : undefined}
                  className={cn(
                    'group flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-[background-color,border-color,box-shadow] duration-200',
                    active
                      ? 'border-brand-line bg-brand-50/70 shadow-xs'
                      : 'border-transparent hover:bg-surface-2'
                  )}
                >
                  <span
                    className={cn(
                      'mt-px grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold transition-colors',
                      active
                        ? 'bg-brand-600 text-white'
                        : done
                          ? 'bg-brand-100 text-brand-800'
                          : 'bg-surface-3 text-subtle'
                    )}
                  >
                    {done ? <Check size={12} aria-hidden="true" /> : index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14px] font-semibold text-ink">{item.title}</span>
                    <span
                      className={cn(
                        'block text-[12.5px] leading-5 text-muted transition-[max-height,opacity] duration-300',
                        active ? 'mt-0.5 max-h-12 opacity-100' : 'max-h-0 overflow-hidden opacity-0 lg:max-h-12 lg:opacity-100'
                      )}
                    >
                      {item.blurb}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Stage */}
      <div className="rounded-2xl border border-line bg-surface-2/60 p-3.5 shadow-sm sm:p-5">
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[12px] font-semibold text-ink" aria-live="polite">
            Step {step + 1} of {STEPS.length}: {STEPS[step].title}
          </p>
          <span className="rounded-full border border-line bg-surface px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-subtle">
            Sample data · not connected
          </span>
        </div>

        <div className="min-h-[20rem] space-y-3 sm:min-h-[27rem]">
          <MessageBubble step={step} />
          {panel}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3.5">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => go(step - 1)}
              disabled={step === 0}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line-strong bg-surface px-3 text-[13px] font-semibold text-ink-soft transition-colors hover:bg-surface-2 disabled:pointer-events-none disabled:opacity-50"
            >
              <ArrowLeft size={14} aria-hidden="true" />
              Back
            </button>
            {step === STEPS.length - 1 ? (
              <button
                type="button"
                onClick={restart}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-ink px-3 text-[13px] font-semibold text-white transition-colors hover:bg-ink-soft"
              >
                <RotateCcw size={14} aria-hidden="true" />
                Restart
              </button>
            ) : (
              <button
                type="button"
                onClick={() => go(step + 1)}
                disabled={!canAdvance}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-brand-600 px-3 text-[13px] font-semibold text-white transition-colors hover:bg-brand-700 disabled:pointer-events-none disabled:opacity-50"
              >
                Next
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {step === REVIEW_STEP && !reviewComplete && (
              <span className="text-[12px] text-muted">Resolve the flags to continue</span>
            )}
            {step < REVIEW_STEP && (
              <button
                type="button"
                onClick={() => {
                  setAutoplayArmed(true);
                  setPlaying((current) => !current);
                }}
                aria-pressed={playing}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] font-semibold text-muted transition-colors hover:bg-surface-3 hover:text-ink"
              >
                {playing ? <Pause size={13} aria-hidden="true" /> : <Play size={13} aria-hidden="true" />}
                {playing ? 'Pause' : 'Auto-play'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
