'use client';

import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FaqItem = { question: string; answer: string };

/**
 * FAQ accordion. Uses native details/summary so keyboard and screen-reader
 * behaviour is correct without extra JavaScript, and only one answer stays
 * open at a time.
 */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const baseId = useId();

  return (
    <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
      {items.map((item, index) => {
        const open = openIndex === index;
        return (
          <div key={item.question}>
            <h3>
              <button
                type="button"
                aria-expanded={open}
                aria-controls={`${baseId}-panel-${index}`}
                id={`${baseId}-button-${index}`}
                onClick={() => setOpenIndex(open ? null : index)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors duration-150 hover:bg-surface-2 sm:px-6"
              >
                <span className="text-[14.5px] font-semibold text-ink">{item.question}</span>
                <ChevronDown
                  size={17}
                  aria-hidden="true"
                  className={cn(
                    'shrink-0 text-subtle transition-transform duration-200',
                    open && 'rotate-180 text-brand-600'
                  )}
                />
              </button>
            </h3>
            <div
              id={`${baseId}-panel-${index}`}
              role="region"
              aria-labelledby={`${baseId}-button-${index}`}
              hidden={!open}
              className="animate-fade-in px-5 pb-5 sm:px-6"
            >
              <p className="max-w-3xl text-[13.5px] leading-6 text-muted">{item.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
