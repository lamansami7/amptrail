import 'server-only';

import { calculateTicketTotals } from '@/lib/tickets/totals';
import { toFieldTicketInput } from './adapter';
import { calculateWithFieldTicket } from './client';

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

type ComparisonInput = {
  ticket_number: string;
  contractor: string;
  customer: string;
  project: string;
  work_date: string;
  description: string;
  labor: Labor[];
  materials: Cost[];
  costs: Cost[];
};

export async function compareFieldTicketTotals(
  input: ComparisonInput
): Promise<{
  status: 'matched' | 'mismatch' | 'skipped' | 'unavailable';
  amptrailTotal: number;
  fieldticketTotal?: number;
}> {
  const local = calculateTicketTotals(input);

  if (!process.env.FIELDTICKET_API_KEY || input.costs.length) {
    return {
      status: 'skipped',
      amptrailTotal: local.total,
    };
  }

  try {
    const payload = toFieldTicketInput(input);
    const remote = await calculateWithFieldTicket(payload);
    const remoteTotal = Number(remote.total);

    if (!Number.isFinite(remoteTotal)) {
      return {
        status: 'unavailable',
        amptrailTotal: local.total,
      };
    }

    return {
      status:
        Math.round(remoteTotal * 100) ===
        Math.round(local.total * 100)
          ? 'matched'
          : 'mismatch',
      amptrailTotal: local.total,
      fieldticketTotal: remoteTotal,
    };
  } catch {
    return {
      status: 'unavailable',
      amptrailTotal: local.total,
    };
  }
}
