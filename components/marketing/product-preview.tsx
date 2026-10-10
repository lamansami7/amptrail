import { CalendarDays, Camera, Check, ClipboardCheck, Clock3, FileText, MapPin, Plus, Zap } from 'lucide-react';

export function ProductPreview() {
  return <div className="relative mx-auto w-full max-w-[590px]">
    <div className="absolute -inset-5 rounded-[2rem] bg-[#e9e5dc]" aria-hidden="true" />
    <div className="relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-lift">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div className="flex items-center gap-2.5"><span className="grid h-8 w-8 place-items-center rounded-lg bg-orange text-white"><Zap size={17} fill="currentColor" /></span><div><p className="text-sm font-extrabold text-ink">New work ticket</p><p className="text-[11px] text-muted">Field record · Illustrative preview</p></div></div>
        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-800 ring-1 ring-inset ring-amber-200">Draft</span>
      </div>
      <div className="grid gap-5 p-5 sm:grid-cols-[1.2fr_0.8fr] sm:p-6">
        <div className="space-y-4">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">Project</p><p className="mt-1 text-sm font-bold text-ink">North wing · sample project</p></div>
          <div><div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted"><MapPin size={12} />Area of work</div><p className="mt-1 text-sm text-ink">Level 2 · corridor lighting</p></div>
          <div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">Extra work description</p><p className="mt-1.5 text-sm leading-5 text-slate-700">Added a junction box and rerouted conduit after a field condition was found above the ceiling.</p></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-line p-3"><div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-muted"><Clock3 size={12} />Labor</div><p className="mt-1 text-sm font-bold text-ink">2.5 hrs · 1 entry</p></div>
            <div className="rounded-xl border border-line p-3"><div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-muted"><FileText size={12} />Materials</div><p className="mt-1 text-sm font-bold text-ink">1 line item</p></div>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-dashed border-slate-300 bg-canvas p-3">
            <div className="flex h-24 items-center justify-center rounded-lg bg-[#eeeae1] text-slate-500"><Camera size={22} /></div>
            <p className="mt-2 text-xs font-bold text-ink">Field photo</p><p className="mt-0.5 text-[10px] text-muted">Caption · before cover-up</p>
          </div>
          <div className="rounded-xl bg-navy p-4 text-white">
            <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-white/55">Record total</p>
            <p className="mt-1 text-2xl font-extrabold tracking-tight">Calculated live</p>
            <div className="mt-3 flex items-center gap-1.5 text-[10px] text-white/60"><Check size={12} className="text-orange" />Amounts shown for documentation</div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-line px-3 py-2.5 text-xs font-semibold text-muted"><span className="flex items-center gap-1.5"><CalendarDays size={14} /> Date & time saved</span><Plus size={14} /></div>
          <span className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-orange px-3 py-3 text-xs font-bold text-white"><ClipboardCheck size={14} />Prepare ticket for review</span>
        </div>
      </div>
      <div className="border-t border-line bg-slate-50/70 px-5 py-3 text-[10px] leading-4 text-muted">Sample interface only. A ticket status is a tracking label, not proof of customer approval or payment.</div>
    </div>
  </div>;
}
