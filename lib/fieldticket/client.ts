import 'server-only';

const DEFAULT_API_URL = 'https://fieldticket-api.onrender.com';

export type FieldTicketLabor = {
  description: string;
  workers: number;
  hours_per_worker: number;
  hourly_rate: number;
};

export type FieldTicketMaterial = {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
};

export type FieldTicketInput = {
  ticket_number: string;
  contractor: string;
  customer: string;
  project: string;
  work_date: string;
  description: string;
  labor: FieldTicketLabor[];
  materials: FieldTicketMaterial[];
  tax_rate_percent?: number;
  markup_percent?: number;
};

export async function calculateWithFieldTicket(
  ticket: FieldTicketInput
) {
  const apiKey = process.env.FIELDTICKET_API_KEY;

  if (!apiKey) {
    throw new Error('FieldTicket API key is not configured');
  }

  const apiUrl = (
    process.env.FIELDTICKET_API_URL || DEFAULT_API_URL
  ).replace(/\/$/, '');

  const response = await fetch(
    `${apiUrl}/v1/tickets/calculate`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(ticket),
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    }
  );

  if (!response.ok) {
    throw new Error(
      `FieldTicket calculation failed (${response.status})`
    );
  }

  return response.json();
}
