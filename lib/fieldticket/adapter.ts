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
    ticket_number: input.ticket_number,
    contractor: input.contractor,
    customer: input.customer,
    project: input.project,
    work_date: input.work_date,
    description: input.description,
    labor: input.labor.map((line) => ({
      description: line.worker_name,
      workers: 1,
      hours_per_worker: line.hours,
      hourly_rate: line.rate,
    })),
    materials: input.materials.map((line) => ({
      description: line.description,
      quantity: line.quantity,
      unit: 'each',
      unit_price: line.unit_cost,
    })),
    tax_rate_percent: 0,
    markup_percent: 0,
  };
}
