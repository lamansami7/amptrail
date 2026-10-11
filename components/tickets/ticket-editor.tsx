'use client';

import { useEffect, useMemo, useState } from 'react';
import { useActionState } from 'react';
import {
  Plus,
  Trash2,
  LoaderCircle,
  Info,
  AlertCircle,
} from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/button';
import { saveTicketAction, type TicketActionState } from '@/lib/actions/tickets';
import { calculateTicketTotals, laborLineTotal, costLineTotal } from '@/lib/tickets/totals';
import { formatCurrency, formatDateTimeLocal } from '@/lib/utils';
import { ticketStatusOptions } from '@/lib/tickets/status';

type LaborDraft = { worker_name: string; hours: string; rate: string };
type CostDraft = { description: string; quantity: string; unit_cost: string };

export type TicketEditorData = {
  id?: string;
  project_id?: string;
  occurred_at?: string;
  location?: string | null;
  description?: string;
  out_of_scope_reason?: string | null;
  status?: string;
  gc_representative?: string | null;
  notes?: string | null;
};

const commonRoles = ['Journeyman', 'Apprentice', 'Foreman', 'Master Electrician', 'Helper'];

export function TicketEditor({
  projects,
  ticket,
  labor: initialLabor = [],
  materials: initialMaterials = [],
  costs: initialCosts = [],
}: {
  projects: Array<{ id: string; name: string; project_number: string | null }>;
  ticket?: TicketEditorData;
  labor?: Array<{ worker_name: string; hours: number; rate: number }>;
  materials?: Array<{ description: string; quantity: number; unit_cost: number }>;
  costs?: Array<{ description: string; quantity: number; unit_cost: number }>;
}) {
  const [state, formAction, pending] = useActionState(saveTicketAction, {} as TicketActionState);

  // Default occurred_at to now or provided date
  const [occurredAt, setOccurredAt] = useState('');
  useEffect(() => {
    setOccurredAt(formatDateTimeLocal(ticket?.occurred_at));
  }, [ticket?.occurred_at]);

  const occurredAtIso = useMemo(() => {
    const date = new Date(occurredAt);
    return occurredAt && !Number.isNaN(date.getTime()) ? date.toISOString() : '';
  }, [occurredAt]);

  const [labor, setLabor] = useState<LaborDraft[]>(
    initialLabor.length > 0
      ? initialLabor.map((row) => ({
          worker_name: row.worker_name,
          hours: String(row.hours),
          rate: String(row.rate),
        }))
      : [{ worker_name: '', hours: '', rate: '' }]
  );

  const [materials, setMaterials] = useState<CostDraft[]>(
    initialMaterials.length > 0
      ? initialMaterials.map((row) => ({
          description: row.description,
          quantity: String(row.quantity),
          unit_cost: String(row.unit_cost),
        }))
      : []
  );

  const [costs, setCosts] = useState<CostDraft[]>(
    initialCosts.length > 0
      ? initialCosts.map((row) => ({
          description: row.description,
          quantity: String(row.quantity),
          unit_cost: String(row.unit_cost),
        }))
      : []
  );

  const [isDirty, setIsDirty] = useState(false);

  // Unsaved changes alert
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !pending) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, pending]);

  // Live Totals
  const totals = useMemo(
    () =>
      calculateTicketTotals({
        labor: labor
          .filter((row) => row.worker_name || row.hours || row.rate)
          .map((row) => ({ hours: Number(row.hours) || 0, rate: Number(row.rate) || 0 })),
        materials: materials
          .filter((row) => row.description || row.quantity || row.unit_cost)
          .map((row) => ({ quantity: Number(row.quantity) || 0, unit_cost: Number(row.unit_cost) || 0 })),
        costs: costs
          .filter((row) => row.description || row.quantity || row.unit_cost)
          .map((row) => ({ quantity: Number(row.quantity) || 0, unit_cost: Number(row.unit_cost) || 0 })),
      }),
    [labor, materials, costs]
  );

  const jsonLabor = labor
    .filter((row) => row.worker_name.trim() || row.hours || row.rate)
    .map((row) => ({ worker_name: row.worker_name.trim(), hours: row.hours, rate: row.rate }));
  const jsonMaterials = materials
    .filter((row) => row.description.trim() || row.quantity || row.unit_cost)
    .map((row) => ({ description: row.description.trim(), quantity: row.quantity, unit_cost: row.unit_cost }));
  const jsonCosts = costs
    .filter((row) => row.description.trim() || row.quantity || row.unit_cost)
    .map((row) => ({ description: row.description.trim(), quantity: row.quantity, unit_cost: row.unit_cost }));

  return (
    <form
      action={formAction}
      onSubmit={() => setIsDirty(false)}
      onChange={() => setIsDirty(true)}
      className="space-y-6 pb-24"
    >
      {ticket?.id && <input type="hidden" name="id" value={ticket.id} />}
      <input type="hidden" name="occurred_at" value={occurredAtIso} />
      <input type="hidden" name="labor" value={JSON.stringify(jsonLabor)} />
      <input type="hidden" name="materials" value={JSON.stringify(jsonMaterials)} />
      <input type="hidden" name="costs" value={JSON.stringify(jsonCosts)} />

      {state.error && (
        <div
          className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 shadow-xs"
          role="alert"
        >
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{state.error}</span>
          </div>
        </div>
      )}

      {/* SECTION A — WORK DETAILS */}
      <section className="card p-6 sm:p-7">
        <div className="mb-5 border-b border-slate-100 pb-4">
          <p className="eyebrow">Section A · Work Details</p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">What happened on the jobsite?</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Document the location, crew observation, and direction received from the customer or general contractor.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Project */}
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="project_id">
              Project <span className="text-blue-600">*</span>
            </label>
            <select
              className="field-control"
              id="project_id"
              name="project_id"
              required
              defaultValue={ticket?.project_id || ''}
            >
              <option value="" disabled>
                Select active project...
              </option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} {project.project_number ? `(${project.project_number})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Time */}
          <div>
            <label className="field-label" htmlFor="occurred_at">
              Date & Time Performed <span className="text-blue-600">*</span>
            </label>
            <input
              className="field-control"
              id="occurred_at"
              name="occurred_at_local"
              type="datetime-local"
              required
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
            />
          </div>

          {/* Location / Area */}
          <div>
            <label className="field-label" htmlFor="location">
              Jobsite Location / Area
            </label>
            <input
              className="field-control"
              id="location"
              name="location"
              maxLength={250}
              defaultValue={ticket?.location || ''}
              placeholder="e.g. 3rd Floor East Wing, Room 304, Electrical Closet B"
            />
          </div>

          {/* Extra Work Description */}
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="description">
              Extra Work Description <span className="text-blue-600">*</span>
            </label>
            <textarea
              className="field-control min-h-32 resize-y"
              id="description"
              name="description"
              required
              maxLength={12000}
              placeholder="Describe the exact work performed by your crew, including unexpected field conditions, changes from drawings, and materials relocated..."
              defaultValue={ticket?.description || ''}
            />
            <p className="field-hint">
              Be precise. Clear field descriptions eliminate disputes when customer reviews ticket records.
            </p>
          </div>

          {/* Reason Outside Original Scope */}
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="out_of_scope_reason">
              Reason Outside Original Scope
            </label>
            <textarea
              className="field-control min-h-24 resize-y"
              id="out_of_scope_reason"
              name="out_of_scope_reason"
              maxLength={6000}
              placeholder="e.g. Existing HVAC duct conflict not shown on electrical contract drawings E-201. Verbal direction by GC superintendent John Doe to reroute conduit through chase."
              defaultValue={ticket?.out_of_scope_reason || ''}
            />
            <p className="field-hint">
              Explain why this work is outside the base contract and warrants documented time and material tracking.
            </p>
          </div>

          {/* GC / Customer Rep */}
          <div>
            <label className="field-label" htmlFor="gc_representative">
              Customer / GC Representative
            </label>
            <input
              className="field-control"
              id="gc_representative"
              name="gc_representative"
              maxLength={180}
              defaultValue={ticket?.gc_representative || ''}
              placeholder="e.g. John Doe (Superintendent)"
            />
            <p className="field-hint">Name of person who directed or verified the work.</p>
          </div>

          {/* Status */}
          <div>
            <label className="field-label" htmlFor="status">
              Tracking Status
            </label>
            <select
              className="field-control"
              id="status"
              name="status"
              defaultValue={ticket?.status || 'draft'}
            >
              {ticketStatusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
            <p className="field-hint">Internal workflow tracking stage.</p>
          </div>

          {/* Additional Notes */}
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="notes">
              Additional Field Notes
            </label>
            <textarea
              className="field-control min-h-20 resize-y"
              id="notes"
              name="notes"
              maxLength={12000}
              placeholder="Safety considerations, weather, standby time, or other relevant observations..."
              defaultValue={ticket?.notes || ''}
            />
          </div>
        </div>
      </section>

      {/* SECTION B — LABOR */}
      <section className="card p-6 sm:p-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <p className="eyebrow">Section B · Labor</p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">Crew Time & Rates</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Record workers or job classifications, hours, and standard hourly rates.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setLabor((rows) => [...rows, { worker_name: '', hours: '', rate: '' }])
            }
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-blue-600 shadow-xs hover:bg-slate-50 transition"
          >
            <Plus size={14} /> Add Worker / Role
          </button>
        </div>

        {labor.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
            No labor entries added yet. Click &ldquo;Add Worker / Role&rdquo; to track hours.
          </div>
        ) : (
          <div className="space-y-3">
            {labor.map((row, index) => {
              const lineTotal = laborLineTotal({
                hours: Number(row.hours) || 0,
                rate: Number(row.rate) || 0,
              });
              return (
                <div
                  key={`labor-${index}`}
                  className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 transition hover:border-slate-300"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 pb-2">
                    <span className="font-bold text-slate-700">Line {index + 1}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-slate-900">
                        Line: {formatCurrency(lineTotal)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setLabor((rows) => rows.filter((_, i) => i !== index))}
                        aria-label={`Remove labor line ${index + 1}`}
                        className="grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[1.5fr_0.8fr_0.8fr]">
                    <div>
                      <label
                        className="field-label text-[11px]"
                        htmlFor={`labor-name-${index}`}
                      >
                        Worker / Role <span className="text-blue-600">*</span>
                      </label>
                      <input
                        id={`labor-name-${index}`}
                        className="field-control min-h-9 px-3 py-1.5 text-xs sm:text-sm"
                        required
                        maxLength={160}
                        value={row.worker_name}
                        onChange={(e) =>
                          setLabor((rows) =>
                            rows.map((item, i) =>
                              i === index ? { ...item, worker_name: e.target.value } : item
                            )
                          )
                        }
                        placeholder="e.g. Journeyman Electrician"
                      />
                      {/* Quick Role Suggestions */}
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {commonRoles.map((role) => (
                          <button
                            key={role}
                            type="button"
                            onClick={() =>
                              setLabor((rows) =>
                                rows.map((item, i) =>
                                  i === index ? { ...item, worker_name: role } : item
                                )
                              )
                            }
                            className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-500 ring-1 ring-inset ring-slate-200 hover:bg-slate-100 hover:text-slate-900"
                          >
                            + {role}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label
                        className="field-label text-[11px]"
                        htmlFor={`labor-hours-${index}`}
                      >
                        Hours <span className="text-blue-600">*</span>
                      </label>
                      <input
                        id={`labor-hours-${index}`}
                        className="field-control min-h-9 px-3 py-1.5 text-xs sm:text-sm font-mono"
                        type="number"
                        required
                        min="0.01"
                        max="10000"
                        step="0.01"
                        value={row.hours}
                        onChange={(e) =>
                          setLabor((rows) =>
                            rows.map((item, i) =>
                              i === index ? { ...item, hours: e.target.value } : item
                            )
                          )
                        }
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label
                        className="field-label text-[11px]"
                        htmlFor={`labor-rate-${index}`}
                      >
                        Rate ($ / hr) <span className="text-blue-600">*</span>
                      </label>
                      <input
                        id={`labor-rate-${index}`}
                        className="field-control min-h-9 px-3 py-1.5 text-xs sm:text-sm font-mono"
                        type="number"
                        required
                        min="0"
                        max="1000000"
                        step="0.01"
                        value={row.rate}
                        onChange={(e) =>
                          setLabor((rows) =>
                            rows.map((item, i) =>
                              i === index ? { ...item, rate: e.target.value } : item
                            )
                          )
                        }
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
          <span className="font-semibold text-slate-500">Labor Subtotal</span>
          <span className="font-mono text-sm font-bold text-slate-900 tabular-nums">
            {formatCurrency(totals.labor)}
          </span>
        </div>
      </section>

      {/* SECTION C — MATERIALS */}
      <section className="card p-6 sm:p-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <p className="eyebrow">Section C · Materials</p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">Materials & Supplies</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Document conduit, wire, fittings, boxes, and fasteners installed during extra work.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setMaterials((rows) => [...rows, { description: '', quantity: '', unit_cost: '' }])
            }
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-blue-600 shadow-xs hover:bg-slate-50 transition"
          >
            <Plus size={14} /> Add Material Line
          </button>
        </div>

        {materials.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
            No materials recorded. Click &ldquo;Add Material Line&rdquo; to log items used.
          </div>
        ) : (
          <div className="space-y-3">
            {materials.map((row, index) => {
              const lineTotal = costLineTotal({
                quantity: Number(row.quantity) || 0,
                unit_cost: Number(row.unit_cost) || 0,
              });
              return (
                <div
                  key={`mat-${index}`}
                  className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 transition hover:border-slate-300"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 pb-2">
                    <span className="font-bold text-slate-700">Line {index + 1}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-slate-900">
                        Line: {formatCurrency(lineTotal)}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setMaterials((rows) => rows.filter((_, i) => i !== index))
                        }
                        aria-label={`Remove material line ${index + 1}`}
                        className="grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[1.5fr_0.8fr_0.8fr]">
                    <div>
                      <label
                        className="field-label text-[11px]"
                        htmlFor={`mat-desc-${index}`}
                      >
                        Material Description <span className="text-blue-600">*</span>
                      </label>
                      <input
                        id={`mat-desc-${index}`}
                        className="field-control min-h-9 px-3 py-1.5 text-xs sm:text-sm"
                        required
                        maxLength={240}
                        value={row.description}
                        onChange={(e) =>
                          setMaterials((rows) =>
                            rows.map((item, i) =>
                              i === index ? { ...item, description: e.target.value } : item
                            )
                          )
                        }
                        placeholder="e.g. 3/4 inch EMT Conduit (10 ft stick)"
                      />
                    </div>

                    <div>
                      <label
                        className="field-label text-[11px]"
                        htmlFor={`mat-qty-${index}`}
                      >
                        Quantity <span className="text-blue-600">*</span>
                      </label>
                      <input
                        id={`mat-qty-${index}`}
                        className="field-control min-h-9 px-3 py-1.5 text-xs sm:text-sm font-mono"
                        type="number"
                        required
                        min="0.001"
                        max="1000000"
                        step="0.001"
                        value={row.quantity}
                        onChange={(e) =>
                          setMaterials((rows) =>
                            rows.map((item, i) =>
                              i === index ? { ...item, quantity: e.target.value } : item
                            )
                          )
                        }
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label
                        className="field-label text-[11px]"
                        htmlFor={`mat-cost-${index}`}
                      >
                        Unit Cost ($) <span className="text-blue-600">*</span>
                      </label>
                      <input
                        id={`mat-cost-${index}`}
                        className="field-control min-h-9 px-3 py-1.5 text-xs sm:text-sm font-mono"
                        type="number"
                        required
                        min="0"
                        max="1000000"
                        step="0.01"
                        value={row.unit_cost}
                        onChange={(e) =>
                          setMaterials((rows) =>
                            rows.map((item, i) =>
                              i === index ? { ...item, unit_cost: e.target.value } : item
                            )
                          )
                        }
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
          <span className="font-semibold text-slate-500">Materials Subtotal</span>
          <span className="font-mono text-sm font-bold text-slate-900 tabular-nums">
            {formatCurrency(totals.materials)}
          </span>
        </div>
      </section>

      {/* SECTION D — EQUIPMENT & OTHER COSTS */}
      <section className="card p-6 sm:p-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <p className="eyebrow">Section D · Equipment & Other Costs</p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">Equipment, Rentals & Direct Costs</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Scissor lifts, boom rentals, core drilling, disposal fees, or specialty test gear.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setCosts((rows) => [...rows, { description: '', quantity: '', unit_cost: '' }])
            }
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-blue-600 shadow-xs hover:bg-slate-50 transition"
          >
            <Plus size={14} /> Add Cost Item
          </button>
        </div>

        {costs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
            No equipment or miscellaneous costs. These entries are optional.
          </div>
        ) : (
          <div className="space-y-3">
            {costs.map((row, index) => {
              const lineTotal = costLineTotal({
                quantity: Number(row.quantity) || 0,
                unit_cost: Number(row.unit_cost) || 0,
              });
              return (
                <div
                  key={`cost-${index}`}
                  className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 transition hover:border-slate-300"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 pb-2">
                    <span className="font-bold text-slate-700">Line {index + 1}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-slate-900">
                        Line: {formatCurrency(lineTotal)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCosts((rows) => rows.filter((_, i) => i !== index))}
                        aria-label={`Remove cost line ${index + 1}`}
                        className="grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[1.5fr_0.8fr_0.8fr]">
                    <div>
                      <label
                        className="field-label text-[11px]"
                        htmlFor={`cost-desc-${index}`}
                      >
                        Description <span className="text-blue-600">*</span>
                      </label>
                      <input
                        id={`cost-desc-${index}`}
                        className="field-control min-h-9 px-3 py-1.5 text-xs sm:text-sm"
                        required
                        maxLength={240}
                        value={row.description}
                        onChange={(e) =>
                          setCosts((rows) =>
                            rows.map((item, i) =>
                              i === index ? { ...item, description: e.target.value } : item
                            )
                          )
                        }
                        placeholder="e.g. Electric scissor lift day rental"
                      />
                    </div>

                    <div>
                      <label
                        className="field-label text-[11px]"
                        htmlFor={`cost-qty-${index}`}
                      >
                        Quantity <span className="text-blue-600">*</span>
                      </label>
                      <input
                        id={`cost-qty-${index}`}
                        className="field-control min-h-9 px-3 py-1.5 text-xs sm:text-sm font-mono"
                        type="number"
                        required
                        min="0.001"
                        max="1000000"
                        step="0.001"
                        value={row.quantity}
                        onChange={(e) =>
                          setCosts((rows) =>
                            rows.map((item, i) =>
                              i === index ? { ...item, quantity: e.target.value } : item
                            )
                          )
                        }
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label
                        className="field-label text-[11px]"
                        htmlFor={`cost-cost-${index}`}
                      >
                        Unit Cost ($) <span className="text-blue-600">*</span>
                      </label>
                      <input
                        id={`cost-cost-${index}`}
                        className="field-control min-h-9 px-3 py-1.5 text-xs sm:text-sm font-mono"
                        type="number"
                        required
                        min="0"
                        max="1000000"
                        step="0.01"
                        value={row.unit_cost}
                        onChange={(e) =>
                          setCosts((rows) =>
                            rows.map((item, i) =>
                              i === index ? { ...item, unit_cost: e.target.value } : item
                            )
                          )
                        }
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
          <span className="font-semibold text-slate-500">Other Subtotal</span>
          <span className="font-mono text-sm font-bold text-slate-900 tabular-nums">
            {formatCurrency(totals.other)}
          </span>
        </div>
      </section>

      {/* SECTION E — REVIEW & TOTALS */}
      <section className="rounded-2xl border border-slate-900 bg-slate-900 p-6 text-white shadow-md sm:p-7">
        <div className="flex items-start gap-2.5 text-xs leading-5 text-slate-300">
          <Info size={16} className="mt-0.5 shrink-0 text-blue-400" />
          <span>
            Documented totals reflect field data captured by your crew. They are intended for billing preparation and tracking, and do not guarantee customer signoff or formal approval.
          </span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-800 pt-5 sm:grid-cols-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Labor</p>
            <p className="mt-1 font-mono text-base font-bold text-white tabular-nums">
              {formatCurrency(totals.labor)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Materials</p>
            <p className="mt-1 font-mono text-base font-bold text-white tabular-nums">
              {formatCurrency(totals.materials)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Other</p>
            <p className="mt-1 font-mono text-base font-bold text-white tabular-nums">
              {formatCurrency(totals.other)}
            </p>
          </div>
          <div className="col-span-2 border-t border-slate-800 pt-3 sm:col-span-1 sm:border-0 sm:pt-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
              Documented Total
            </p>
            <p className="mt-1 font-mono text-xl font-black text-white sm:text-2xl tabular-nums">
              {formatCurrency(totals.total)}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:justify-end">
          <ButtonLink
            href={ticket?.id ? `/tickets/${ticket.id}` : '/tickets'}
            variant="quiet"
            className="text-slate-300 hover:text-white"
          >
            Cancel
          </ButtonLink>
          <Button
            type="submit"
            disabled={pending}
            className="min-w-44 bg-blue-600 text-white hover:bg-blue-500"
          >
            {pending && <LoaderCircle size={15} className="animate-spin" />}
            {pending ? 'Saving Record…' : ticket ? 'Save Changes' : 'Create Work Ticket'}
          </Button>
        </div>
      </section>

      {/* Sticky Mobile Summary Bar */}
      <div className="no-print fixed inset-x-0 bottom-14 z-30 border-t border-slate-200 bg-white/95 p-3 backdrop-blur-md shadow-lg sm:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Documented Total
            </p>
            <p className="font-mono text-sm font-black text-slate-900 tabular-nums">
              {formatCurrency(totals.total)}
            </p>
          </div>
          <Button type="submit" disabled={pending} size="sm" className="min-w-32">
            {pending && <LoaderCircle size={14} className="animate-spin" />}
            {pending ? 'Saving…' : ticket ? 'Save Ticket' : 'Create Ticket'}
          </Button>
        </div>
      </div>
    </form>
  );
}
