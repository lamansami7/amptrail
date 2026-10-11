import Link from 'next/link';
import { Zap } from 'lucide-react';

export function Brand({
  light = false,
  compact = false,
  href = '/',
}: {
  light?: boolean;
  compact?: boolean;
  href?: string;
}) {
  return (
    <Link
      href={href}
      aria-label="AmpTrail home"
      className={`group inline-flex items-center gap-2.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg ${
        light ? 'text-white' : 'text-slate-900'
      }`}
    >
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-sm ring-1 ring-blue-500/20 transition group-hover:scale-105 group-hover:shadow-blue-500/25">
        <Zap size={18} strokeWidth={2.6} className="fill-white" aria-hidden="true" />
      </span>
      {!compact && (
        <span className="flex items-baseline text-[19px] font-black tracking-[-0.035em]">
          <span>Amp</span>
          <span className="text-blue-600">Trail</span>
        </span>
      )}
    </Link>
  );
}
