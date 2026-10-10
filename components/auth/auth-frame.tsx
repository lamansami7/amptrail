import Link from 'next/link';
import { ArrowLeft, Check } from 'lucide-react';
import { Brand } from '@/components/brand';

export function AuthFrame({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)]">
      <section className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-14 xl:px-20">
        <header className="flex items-center justify-between"><Brand /><Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft size={16} />Back to site</Link></header>
        <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-12">
          <p className="eyebrow">AmpTrail workspace</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.045em] text-ink">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
        <p className="text-xs text-muted">Built for the work that happens beyond the plans.</p>
      </section>
      <aside className="relative hidden overflow-hidden bg-navy px-12 py-14 text-white lg:flex lg:flex-col lg:justify-between xl:px-16">
        <div className="absolute -right-28 -top-28 h-96 w-96 rounded-full border border-white/10" aria-hidden="true" />
        <div className="absolute -right-8 -top-8 h-56 w-56 rounded-full border border-white/10" aria-hidden="true" />
        <p className="relative max-w-sm text-sm font-semibold uppercase tracking-[0.16em] text-white/60">A clearer field record</p>
        <div className="relative max-w-xl">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange text-white"><span className="text-2xl font-black">↗</span></div>
          <h2 className="text-4xl font-extrabold leading-[1.12] tracking-[-0.045em] xl:text-5xl">Extra work happens.<br /><span className="text-orange">Keep the record.</span></h2>
          <p className="mt-5 max-w-md text-base leading-7 text-white/65">Keep the photos, field notes, time, and materials together while the details are still fresh.</p>
          <ul className="mt-8 space-y-3 text-sm text-white/80">
            {['Record work while it is happening', 'Keep evidence with the right project', 'Prepare a clean ticket for review'].map((point) => <li key={point} className="flex items-center gap-2.5"><span className="grid h-5 w-5 place-items-center rounded-full bg-white/10 text-orange"><Check size={13} /></span>{point}</li>)}
          </ul>
        </div>
        <p className="relative text-xs text-white/45">A well-kept work record supports a conversation. It does not guarantee approval or payment.</p>
      </aside>
    </main>
  );
}
