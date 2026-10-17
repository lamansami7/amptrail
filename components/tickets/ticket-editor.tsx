'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useActionState } from 'react';
import { Clock3, Package, Plus, Trash2, Wrench } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Card, CardHeader } from '@/components/ui/card';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { saveTicketAction, type TicketActionState } from '@/lib/actions/tickets';
import { calculateTicketTotals, costLineTotal, laborLineTotal } from '@/lib/tickets/totals';
import { formatCurrency, formatDateTimeLocal } from '@/lib/utils';
import { selectableStatuses } from '@/lib/tickets/status';
import { cn } from '@/lib/utils';

type LaborDraft = { key: string; worker_name: string; hours: string; rate: string };
type CostDraft = { key: string; description: string; quantity: string; unit_cost: string };

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

const commonRoles = ['Journeyman', 'Apprentice', 'Foreman', 'Master electrician', 'Helper'];
const commonEquipment = ['Scissor lift', 'Boom lift', 'Core drilling', 'Disposal fee', 'Test equipment'];

/**
 * Row keys must be identical on the server and on the first client render or
 * React throws a hydration mismatch and every label points at the wrong input.
 * Initial rows therefore use deterministic keys, and keys for rows the user
 * adds later come from a client-only counter (those rows never render on the
 * server).
 */
function blankLabor(key: string): LaborDraft {
  return { key, worker_name: '', hours: '', rate: '' };
}

function blankCost(key: string): CostDraft {
  return { key, description: '', quantity: '', unit_cost: '' };
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

const sections = [
  { id: 'details', label: 'Work details' },
  { id: 'labor', label: 'Labor' },
  { id: 'materials', label: 'Materials' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'review', label: 'Review & save' },
] as const;

/** Shared chrome for each numbered section of the ticket. */
function Section({
  id,
  index,
  title,
  description,
  icon,
  aside,
  children,
}: {
  id: string;
  index: number;
  title: string;
  description: string;
  icon?: React.ReactNode;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card as="section" flush id={id} className="scroll-mt-24">
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <span className="grid h-5 w-5 place-items-center rounded-md bg-surface-3 font-mono text-[11px] font-semibold text-body">
              {index}
            </span>
            {title}
          </span>
        }
        description={description}
        icon={icon}
        bordered
        action={aside}
      />
      <div className="p-5 sm:p-6">{children}</div>
    </Card>
  );
}

