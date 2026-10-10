export type LaborLineInput = { hours: number; rate: number };
export type CostLineInput = { quantity: number; unit_cost: number };

function scaledInteger(value: number, precision: number) {
  if (!Number.isFinite(value)) return 0n;
  const fixed = value.toFixed(precision);
  const negative = fixed.startsWith('-');
  const unsigned = negative ? fixed.slice(1) : fixed;
  const [whole, fraction = ''] = unsigned.split('.');
  const factor = 10n ** BigInt(precision);
  const magnitude = BigInt(whole) * factor + BigInt(fraction.padEnd(precision, '0'));
  return negative ? -magnitude : magnitude;
}

function roundedDivide(value: bigint, divisor: bigint) {
  const negative = value < 0n;
  const magnitude = negative ? -value : value;
  const rounded = (magnitude + divisor / 2n) / divisor;
  return negative ? -rounded : rounded;
}

function laborLineCents(line: LaborLineInput) {
  const hoursHundredths = scaledInteger(line.hours, 2);
  const rateHundredths = scaledInteger(line.rate, 2);
  return roundedDivide(hoursHundredths * rateHundredths, 100n);
}

function costLineCents(line: CostLineInput) {
  const quantityThousandths = scaledInteger(line.quantity, 3);
  const unitCostHundredths = scaledInteger(line.unit_cost, 2);
  return roundedDivide(quantityThousandths * unitCostHundredths, 1000n);
}

function dollars(cents: bigint) {
  return Number(cents) / 100;
}

export function laborLineTotal(line: LaborLineInput) {
  return dollars(laborLineCents(line));
}

export function costLineTotal(line: CostLineInput) {
  return dollars(costLineCents(line));
}

export function calculateTicketTotals(input: {
  labor: LaborLineInput[];
  materials: CostLineInput[];
  costs: CostLineInput[];
}) {
  const laborCents = input.labor.reduce((sum, line) => sum + laborLineCents(line), 0n);
  const materialCents = input.materials.reduce((sum, line) => sum + costLineCents(line), 0n);
  const otherCents = input.costs.reduce((sum, line) => sum + costLineCents(line), 0n);
  const totalCents = laborCents + materialCents + otherCents;

  return {
    labor: dollars(laborCents),
    materials: dollars(materialCents),
    other: dollars(otherCents),
    total: dollars(totalCents),
  };
}
