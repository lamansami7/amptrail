import { ticketSchema, type TicketInput } from '@/lib/schemas/ticket';

function readNumber(value: unknown) {
  if (value === '' || value === null || value === undefined) return Number.NaN;
  return typeof value === 'number' ? value : Number(value);
}

export function parseTicketFormData(formData: FormData) {
  let invalidJson = false;
  const parseJson = (key: string) => {
    const value = formData.get(key);
    if (typeof value !== 'string') { invalidJson = true; return []; }
    try {
      const decoded: unknown = JSON.parse(value);
      if (!Array.isArray(decoded)) { invalidJson = true; return []; }
      return decoded.map((row) => {
        if (typeof row !== 'object' || row === null || Array.isArray(row)) return row;
        const record = row as Record<string, unknown>;
        return {
          ...record,
          ...(record.hours !== undefined ? { hours: readNumber(record.hours) } : {}),
          ...(record.rate !== undefined ? { rate: readNumber(record.rate) } : {}),
          ...(record.quantity !== undefined ? { quantity: readNumber(record.quantity) } : {}),
          ...(record.unit_cost !== undefined ? { unit_cost: readNumber(record.unit_cost) } : {}),
        };
      });
    } catch {
      invalidJson = true;
      return [];
    }
  };

  // The hidden ISO field is maintained by the editor on the client. As a
  // progressive-enhancement fallback, accept the visible datetime-local
  // value directly (no-JS form submits).
  const hiddenDate = String(formData.get('occurred_at') || '');
  const localDate = hiddenDate || String(formData.get('occurred_at_local') || '');
  const parsedDate = new Date(localDate);
  const candidate = {
    project_id: String(formData.get('project_id') || ''),
    occurred_at: Number.isNaN(parsedDate.getTime()) ? '' : parsedDate.toISOString(),
    location: String(formData.get('location') || ''),
    description: String(formData.get('description') || ''),
    out_of_scope_reason: String(formData.get('out_of_scope_reason') || ''),
    status: String(formData.get('status') || 'draft'),
    gc_representative: String(formData.get('gc_representative') || ''),
    notes: String(formData.get('notes') || ''),
    labor: parseJson('labor'),
    materials: parseJson('materials'),
    costs: parseJson('costs'),
  };

  if (invalidJson) return { success: false as const, message: 'Ticket cost entries could not be read. Please reload the form and try again.' };
  const result = ticketSchema.safeParse(candidate);
  if (!result.success) return { success: false as const, message: result.error.issues[0]?.message || 'Check the ticket details and try again.' };
  return { success: true as const, data: result.data as TicketInput };
}
