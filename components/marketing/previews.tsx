import {
  CalendarDays,
  Camera,
  Check,
  Clock3,
  Hash,
  MapPin,
  Package,
  Plus,
  Wrench,
} from 'lucide-react';
import { StatusBadge } from '@/components/workspace/status-badge';
import { formatCurrency } from '@/lib/utils';

/**
 * Accurate, sample-data previews of the real interface. These exist so the
 * marketing site shows what the product actually looks like — every value is
 * clearly a sample record, and nothing here claims a customer, a price, or an
 * approval.
 */

function Frame({
  children,
  label,
  className = '',
}: {
  children: React.ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <figure
      role="img"
      aria-label={label}
      className={`overflow-hidden rounded-xl border border-line bg-surface shadow-md ${className}`}
    >
      <div aria-hidden="true">{children}</div>
    </figure>
  );
}

function Chrome({ title, meta }: { title: string; meta?: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-line bg-surface-2/80 px-3.5 py-2.5">
      <span className="flex gap-1.5">
        <span className="h-2 w-2 rounded-full bg-line-strong" />
        <span className="h-2 w-2 rounded-full bg-line-strong" />
        <span className="h-2 w-2 rounded-full bg-line-strong" />
      </span>
      <span className="ml-2 truncate text-[11px] font-medium text-subtle">{title}</span>
      {meta && <span className="ml-auto shrink-0 font-mono text-[11px] text-faint">{meta}</span>}
    </div>
  );
}

