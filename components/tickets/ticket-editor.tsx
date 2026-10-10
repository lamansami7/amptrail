'use client';

import { useEffect, useMemo, useState } from 'react';
import { useActionState } from 'react';
import { Plus, Trash2, LoaderCircle, Info } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/button';
import { saveTicketAction, type TicketActionState } from '@/lib/actions/tickets';
import { calculateTicketTotals } from '@/lib/tickets/totals';
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

function RowHeading({ title, helper, onAdd }: { title: string; helper: string; onAdd: () => void }) {
  return <div className="mb-3 flex items-start justify-between gap-3"><div><h3 className="text-sm font-bold text-ink">{title}</h3><p className="mt-1 text-xs text-muted">{helper}</p></div><button type="button" onClick={onAdd} className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-lg px-2.5 text-xs font-bold text-orange-dark hover:bg-orange/10"><Plus size={15} />Add row</button></div>;
}

function EmptyLine({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-line px-4 py-4 text-center text-xs text-muted">{text}</div>;
}

export function TicketEditor({ projects, ticket, labor: initialLabor = [], materials: initialMaterials = [], costs: initialCosts = [] }: {
  projects: Array<{ id: string; name: string; project_number: string | null }>;
  ticket?: TicketEditorData;
  labor?: Array<{ worker_name: string; hours: number; rate: number }>;
  materials?: Array<{ description: string; quantity: number; unit_cost: number }>;
  costs?: Array<{ description: string; quantity: number; unit_cost: number }>;
}) {
  const [state, formAction, pending] = useActionState(saveTicketAction, {} as TicketActionState);
  const [occurredAt, setOccurredAt] = useState('');
  useEffect(() => setOccurredAt(formatDateTimeLocal(ticket?.occurred_at)), [ticket?.occurred_at]);
  const occurredAtIso = useMemo(() => {
    const date = new Date(occurredAt);
    return occurredAt && !Number.isNaN(date.getTime()) ? date.toISOString() : '';
  }, [occurredAt]);
  const [labor, setLabor] = useState<LaborDraft[]>(initialLabor.map((row) => ({ worker_name: row.worker_name, hours: String(row.hours), rate: String(row.rate) })));
  const [materials, setMaterials] = useState<CostDraft[]>(initialMaterials.map((row) => ({ description: row.description, quantity: String(row.quantity), unit_cost: String(row.unit_cost) })));
  const [costs, setCosts] = useState<CostDraft[]>(initialCosts.map((row) => ({ description: row.description, quantity: String(row.quantity), unit_cost: String(row.unit_cost) })));

  const totals = useMemo(() => calculateTicketTotals({
    labor: labor.filter((row) => row.worker_name || row.hours || row.rate).map((row) => ({ hours: Number(row.hours) || 0, rate: Number(row.rate) || 0 })),
    materials: materials.filter((row) => row.description || row.quantity || row.unit_cost).map((row) => ({ quantity: Number(row.quantity) || 0, unit_cost: Number(row.unit_cost) || 0 })),
    costs: costs.filter((row) => row.description || row.quantity || row.unit_cost).map((row) => ({ quantity: Number(row.quantity) || 0, unit_cost: Number(row.unit_cost) || 0 })),
  }), [labor, materials, costs]);

  const jsonLabor = labor.filter((row) => row.worker_name.trim() || row.hours || row.rate).map((row) => ({ worker_name: row.worker_name, hours: row.hours, rate: row.rate }));
  const jsonMaterials = materials.filter((row) => row.description.trim() || row.quantity || row.unit_cost).map((row) => ({ description: row.description, quantity: row.quantity, unit_cost: row.unit_cost }));
  const jsonCosts = costs.filter((row) => row.description.trim() || row.quantity || row.unit_cost).map((row) => ({ description: row.description, quantity: row.quantity, unit_cost: row.unit_cost }));

  return <form action={formAction} className="space-y-5">
    {ticket?.id && <input type="hidden" name="id" value={ticket.id} />}
    <input type="hidden" name="occurred_at" value={occurredAtIso} />
    <input type="hidden" name="labor" value={JSON.stringify(jsonLabor)} />
    <input type="hidden" name="materials" value={JSON.stringify(jsonMaterials)} />
    <input type="hidden" name="costs" value={JSON.stringify(jsonCosts)} />
    {state.error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-800" role="alert">{state.error}</p>}

    <section className="card p-5 sm:p-7">
      <div className="mb-5 border-b border-line pb-4"><p className="eyebrow">01 · Work details</p><h2 className="mt-1 text-lg font-bold text-ink">What happened?</h2></div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="field-label" htmlFor="project_id">Project <span className="text-orange">*</span></label><select className="field-control" id="project_id" name="project_id" required defaultValue={ticket?.project_id || ''}><option value="" disabled>Select a project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}{project.project_number ? ` · ${project.project_number}` : ''}</option>)}</select></div>
        <div><label className="field-label" htmlFor="occurred_at">Date and time <span className="text-orange">*</span></label><input className="field-control" id="occurred_at" name="occurred_at_local" type="datetime-local" required value={occurredAt} onChange={(event) => setOccurredAt(event.target.value)} /></div>
        <div><label className="field-label" htmlFor="location">Location / area</label><input className="field-control" id="location" name="location" maxLength={250} defaultValue={ticket?.location || ''} placeholder="Building, floor, room, or area" /></div>
        <div className="sm:col-span-2"><label className="field-label" htmlFor="description">Extra work description <span className="text-orange">*</span></label><textarea className="field-control min-h-32 resize-y" id="description" name="description" required maxLength={12000} placeholder="Describe the work performed, including what changed and what the crew did." defaultValue={ticket?.description || ''} /><p className="field-hint">Write a clear field description. This record does not change the original contract scope.</p></div>
        <div className="sm:col-span-2"><label className="field-label" htmlFor="out_of_scope_reason">Why was it outside the original scope?</label><textarea className="field-control min-h-24 resize-y" id="out_of_scope_reason" name="out_of_scope_reason" maxLength={6000} placeholder="Note the field condition, direction, or change that prompted the work." defaultValue={ticket?.out_of_scope_reason || ''} /></div>
        <div><label className="field-label" htmlFor="gc_representative">Customer / GC representative</label><input className="field-control" id="gc_representative" name="gc_representative" maxLength={180} defaultValue={ticket?.gc_representative || ''} placeholder="Name, if applicable" /></div>
        <div><label className="field-label" htmlFor="status">Tracking status</label><select className="field-control" id="status" name="status" defaultValue={ticket?.status || 'draft'}>{ticketStatusOptions.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></div>
        <div className="sm:col-span-2"><label className="field-label" htmlFor="notes">Additional notes</label><textarea className="field-control min-h-24 resize-y" id="notes" name="notes" maxLength={12000} placeholder="Context, instructions, or follow-up to keep with the record" defaultValue={ticket?.notes || ''} /></div>
      </div>
    </section>

    <section className="card p-5 sm:p-7">
      <div className="mb-5 border-b border-line pb-4"><p className="eyebrow">02 · Time and costs</p><h2 className="mt-1 text-lg font-bold text-ink">Record what it took</h2></div>
      <div className="space-y-8">
        <div>
          <RowHeading title="Labor" helper="Worker or role, hours, and hourly rate." onAdd={() => setLabor((rows) => [...rows, { worker_name: '', hours: '', rate: '' }])} />
          {labor.length === 0 ? <EmptyLine text="No labor entries yet. Add one if you want labor included in the record." /> : <div className="space-y-3">{labor.map((row, index) => <div key={`labor-${index}`} className="grid grid-cols-[minmax(0,1fr)_0.6fr_0.7fr_40px] items-end gap-2 rounded-xl bg-canvas p-3 sm:grid-cols-[minmax(0,1.2fr)_0.7fr_0.8fr_44px] sm:gap-3 sm:p-4">
            <div className="col-span-4 text-[11px] font-bold text-muted sm:col-span-1">Entry {index + 1}</div>
            <div className="col-span-4 sm:col-span-1"><label className="field-label text-xs" htmlFor={`labor-name-${index}`}>Worker / role</label><input id={`labor-name-${index}`} className="field-control min-h-10 px-3 py-2 text-sm" required maxLength={160} value={row.worker_name} onChange={(event) => setLabor((rows) => rows.map((item, i) => i === index ? { ...item, worker_name: event.target.value } : item))} placeholder="Journeyman" /></div>
            <div><label className="field-label text-xs" htmlFor={`labor-hours-${index}`}>Hours</label><input id={`labor-hours-${index}`} className="field-control min-h-10 px-2 py-2 text-sm" type="number" required min="0.01" max="10000" step="0.01" value={row.hours} onChange={(event) => setLabor((rows) => rows.map((item, i) => i === index ? { ...item, hours: event.target.value } : item))} placeholder="0" /></div>
            <div><label className="field-label text-xs" htmlFor={`labor-rate-${index}`}>Rate / hr</label><input id={`labor-rate-${index}`} className="field-control min-h-10 px-2 py-2 text-sm" type="number" required min="0" max="1000000" step="0.01" value={row.rate} onChange={(event) => setLabor((rows) => rows.map((item, i) => i === index ? { ...item, rate: event.target.value } : item))} placeholder="$0" /></div>
            <button type="button" onClick={() => setLabor((rows) => rows.filter((_, i) => i !== index))} aria-label={`Remove labor entry ${index + 1}`} className="mb-0.5 grid h-10 w-10 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
          </div>)}</div>}
        </div>
        <div>
          <RowHeading title="Materials" helper="Material description, quantity, and unit cost." onAdd={() => setMaterials((rows) => [...rows, { description: '', quantity: '', unit_cost: '' }])} />
          {materials.length === 0 ? <EmptyLine text="No material entries yet. Add line items used for this extra work." /> : <div className="space-y-3">{materials.map((row, index) => <div key={`material-${index}`} className="grid grid-cols-[minmax(0,1fr)_0.55fr_0.7fr_40px] items-end gap-2 rounded-xl bg-canvas p-3 sm:grid-cols-[minmax(0,1.2fr)_0.7fr_0.8fr_44px] sm:gap-3 sm:p-4">
            <div className="col-span-4 text-[11px] font-bold text-muted sm:col-span-1">Entry {index + 1}</div>
            <div className="col-span-4 sm:col-span-1"><label className="field-label text-xs" htmlFor={`material-name-${index}`}>Description</label><input id={`material-name-${index}`} className="field-control min-h-10 px-3 py-2 text-sm" required maxLength={240} value={row.description} onChange={(event) => setMaterials((rows) => rows.map((item, i) => i === index ? { ...item, description: event.target.value } : item))} placeholder="EMT conduit, ¾ in." /></div>
            <div><label className="field-label text-xs" htmlFor={`material-qty-${index}`}>Qty</label><input id={`material-qty-${index}`} className="field-control min-h-10 px-2 py-2 text-sm" type="number" required min="0.001" max="1000000" step="0.001" value={row.quantity} onChange={(event) => setMaterials((rows) => rows.map((item, i) => i === index ? { ...item, quantity: event.target.value } : item))} placeholder="0" /></div>
            <div><label className="field-label text-xs" htmlFor={`material-cost-${index}`}>Unit cost</label><input id={`material-cost-${index}`} className="field-control min-h-10 px-2 py-2 text-sm" type="number" required min="0" max="1000000" step="0.01" value={row.unit_cost} onChange={(event) => setMaterials((rows) => rows.map((item, i) => i === index ? { ...item, unit_cost: event.target.value } : item))} placeholder="$0" /></div>
            <button type="button" onClick={() => setMaterials((rows) => rows.filter((_, i) => i !== index))} aria-label={`Remove material entry ${index + 1}`} className="mb-0.5 grid h-10 w-10 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
          </div>)}</div>}
        </div>
        <div>
          <RowHeading title="Equipment / other costs" helper="Equipment, rentals, or other documented costs." onAdd={() => setCosts((rows) => [...rows, { description: '', quantity: '', unit_cost: '' }])} />
          {costs.length === 0 ? <EmptyLine text="No equipment or other cost entries. These are optional." /> : <div className="space-y-3">{costs.map((row, index) => <div key={`cost-${index}`} className="grid grid-cols-[minmax(0,1fr)_0.55fr_0.7fr_40px] items-end gap-2 rounded-xl bg-canvas p-3 sm:grid-cols-[minmax(0,1.2fr)_0.7fr_0.8fr_44px] sm:gap-3 sm:p-4">
            <div className="col-span-4 text-[11px] font-bold text-muted sm:col-span-1">Entry {index + 1}</div>
            <div className="col-span-4 sm:col-span-1"><label className="field-label text-xs" htmlFor={`cost-name-${index}`}>Description</label><input id={`cost-name-${index}`} className="field-control min-h-10 px-3 py-2 text-sm" required maxLength={240} value={row.description} onChange={(event) => setCosts((rows) => rows.map((item, i) => i === index ? { ...item, description: event.target.value } : item))} placeholder="Lift rental" /></div>
            <div><label className="field-label text-xs" htmlFor={`cost-qty-${index}`}>Qty</label><input id={`cost-qty-${index}`} className="field-control min-h-10 px-2 py-2 text-sm" type="number" required min="0.001" max="1000000" step="0.001" value={row.quantity} onChange={(event) => setCosts((rows) => rows.map((item, i) => i === index ? { ...item, quantity: event.target.value } : item))} placeholder="0" /></div>
            <div><label className="field-label text-xs" htmlFor={`cost-cost-${index}`}>Unit cost</label><input id={`cost-cost-${index}`} className="field-control min-h-10 px-2 py-2 text-sm" type="number" required min="0" max="1000000" step="0.01" value={row.unit_cost} onChange={(event) => setCosts((rows) => rows.map((item, i) => i === index ? { ...item, unit_cost: event.target.value } : item))} placeholder="$0" /></div>
            <button type="button" onClick={() => setCosts((rows) => rows.filter((_, i) => i !== index))} aria-label={`Remove cost entry ${index + 1}`} className="mb-0.5 grid h-10 w-10 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
          </div>)}</div>}
        </div>
      </div>

      <div className="mt-7 rounded-2xl bg-navy p-5 text-white sm:p-6">
        <div className="flex items-start gap-2 text-xs leading-5 text-white/65"><Info size={15} className="mt-0.5 shrink-0 text-orange" />These calculated amounts are part of a work record, not an invoice or a confirmation of customer approval.</div>
        <div className="mt-5 grid grid-cols-2 gap-y-2 border-t border-white/15 pt-4 text-sm sm:grid-cols-4 sm:gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/50">Labor</p><p className="mt-1 font-semibold">{formatCurrency(totals.labor)}</p></div><div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/50">Materials</p><p className="mt-1 font-semibold">{formatCurrency(totals.materials)}</p></div><div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/50">Other</p><p className="mt-1 font-semibold">{formatCurrency(totals.other)}</p></div><div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-orange">Record total</p><p className="mt-1 text-lg font-extrabold">{formatCurrency(totals.total)}</p></div></div>
      </div>
    </section>

    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><ButtonLink href={ticket?.id ? `/tickets/${ticket.id}` : '/tickets'} variant="secondary">Cancel</ButtonLink><Button type="submit" disabled={pending} className="min-w-40">{pending && <LoaderCircle size={16} className="animate-spin" />}{pending ? 'Saving ticket…' : ticket ? 'Save changes' : 'Create ticket'}</Button></div>
  </form>;
}