/** Editable list of cost lines — shared by materials and equipment sections. */
function CostLines({
  rows,
  setRows,
  baseId,
  descriptionLabel,
  descriptionPlaceholder,
  quantityLabel,
  unitLabel,
  emptyText,
  suggestions,
  addLabel,
}: {
  rows: CostDraft[];
  setRows: React.Dispatch<React.SetStateAction<CostDraft[]>>;
  baseId: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  quantityLabel: string;
  unitLabel: string;
  emptyText: string;
  suggestions?: string[];
  addLabel: string;
}) {
  // Client-only counter: rows created here never render on the server, so the
  // keys stay hydration-safe while remaining unique.
  const addedRows = useRef(0);

  function update(key: string, patch: Partial<CostDraft>) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  return (
    <div className="space-y-3">
      {rows.length === 0 && (
        <p className="rounded-lg border border-dashed border-line-strong bg-surface-2/60 px-4 py-6 text-center text-[13px] text-muted">
          {emptyText}
        </p>
      )}

      {rows.map((row, index) => {
        const lineTotal = costLineTotal({
          quantity: toNumber(row.quantity),
          unit_cost: toNumber(row.unit_cost),
        });
        return (
          <div
            key={row.key}
            className="rounded-xl border border-line bg-surface-2/40 p-4 transition-colors duration-150 focus-within:border-brand-300 focus-within:bg-surface"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-subtle">
                Line {index + 1}
              </span>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[13px] font-semibold text-ink tabular-nums">
                  {formatCurrency(lineTotal)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  iconOnly
                  onClick={() => setRows((current) => current.filter((item) => item.key !== row.key))}
                  aria-label={`Remove line ${index + 1}`}
                  title="Remove this line"
                  className="text-subtle hover:bg-danger-soft hover:text-danger"
                >
                  <Trash2 size={14} aria-hidden="true" />
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,0.7fr)_minmax(0,0.8fr)]">
              <Field id={`${baseId}-desc-${row.key}`} label={descriptionLabel} required>
                {(props) => (
                  <Input
                    {...props}
                    value={row.description}
                    onChange={(event) => update(row.key, { description: event.target.value })}
                    maxLength={240}
                    placeholder={descriptionPlaceholder}
                    enterKeyHint="next"
                  />
                )}
              </Field>

              <Field id={`${baseId}-qty-${row.key}`} label={quantityLabel} required>
                {(props) => (
                  <Input
                    {...props}
                    type="number"
                    inputMode="decimal"
                    min="0.001"
                    max="1000000"
                    step="0.001"
                    value={row.quantity}
                    onChange={(event) => update(row.key, { quantity: event.target.value })}
                    placeholder="0"
                    className="text-right font-mono tabular-nums"
                  />
                )}
              </Field>

              <Field id={`${baseId}-cost-${row.key}`} label={unitLabel} required>
                {(props) => (
                  <Input
                    {...props}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max="1000000"
                    step="0.01"
                    value={row.unit_cost}
                    onChange={(event) => update(row.key, { unit_cost: event.target.value })}
                    placeholder="0.00"
                    className="text-right font-mono tabular-nums"
                  />
                )}
              </Field>
            </div>

            {suggestions && index >= 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => update(row.key, { description: suggestion })}
                    className="rounded-md border border-line bg-surface px-2 py-0.5 text-[11.5px] font-medium text-muted transition-colors duration-150 hover:border-line-strong hover:text-ink"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <Button
        type="button"
        variant="secondary"
        onClick={() =>
          setRows((current) => {
            addedRows.current += 1;
            return [...current, blankCost(`${baseId}-new-${addedRows.current}`)];
          })
        }
        className="w-full border-dashed"
      >
        <Plus size={15} aria-hidden="true" />
        {addLabel}
      </Button>
    </div>
  );
}

export function TicketEditor({
  projects,
  ticket,
  labor: initialLabor = [],
  materials: initialMaterials = [],
  costs: initialCosts = [],
  submissionId,
}: {
  projects: Array<{ id: string; name: string; project_number: string | null }>;
  ticket?: TicketEditorData;
  /** When set, saving this new ticket also closes the inbox submission it came from. */
  submissionId?: string;
  labor?: Array<{ worker_name: string; hours: number; rate: number }>;
  materials?: Array<{ description: string; quantity: number; unit_cost: number }>;
  costs?: Array<{ description: string; quantity: number; unit_cost: number }>;
}) {
  const [state, formAction, pending] = useActionState(saveTicketAction, {} as TicketActionState);
  const uid = useId();
  const addedRows = useRef(0);
  function nextRowKey(prefix: string) {
    addedRows.current += 1;
    return `${prefix}-new-${addedRows.current}`;
  }
  const errorRef = useRef<HTMLDivElement>(null);

  const [occurredAt, setOccurredAt] = useState('');
  useEffect(() => {
    setOccurredAt(formatDateTimeLocal(ticket?.occurred_at));
  }, [ticket?.occurred_at]);

  const occurredAtIso = useMemo(() => {
    const date = new Date(occurredAt);
    return occurredAt && !Number.isNaN(date.getTime()) ? date.toISOString() : '';
  }, [occurredAt]);

  const [laborRows, setLaborRows] = useState<LaborDraft[]>(() =>
    initialLabor.length
      ? initialLabor.map((row, index) => ({
          key: `labor-${index}`,
          worker_name: row.worker_name,
          hours: String(row.hours),
          rate: String(row.rate),
        }))
      : [blankLabor('labor-0')]
  );

  const [materialRows, setMaterialRows] = useState<CostDraft[]>(() =>
    initialMaterials.map((row, index) => ({
      key: `material-${index}`,
      description: row.description,
      quantity: String(row.quantity),
      unit_cost: String(row.unit_cost),
    }))
  );

  const [costRows, setCostRows] = useState<CostDraft[]>(() =>
    initialCosts.map((row, index) => ({
      key: `cost-${index}`,
      description: row.description,
      quantity: String(row.quantity),
      unit_cost: String(row.unit_cost),
    }))
  );

  const [dirty, setDirty] = useState(false);

  // Warn before leaving with unsaved edits (browser-visible protection).
  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (dirty && !pending) {
        event.preventDefault();
        event.returnValue = '';
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty, pending]);

  // Surface server-side validation failures where the eye already is.
  useEffect(() => {
    if (state.error) {
      errorRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      errorRef.current?.focus();
    }
  }, [state.error]);

  const describedLabor = laborRows.filter(
    (row) => row.worker_name.trim() || row.hours || row.rate
  );
  const describedMaterials = materialRows.filter(
    (row) => row.description.trim() || row.quantity || row.unit_cost
  );
  const describedCosts = costRows.filter(
    (row) => row.description.trim() || row.quantity || row.unit_cost
  );

  // Recalculated on every keystroke; the arithmetic is intentionally cheap and
  // shares the exact helpers used for saving, the detail page and the PDF.
  const totals = calculateTicketTotals({
    labor: describedLabor.map((row) => ({
      hours: toNumber(row.hours),
      rate: toNumber(row.rate),
    })),
    materials: describedMaterials.map((row) => ({
      quantity: toNumber(row.quantity),
      unit_cost: toNumber(row.unit_cost),
    })),
    costs: describedCosts.map((row) => ({
      quantity: toNumber(row.quantity),
      unit_cost: toNumber(row.unit_cost),
    })),
  });

  const laborHours = describedLabor.reduce((sum, row) => sum + toNumber(row.hours), 0);
  const lineCount = describedLabor.length + describedMaterials.length + describedCosts.length;

  const payload = {
    labor: describedLabor.map((row) => ({
      worker_name: row.worker_name.trim(),
      hours: row.hours,
      rate: row.rate,
    })),
    materials: describedMaterials.map((row) => ({
      description: row.description.trim(),
      quantity: row.quantity,
      unit_cost: row.unit_cost,
    })),
    costs: describedCosts.map((row) => ({
      description: row.description.trim(),
      quantity: row.quantity,
      unit_cost: row.unit_cost,
    })),
  };

  const saveLabel = ticket?.id ? 'Save changes' : 'Create work ticket';
  const cancelHref = ticket?.id ? `/tickets/${ticket.id}` : '/tickets';

  return (
    <form
      action={formAction}
      onChange={() => setDirty(true)}
      onSubmit={() => setDirty(false)}
      className="pb-40 lg:pb-0"
    >
      {ticket?.id && <input type="hidden" name="id" value={ticket.id} />}
      {submissionId && !ticket?.id && <input type="hidden" name="submission_id" value={submissionId} />}
      <input type="hidden" name="occurred_at" value={occurredAtIso} />
      <input type="hidden" name="labor" value={JSON.stringify(payload.labor)} />
      <input type="hidden" name="materials" value={JSON.stringify(payload.materials)} />
      <input type="hidden" name="costs" value={JSON.stringify(payload.costs)} />

      {/* Section jump bar */}
      <nav aria-label="Ticket sections" className="mb-5 flex gap-1.5 overflow-x-auto pb-1">
        {sections.map((section, index) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 text-[12.5px] font-medium text-body shadow-xs transition-colors duration-150 hover:border-line-strong hover:text-ink"
          >
            <span className="font-mono text-[11px] text-faint">{index + 1}</span>
            {section.label}
          </a>
        ))}
      </nav>

      {ticket?.status === 'finalized' && (
        <div className="mb-5">
          <Alert tone="info" title="This ticket is finalized and locked">
            Changes are blocked until you move it out of Finalized. Choose another status below and
            save to reopen it; the change is recorded in the activity history.
          </Alert>
        </div>
      )}

      {state.error && (
        <div ref={errorRef} tabIndex={-1} className="mb-5 outline-none">
          <Alert tone="danger" role="alert" title="This ticket was not saved">
            {state.error}
          </Alert>
        </div>
      )}

      <div className="space-y-5 lg:grid lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start lg:gap-6 lg:space-y-0">
        {/* -------- Editing column -------- */}
        <div className="space-y-5">
          <Section
            id="details"
            index={1}
            title="Work details"
            description="What happened, where, and who directed it."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                id={`${uid}-project`}
                label="Project"
                required
                className="sm:col-span-2"
                hint="Only active projects can receive new tickets."
              >
                {(props) => (
                  <Select {...props} name="project_id" required defaultValue={ticket?.project_id ?? ''}>
                    <option value="" disabled>
                      Select a project…
                    </option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                        {project.project_number ? ` — ${project.project_number}` : ''}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>

              <Field
                id={`${uid}-occurred`}
                label="Date &amp; time performed"
                required
                hint="Defaults to now. Adjust it if the work happened earlier."
              >
                {(props) => (
                  <Input
                    {...props}
                    id={`${uid}-occurred`}
                    name="occurred_at_local"
                    type="datetime-local"
                    required
                    value={occurredAt}
                    onChange={(event) => setOccurredAt(event.target.value)}
                  />
                )}
              </Field>

              <Field id={`${uid}-location`} label="Jobsite area" optional>
                {(props) => (
                  <Input
                    {...props}
                    name="location"
                    maxLength={250}
                    defaultValue={ticket?.location ?? ''}
                    placeholder="Level 3 East, Room 304, Panel B"
                  />
                )}
              </Field>

              <Field
                id={`${uid}-description`}
                label="Extra work description"
                required
                className="sm:col-span-2"
                hint="Exactly what the crew did, including the field condition that caused it."
              >
                {(props) => (
                  <Textarea
                    {...props}
                    name="description"
                    required
                    rows={5}
                    maxLength={12000}
                    defaultValue={ticket?.description ?? ''}
                    placeholder="Rerouted four 4-inch EMT feeder runs around an unmapped HVAC supply duct discovered during rough-in…"
                  />
                )}
              </Field>

              <Field
                id={`${uid}-scope`}
                label="Reason outside original scope"
                optional
                className="sm:col-span-2"
                hint="Why this work is not covered by the base contract — drawing numbers, verbal direction, site conditions."
              >
                {(props) => (
                  <Textarea
                    {...props}
                    name="out_of_scope_reason"
                    rows={3}
                    maxLength={6000}
                    defaultValue={ticket?.out_of_scope_reason ?? ''}
                    placeholder="Duct conflict was not shown on electrical drawings E-201. Directed by GC superintendent on site."
                  />
                )}
              </Field>

              <Field id={`${uid}-rep`} label="Directed / verified by" optional>
                {(props) => (
                  <Input
                    {...props}
                    name="gc_representative"
                    maxLength={180}
                    defaultValue={ticket?.gc_representative ?? ''}
                    placeholder="J. Doe — Superintendent"
                    autoComplete="off"
                  />
                )}
              </Field>

              <Field
                id={`${uid}-status`}
                label="Tracking status"
                hint="Internal workflow only. Customer approval is recorded separately on the ticket."
              >
                {(props) => (
                  <Select {...props} name="status" defaultValue={ticket?.status ?? 'draft'}>
                    {selectableStatuses(ticket?.status).map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>

              <Field
                id={`${uid}-notes`}
                label="Additional observations"
                optional
                className="sm:col-span-2"
                hint="Weather, site access, standby time or anything a reviewer should know."
              >
                {(props) => (
                  <Textarea
                    {...props}
                    name="notes"
                    rows={2}
                    maxLength={12000}
                    defaultValue={ticket?.notes ?? ''}
                    placeholder="Scissor lift required for access above the corridor grid."
                  />
                )}
              </Field>
            </div>
          </Section>

          <Section
            id="labor"
            index={2}
            title="Labor"
            description="Crew hours and the rate applied to each line."
            icon={<Clock3 size={16} aria-hidden="true" />}
            aside={
              <div className="text-right">
                <p className="font-mono text-[13px] font-semibold text-ink">
                  {formatCurrency(totals.labor)}
                </p>
                <p className="text-[11px] text-subtle">
                  {laborHours ? `${Number(laborHours.toFixed(2))} hrs` : 'No hours yet'}
                </p>
              </div>
            }
          >
            <div className="space-y-3">
              {laborRows.map((row, index) => {
                const lineTotal = laborLineTotal({
                  hours: toNumber(row.hours),
                  rate: toNumber(row.rate),
                });
                return (
                  <div
                    key={row.key}
                    className="rounded-xl border border-line bg-surface-2/40 p-4 transition-colors duration-150 focus-within:border-brand-300 focus-within:bg-surface"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-subtle">
                        Line {index + 1}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[13px] font-semibold text-ink tabular-nums">
                          {formatCurrency(lineTotal)}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          iconOnly
                          onClick={() =>
                            setLaborRows((current) => current.filter((item) => item.key !== row.key))
                          }
                          aria-label={`Remove labor line ${index + 1}`}
                          title="Remove this line"
                          className="text-subtle hover:bg-danger-soft hover:text-danger"
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,0.7fr)_minmax(0,0.8fr)]">
                      <Field
                        id={`${uid}-labor-name-${row.key}`}
                        label="Worker or role"
                        required
                      >
                        {(props) => (
                          <Input
                            {...props}
                            value={row.worker_name}
                            maxLength={160}
                            onChange={(event) =>
                              setLaborRows((current) =>
                                current.map((item) =>
                                  item.key === row.key
                                    ? { ...item, worker_name: event.target.value }
                                    : item
                                )
                              )
                            }
                            placeholder="Journeyman electrician"
                          />
                        )}
                      </Field>

                      <Field id={`${uid}-labor-hours-${row.key}`} label="Hours" required>
                        {(props) => (
                          <Input
                            {...props}
                            type="number"
                            inputMode="decimal"
                            min="0.01"
                            max="10000"
                            // "any" because browsers measure valid steps from `min`: with min 0.01 and
                            // step 0.25, a plain "4" hours was rejected as invalid.
                            step="any"
                            value={row.hours}
                            onChange={(event) =>
                              setLaborRows((current) =>
                                current.map((item) =>
                                  item.key === row.key ? { ...item, hours: event.target.value } : item
                                )
                              )
                            }
                            placeholder="0"
                            className="text-right font-mono tabular-nums"
                          />
                        )}
                      </Field>

                      <Field id={`${uid}-labor-rate-${row.key}`} label="Rate ($/hr)" required>
                        {(props) => (
                          <Input
                            {...props}
                            type="number"
                            inputMode="decimal"
                            min="0"
                            max="1000000"
                            step="0.01"
                            value={row.rate}
                            onChange={(event) =>
                              setLaborRows((current) =>
                                current.map((item) =>
                                  item.key === row.key ? { ...item, rate: event.target.value } : item
                                )
                              )
                            }
                            placeholder="0.00"
                            className="text-right font-mono tabular-nums"
                          />
                        )}
                      </Field>
                    </div>

                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {commonRoles.map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() =>
                            setLaborRows((current) =>
                              current.map((item) =>
                                item.key === row.key ? { ...item, worker_name: role } : item
                              )
                            )
                          }
                          className={cn(
                            'rounded-md border px-2 py-0.5 text-[11.5px] font-medium transition-colors duration-150',
                            row.worker_name === role
                              ? 'border-brand-line bg-brand-50 text-brand-800'
                              : 'border-line bg-surface text-muted hover:border-line-strong hover:text-ink'
                          )}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              <Button
                type="button"
                variant="secondary"
                onClick={() => setLaborRows((current) => [...current, blankLabor(nextRowKey('labor'))])}
                className="w-full border-dashed"
              >
                <Plus size={15} aria-hidden="true" />
                Add worker or role
              </Button>
            </div>
          </Section>

          <Section
            id="materials"
            index={3}
            title="Materials &amp; supplies"
            description="Conduit, wire, fittings, boxes and fasteners consumed by the extra work."
            icon={<Package size={16} aria-hidden="true" />}
            aside={
              <div className="text-right">
                <p className="font-mono text-[13px] font-semibold text-ink">
                  {formatCurrency(totals.materials)}
                </p>
                <p className="text-[11px] text-subtle">
                  {materialRows.length ? `${materialRows.length} lines` : 'None yet'}
                </p>
              </div>
            }
          >
            <CostLines
              rows={materialRows}
              setRows={setMaterialRows}
              baseId={`${uid}-mat`}
              descriptionLabel="Material description"
              descriptionPlaceholder={'3/4" EMT conduit — 10 ft stick'}
              quantityLabel="Qty"
              unitLabel="Unit cost ($)"
              emptyText="No materials on this ticket yet. Add a line only if materials were consumed."
              addLabel="Add material line"
            />
          </Section>

          <Section
            id="equipment"
            index={4}
            title="Equipment &amp; other costs"
            description="Rentals, disposal fees and direct costs billed for this work."
            icon={<Wrench size={16} aria-hidden="true" />}
            aside={
              <div className="text-right">
                <p className="font-mono text-[13px] font-semibold text-ink">
                  {formatCurrency(totals.other)}
                </p>
                <p className="text-[11px] text-subtle">
                  {costRows.length ? `${costRows.length} lines` : 'None yet'}
                </p>
              </div>
            }
          >
            <CostLines
              rows={costRows}
              setRows={setCostRows}
              baseId={`${uid}-cost`}
              descriptionLabel="Description"
              descriptionPlaceholder="Electric scissor lift — day rental"
              quantityLabel="Qty"
              unitLabel="Unit cost ($)"
              emptyText="Optional. Add rentals or direct costs if they belong on this ticket."
              suggestions={commonEquipment}
              addLabel="Add equipment or cost"
            />
          </Section>
        </div>

        {/* -------- Sticky summary column -------- */}
        <aside aria-label="Ticket review" className="lg:sticky lg:top-20 lg:order-none">
          <Card flush id="review" className="scroll-mt-24">
            <CardHeader title="Review" description="Totals update as you type" bordered />
            <dl className="divide-y divide-line px-5">
              {[
                { label: 'Labor', value: totals.labor, count: describedLabor.length },
                { label: 'Materials', value: totals.materials, count: describedMaterials.length },
                { label: 'Equipment & other', value: totals.other, count: describedCosts.length },
              ].map((row) => (
                <div key={row.label} className="flex items-baseline justify-between gap-3 py-2.5">
                  <dt className="text-[13px] text-muted">
                    {row.label}
                    <span className="ml-1.5 text-[11px] text-faint">({row.count})</span>
                  </dt>
                  <dd className="font-mono text-[13px] font-medium text-body tabular-nums">
                    {formatCurrency(row.value)}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-1 border-t border-line bg-surface-2/60 px-5 py-4">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-subtle">
                  Documented total
                </span>
                <span className="font-mono text-xl font-semibold text-ink tabular-nums">
                  {formatCurrency(totals.total)}
                </span>
              </div>
              <p className="mt-1 text-[11.5px] text-muted">
                {lineCount} {lineCount === 1 ? 'line item' : 'line items'} ·{' '}
                {dirty ? 'Unsaved changes' : 'All changes saved'}
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-line p-5 sm:flex-row sm:justify-end lg:flex-col-reverse">
              <ButtonLink href={cancelHref} variant="secondary" className="justify-center">
                Cancel
              </ButtonLink>
              <Button type="submit" loading={pending} className="justify-center">
                {pending ? 'Saving…' : saveLabel}
              </Button>
            </div>
          </Card>

          <div className="mt-4">
            <Alert tone="info" title="Documentation, not approval">
              Totals are calculated from these entries for billing preparation. They do not create a
              customer approval, a change order, or a guarantee of payment.
            </Alert>
          </div>
        </aside>
      </div>

      {/* -------- Mobile sticky save bar -------- */}
      <div className="no-print fixed inset-x-0 bottom-14 z-30 border-t border-line bg-surface/95 px-3 py-2.5 backdrop-blur-md lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-subtle">
              Documented total
            </p>
            <p className="font-mono text-[15px] font-semibold text-ink tabular-nums">
              {formatCurrency(totals.total)}
            </p>
          </div>
          <Button type="submit" size="md" loading={pending} className="min-w-32">
            {pending ? 'Saving…' : ticket?.id ? 'Save' : 'Create'}
          </Button>
        </div>
      </div>
    </form>
  );
}
