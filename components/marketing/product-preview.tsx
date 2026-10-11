'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  Clock3,
  Receipt,
  Zap,
} from 'lucide-react';
import { StatusBadge } from '@/components/workspace/status-badge';

export function ProductPreview() {
  const [activeTab, setActiveTab] = useState<'ticket' | 'pdf'>('ticket');

  return (
    <div className="relative mx-auto w-full max-w-[620px]">
      {/* Background decoration aura */}
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-cyan-500/10 blur-xl" aria-hidden="true" />

      {/* Main card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xl">
        {/* Top Control Bar with Tab Switcher */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-600 text-white shadow-xs">
              <Zap size={14} className="fill-white" />
            </span>
            <div className="text-left">
              <span className="font-mono text-xs font-bold text-slate-900">AT-26-00142</span>
              <span className="hidden text-[10px] text-slate-400 sm:inline"> · Metro Center Level 3</span>
            </div>
          </div>

          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab('ticket')}
              className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition ${
                activeTab === 'ticket' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Field Ticket
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pdf')}
              className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition ${
                activeTab === 'pdf' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              PDF Output
            </button>
          </div>
        </div>

        {activeTab === 'ticket' ? (
          /* WORK TICKET VIEW */
          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow">Metro Hospital Expansion</p>
                <h3 className="mt-1 text-base font-bold text-slate-900">
                  Reroute 4&quot; Feeder Around HVAC Chase
                </h3>
              </div>
              <StatusBadge status="ready_for_review" size="xs" />
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600 leading-relaxed">
              <strong className="text-slate-800">Field Condition:</strong> Discovered unmapped 24&quot; supply duct obstructing designated conduit riser path. Directed by GC super John Doe to offset four 4&quot; EMT runs through drywall chase.
            </div>

            {/* Micro Labor & Material Cards */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-slate-200/80 p-3">
                <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                  <Clock3 size={13} className="text-blue-600" />
                  <span>Labor (2 Entries)</span>
                </div>
                <div className="mt-2 space-y-1 font-mono text-[11px] text-slate-700">
                  <div className="flex justify-between">
                    <span>Journeyman (5.5h)</span>
                    <span className="font-bold">$522.50</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Apprentice (5.5h)</span>
                    <span className="font-bold">$330.00</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/80 p-3">
                <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                  <Receipt size={13} className="text-blue-600" />
                  <span>Materials & Lift</span>
                </div>
                <div className="mt-2 space-y-1 font-mono text-[11px] text-slate-700">
                  <div className="flex justify-between">
                    <span>4&quot; EMT & Fittings</span>
                    <span className="font-bold">$485.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Scissor Lift (1 Day)</span>
                    <span className="font-bold">$275.00</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Banner */}
            <div className="flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3 text-white">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Documented Extra Work Total
                </p>
                <p className="font-mono text-lg font-black text-white">$1,612.50</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs">
                <CheckCircle2 size={13} />
                Ready for Review
              </span>
            </div>
          </div>
        ) : (
          /* PDF OUTPUT VIEW */
          <div className="p-5 sm:p-6 space-y-3 bg-slate-50/50">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs font-sans text-xs">
              {/* PDF Header Band */}
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <div>
                  <p className="font-black text-sm tracking-tight text-slate-900">
                    HENDERSON ELECTRIC CO.
                  </p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Time & Material Work Ticket
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-slate-900">AT-26-00142</p>
                  <p className="text-[10px] text-slate-400">Job # PRJ-2026-088</p>
                </div>
              </div>

              {/* Table preview */}
              <div className="mt-3 divide-y divide-slate-100 text-[11px]">
                <div className="flex justify-between py-1 text-slate-500 font-bold uppercase text-[9px]">
                  <span>Item Description</span>
                  <span>Line Total</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Journeyman Electrician · 5.5 hrs @ $95.00/hr</span>
                  <span className="font-mono font-bold">$522.50</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Apprentice Electrician · 5.5 hrs @ $60.00/hr</span>
                  <span className="font-mono font-bold">$330.00</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>4&quot; EMT Conduit & Sweep Elbows</span>
                  <span className="font-mono font-bold">$485.00</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>19ft Electric Scissor Lift Rental</span>
                  <span className="font-mono font-bold">$275.00</span>
                </div>
              </div>

              <div className="mt-3 flex justify-between border-t border-slate-900 pt-2 font-bold">
                <span className="uppercase text-[10px]">Total Documented Cost</span>
                <span className="font-mono text-sm text-blue-600">$1,612.50</span>
              </div>

              {/* Signatures */}
              <div className="mt-4 grid grid-cols-2 gap-4 border-t border-dashed border-slate-200 pt-3 text-[10px] text-slate-400">
                <div>
                  <div className="border-b border-slate-300 pb-3" />
                  <span className="mt-1 block font-semibold text-slate-600">
                    Subcontractor Foreman
                  </span>
                </div>
                <div>
                  <div className="border-b border-slate-300 pb-3" />
                  <span className="mt-1 block font-semibold text-slate-600">
                    Customer / GC Superintendent
                  </span>
                </div>
              </div>
            </div>

            <p className="text-center text-[10px] text-slate-400">
              Generated in 1-click via standard jsPDF engine · Print-ready 8.5&quot; × 11&quot; layout
            </p>
          </div>
        )}

        {/* Footer info bar */}
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-2.5 text-[11px] text-slate-500">
          <span className="font-bold text-slate-700">Field-Tested:</span> Eliminates lost paper slips and prepares clean documentation for customer review.
        </div>
      </div>
    </div>
  );
}
