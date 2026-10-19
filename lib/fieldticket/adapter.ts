import type { FieldTicketInput } from './client';

type Labor = {
  worker_name: string;
  hours: number;
  rate: number;
};

type Cost = {
  description: string;
  quantity: number;
  unit_cost: number;
};

/**
 * FieldTicket's API caps free-text fields well below AmpTrail's limits
 * (ticket description 3,000 chars vs 12,000 here; line descriptions 200).
 * Sending a longer value earns a 422 and the comparison reports
 * "unavailable" for an otherwise valid ticket. Truncation applies only to
 * this outbound comparison payload — stored records and totals are untouched.
 */
const FIELDTICKET_LIMITS = {
  ticketNumber: 60,
  party: 200,
  description: 3000,
  lineDescription: 200,
} as const;

function clampText(value: string, max: number) {
  return value.length > max ? value.slice(0, max) : value;
}

export function toFieldTicketInput(input: {
  ticket_number: string;
  contractor: string;
  customer: string;
  project: string;
  work_date: string;
  description: string;
  labor: Labor[];
  materials: Cost[];
  costs?: Cost[];
}): FieldTicketInput {
  if (input.costs?.length) {
    throw new Error(
      'FieldTicket does not support separate other-cost entries yet'
    );
  }

  return {
    ticket_number: clampText(input.ticket_number, FIELDTICKET_LIMITS.ticketNumber),
    contractor: clampText(input.contractor, FIELDTICKET_LIMITS.party),
    customer: clampText(input.customer, FIELDTICKET_LIMITS.party),
    project: clampText(input.project, FIELDTICKET_LIMITS.party),
    work_date: input.work_date,
    description: clampText(input.description, FIELDTICKET_LIMITS.description),
    labor: input.labor.map((line) => ({
      description: clampText(line.worker_name, FIELDTICKET_LIMITS.lineDescription),
      workers: 1,
      hours_per_worker: line.hours,
      hourly_rate: line.rate,
    })),
    materials: input.materials.map((line) => ({
      description: clampText(line.description, FIELDTICKET_LIMITS.lineDescription),
      quantity: line.quantity,
      unit: 'each',
      unit_price: line.unit_cost,
    })),
    tax_rate_percent: 0,
    markup_percent: 0,
  };
}