export function TicketDocPreview({ compact = false }: { compact?: boolean }) {
  return (
    <Frame
      label="AmpTrail work ticket record showing project details, labor and material line items, and a documented total of 11,248 dollars."
      className="w-full"
    >
      <Chrome title="AmpTrail · Work ticket" meta="AT-26-0142" />
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[13px] font-semibold text-brand-700">AT-26-0142</p>
            <p className="mt-1 truncate text-[13px] font-medium text-ink">
              Reroute 4&quot; feeder around HVAC chase
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-[12px] text-muted">
              <MapPin size={12} className="shrink-0" />
              <span className="truncate">Metro Medical Center · Level 3 East</span>
            </p>
          </div>
          <StatusBadge status="ready_for_review" size="xs" />
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-2 rounded-lg border border-line bg-surface-2/60 p-2.5 text-[11px]">
          <div>
            <dt className="text-subtle">Labor</dt>
            <dd className="mt-0.5 font-mono font-semibold text-ink">$4,450.00</dd>
          </div>
          <div>
            <dt className="text-subtle">Materials</dt>
            <dd className="mt-0.5 font-mono font-semibold text-ink">$6,302.00</dd>
          </div>
          <div>
            <dt className="text-subtle">Equipment</dt>
            <dd className="mt-0.5 font-mono font-semibold text-ink">$496.60</dd>
          </div>
        </dl>

        <table className="mt-4 w-full text-[12px]">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-[0.06em] text-subtle">
              <th className="pb-1.5 font-semibold">Line item</th>
              <th className="pb-1.5 text-right font-semibold">Qty</th>
              <th className="pb-1.5 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody className="text-body">
            {[
              ['Journeyman electrician', '38 hrs', '$3,306.00'],
              ['Apprentice', '22 hrs', '$1,144.00'],
              ['3/4" EMT conduit + fittings', '64 ea', '$1,472.00'],
              ['#12 THHN copper wire', '4,200 ft', '$4,830.00'],
            ].map((row) => (
              <tr key={row[0]} className="border-t border-line">
                <td className="py-1.5 pr-2 text-ink">{row[0]}</td>
                <td className="py-1.5 text-right text-muted tabular-nums">{row[1]}</td>
                <td className="py-1.5 text-right font-mono tabular-nums text-ink">{row[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {!compact && (
          <div className="mt-4 flex items-center justify-between rounded-lg bg-ink px-3.5 py-2.5 text-white">
            <span className="text-[11px] uppercase tracking-[0.08em] text-slate-300">
              Documented total
            </span>
            <span className="font-mono text-[15px] font-semibold tabular-nums">$11,248.60</span>
          </div>
        )}
      </div>
    </Frame>
  );
}

export function EditorPreview() {
  return (
    <Frame
      label="The AmpTrail ticket editor with a labor line item being entered and a live running total."
      className="w-full"
    >
      <Chrome title="New work ticket" meta="Draft" />
      <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_9.5rem] sm:p-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-700">
            Section B · Labor
          </p>
          <div className="mt-2.5 rounded-lg border border-brand-600 bg-surface p-3 shadow-[0_0_0_3px_rgb(37_99_235_/_0.12)]">
            <div className="grid grid-cols-[minmax(0,1fr)_4.25rem_4.25rem] gap-2">
              <div>
                <p className="text-[10px] font-medium text-muted">Worker / role</p>
                <p className="mt-1 truncate rounded border border-line-strong bg-surface px-2 py-1 text-[12px] text-ink">
                  Journeyman
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-muted">Hours</p>
                <p className="mt-1 rounded border border-line-strong bg-surface px-2 py-1 text-right font-mono text-[12px] text-ink">
                  38.00
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-muted">Rate</p>
                <p className="mt-1 rounded border border-line-strong bg-surface px-2 py-1 text-right font-mono text-[12px] text-ink">
                  87.00
                </p>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
              <span className="text-[11px] text-muted">Line total</span>
              <span className="font-mono text-[12px] font-semibold text-ink">$3,306.00</span>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {['Journeyman', 'Apprentice', 'Foreman'].map((role) => (
              <span
                key={role}
                className="rounded-md border border-line bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-body"
              >
                {role}
              </span>
            ))}
          </div>

          <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[11px] font-semibold text-brand-700">
            <Plus size={12} /> Add line
          </p>
        </div>

        <div className="rounded-lg border border-line bg-surface-2/70 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-subtle">
            Running total
          </p>
          <p className="mt-1.5 font-mono text-[19px] font-semibold text-ink">$11,248.60</p>
          <dl className="mt-3 space-y-1.5 border-t border-line pt-2.5 text-[11px]">
            {[
              ['Labor', '$4,450.00'],
              ['Materials', '$6,302.00'],
              ['Equipment', '$496.60'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-2">
                <dt className="text-muted">{label}</dt>
                <dd className="font-mono text-body">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-3 flex items-center gap-1.5 rounded-md bg-success-soft px-2 py-1.5 text-[11px] font-medium text-success">
            <Check size={12} /> Ready to save
          </div>
        </div>
      </div>
    </Frame>
  );
}

export function EvidencePreview() {
  const tiles = [
    { label: 'Feeder conflict above ceiling grid', meta: 'Level 3 · 09:14' },
    { label: 'Offset installed at chase entry', meta: 'Level 3 · 11:02' },
    { label: 'Panel schedule as found', meta: 'Room 312 · 13:40' },
    { label: 'Conduit rack before drywall', meta: 'Level 3 · 14:05' },
  ];

  return (
    <Frame
      label="AmpTrail evidence gallery with four captioned jobsite photos attached to a ticket."
      className="w-full"
    >
      <Chrome title="Jobsite evidence" meta="4 photos" />
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-3">
          {tiles.map((tile, index) => (
            <div key={tile.label} className="overflow-hidden rounded-lg border border-line">
              <div className="relative aspect-[4/3] bg-surface-3">
                <div
                  className="absolute inset-0 opacity-70"
                  style={{
                    backgroundImage:
                      index % 2 === 0
                        ? 'repeating-linear-gradient(135deg, #cdd6e1 0 6px, #dde4ec 6px 12px)'
                        : 'repeating-linear-gradient(45deg, #cbd5e1 0 8px, #e2e8f0 8px 16px)',
                  }}
                />
                <span className="absolute bottom-1.5 left-1.5 grid h-6 w-6 place-items-center rounded-md bg-ink/75 text-white">
                  <Camera size={12} />
                </span>
              </div>
              <div className="px-2.5 py-2">
                <p className="line-clamp-1 text-[11.5px] font-medium text-ink">{tile.label}</p>
                <p className="mt-0.5 text-[10.5px] text-subtle">{tile.meta}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
          <Hash size={12} className="shrink-0" />
          Private bucket · signed links expire after one hour
        </p>
      </div>
    </Frame>
  );
}

export function PdfPreview() {
  return (
    <Frame
      label="A printed AmpTrail PDF work record with company header, line-item totals and blank acknowledgement signature lines."
      className="w-full"
    >
      <div className="bg-surface-3 p-3 sm:p-4">
        <div className="mx-auto max-w-[26rem] bg-surface p-4 shadow-sm sm:p-5">
          <div className="flex items-start justify-between border-b-2 border-ink pb-2.5">
            <div>
              <p className="text-[13px] font-semibold text-ink">Henderson Electric</p>
              <p className="mt-0.5 text-[10px] text-muted">
                Extra work record · Time &amp; material
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[12px] font-semibold text-ink">AT-26-0142</p>
              <p className="text-[10px] text-muted">Oct 9, 2026</p>
            </div>
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10.5px]">
            <div>
              <dt className="text-subtle">Project</dt>
              <dd className="font-medium text-ink">Metro Medical Center</dd>
            </div>
            <div>
              <dt className="text-subtle">Job number</dt>
              <dd className="font-medium text-ink">PRJ-2026-088</dd>
            </div>
            <div>
              <dt className="text-subtle">General contractor</dt>
              <dd className="font-medium text-ink">Turner Construction</dd>
            </div>
            <div>
              <dt className="text-subtle">Directed by</dt>
              <dd className="font-medium text-ink">J. Doe, Superintendent</dd>
            </div>
          </dl>

          <table className="mt-3.5 w-full text-[10.5px]">
            <thead>
              <tr className="border-y border-line bg-surface-2 text-left text-[9px] uppercase tracking-[0.06em] text-subtle">
                <th className="py-1.5 pl-2 font-semibold">Description</th>
                <th className="py-1.5 text-right font-semibold">Qty</th>
                <th className="py-1.5 pr-2 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody className="text-body">
              {[
                ['Journeyman electrician', '38 hrs', '$3,306.00'],
                ['3/4" EMT conduit + fittings', '64 ea', '$1,472.00'],
                ['#12 THHN copper wire', '4,200 ft', '$4,830.00'],
              ].map((row) => (
                <tr key={row[0]} className="border-b border-line">
                  <td className="py-1.5 pl-2 text-ink">{row[0]}</td>
                  <td className="py-1.5 text-right tabular-nums">{row[1]}</td>
                  <td className="py-1.5 pr-2 text-right font-mono tabular-nums text-ink">
                    {row[2]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-2 flex justify-end">
            <div className="w-40 text-[10.5px]">
              <div className="flex justify-between py-0.5">
                <span className="text-subtle">Subtotal</span>
                <span className="font-mono text-body">$9,608.00</span>
              </div>
              <div className="mt-1 flex items-center justify-between border-t border-ink pt-1">
                <span className="font-semibold text-ink">Total</span>
                <span className="font-mono text-[12px] font-semibold text-ink">$11,248.60</span>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-3">
            {['Performed by', 'Acknowledged by'].map((role) => (
              <div key={role}>
                <p className="border-t border-dashed border-line-strong pt-1.5 text-[9.5px] text-subtle">
                  {role} · signature
                </p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[9px] leading-4 text-subtle">
            Signature lines are printed blank. AmpTrail does not record or imply an approval.
          </p>
        </div>
      </div>
    </Frame>
  );
}

export function DashboardPreview() {
  return (
    <Frame
      label="The AmpTrail overview screen with documented work value, open tickets, active projects and a recent ticket table."
      className="w-full"
    >
      <Chrome title="Overview" meta="5 tickets" />
      <div className="space-y-3 p-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            ['Documented work value', '$48,290.00'],
            ['Open tickets', '5'],
            ['Active projects', '3'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-line bg-surface p-2.5">
              <p className="text-[10px] text-muted">{label}</p>
              <p className="mt-1 font-mono text-[14px] font-semibold text-ink">{value}</p>
            </div>
          ))}
        </div>
        <div className="overflow-hidden rounded-lg border border-line">
          <div className="flex items-center gap-3 border-b border-line bg-surface-2/80 px-3 py-2 text-[10px] uppercase tracking-[0.06em] text-subtle">
            <span className="w-20 font-semibold">Ticket</span>
            <span className="flex-1 font-semibold">Project</span>
            <span className="font-semibold">Documented</span>
          </div>
          {[
            ['AT-26-0142', 'Metro Medical Center', 'ready_for_review', '$11,248.60'],
            ['AT-26-0141', 'Harborview Tech Campus', 'approved', '$8,410.00'],
            ['AT-26-0139', 'Lakeside Distribution Hub', 'ready_to_export', '$3,180.50'],
          ].map(([number, project, status, total]) => (
            <div
              key={number}
              className="flex items-center gap-3 border-b border-line px-3 py-2 text-[11.5px] last:border-0"
            >
              <span className="w-20 font-mono text-brand-700">{number}</span>
              <span className="flex-1 truncate text-ink">{project}</span>
              <StatusBadge status={status} size="xs" />
              <span className="font-mono font-semibold text-ink">{total}</span>
            </div>
          ))}
        </div>
      </div>
    </Frame>
  );
}

export function PreviewLegend() {
  return (
    <p className="flex items-center gap-1.5 text-[11.5px] text-muted">
      <Clock3 size={12} className="shrink-0" />
      Sample record — shown to illustrate the interface, not real customer data.
    </p>
  );
}

export function LineItemChips() {
  return (
    <div className="flex flex-wrap items-center gap-2 text-[11.5px] text-muted">
      <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-2 py-1 font-medium text-body">
        <Clock3 size={12} className="text-brand-600" /> Labor
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-2 py-1 font-medium text-body">
        <Package size={12} className="text-brand-600" /> Materials
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-2 py-1 font-medium text-body">
        <Wrench size={12} className="text-brand-600" /> Equipment
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-2 py-1 font-medium text-body">
        <CalendarDays size={12} className="text-brand-600" /> Work date
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-2 py-1 font-medium text-body">
        <Camera size={12} className="text-brand-600" /> Photos
      </span>
    </div>
  );
}

export const sampleTotal = formatCurrency(11627);
