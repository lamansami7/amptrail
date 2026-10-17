import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Browsers measure valid steps from `min`. A field with min="0.01" and step="0.25" accepts
 * 0.01, 0.26, 0.51 ... and rejects a plain "4". That exact mistake once blocked entering whole
 * hours on the ticket form, so every numeric input must either use step="any" or have a minimum
 * that is a whole multiple of its step.
 */
function numericInputs(source: string) {
  const found: Array<{ min: number; step: string; line: number }> = [];
  const pattern = /min="([\d.]+)"\s+max="[\d.]+"\s+(?:\/\/[^\n]*\n\s*)*step="([\d.a-z]+)"/g;
  for (const match of source.matchAll(pattern)) {
    found.push({
      min: Number(match[1]),
      step: match[2],
      line: source.slice(0, match.index).split('\n').length,
    });
  }
  return found;
}

describe('ticket editor numeric inputs', () => {
  const source = readFileSync('components/tickets/ticket-editor.tsx', 'utf8');
  const inputs = numericInputs(source);

  it('finds the labor, material and cost inputs', () => {
    expect(inputs.length).toBeGreaterThanOrEqual(4);
  });

  it.each(inputs)('min $min / step $step (line $line) accepts whole numbers', ({ min, step }) => {
    if (step === 'any') return;
    const ratio = min / Number(step);
    expect(Math.abs(ratio - Math.round(ratio))).toBeLessThan(1e-9);
  });
});
