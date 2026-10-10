import Link from 'next/link';
import { Zap } from 'lucide-react';

export function Brand({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return (
    <Link href="/" aria-label="AmpTrail home" className={`group inline-flex items-center gap-2.5 ${light ? 'text-white' : 'text-ink'}`}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-orange text-white shadow-sm transition group-hover:-rotate-3">
        <Zap size={19} strokeWidth={2.8} fill="currentColor" aria-hidden="true" />
      </span>
      {!compact && <span className="text-[19px] font-extrabold tracking-[-0.045em]">AmpTrail</span>}
    </Link>
  );
}
