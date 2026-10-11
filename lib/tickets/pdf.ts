import { jsPDF } from 'jspdf';
import { formatCurrency, formatDate, formatHours, formatQuantity } from '@/lib/utils';
import { calculateTicketTotals } from '@/lib/tickets/totals';

export type PdfLaborLine = { worker_name: string; hours: number; rate: number; line_total: number };
export type PdfCostLine = {
  description: string;
  quantity: number;
  unit_cost: number;
  line_total: number;
};

export type PdfEvidence = {
  id: string;
  caption: string | null;
  notes?: string | null;
  original_filename: string;
  created_at: string;
};

export type PdfTicket = {
  ticket_number: string;
  status: string;
  occurred_at: string;
  location: string | null;
  description: string;
  out_of_scope_reason: string | null;
  gc_representative: string | null;
  notes: string | null;
  created_at: string;
};

export type WorkRecordInput = {
  companyName?: string;
  ticket: PdfTicket;
  project: {
    name: string;
    project_number: string | null;
    site_address: string | null;
    general_contractor: string | null;
  };
  labor: PdfLaborLine[];
  materials: PdfCostLine[];
  costs: PdfCostLine[];
  evidence: PdfEvidence[];
  /** Evidence id → JPEG data URL. Images that could not be loaded are omitted. */
  images?: Record<string, string>;
};

const INK: [number, number, number] = [11, 18, 32];
const BRAND: [number, number, number] = [37, 99, 235];
const SLATE: [number, number, number] = [86, 100, 118];
const FAINT: [number, number, number] = [148, 163, 184];
const LINE: [number, number, number] = [228, 233, 240];
const SURFACE: [number, number, number] = [248, 250, 252];

const MARGIN = 44;

/**
 * Builds the printed work record. The layout is intentional: a dark identity
 * band, a clear notice that this is a tracking document, job/scope details,
 * itemised tables with subtotals, an evidence appendix and blank signature
 * lines. It never states or implies an approval.
 */
export function buildWorkRecordPdf(input: WorkRecordInput) {
  const { companyName, ticket, project, labor, materials, costs } = input;
  const evidence = input.evidence ?? [];
  const images = input.images ?? {};

  const doc = new jsPDF({ unit: 'pt', format: 'letter', compress: true });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const left = MARGIN;
  const right = pageWidth - MARGIN;
  const contentWidth = right - left;
  const bottomLimit = pageHeight - 56;
  let y = 46;

  const totals = calculateTicketTotals({
    labor: labor.map((line) => ({ hours: line.hours, rate: line.rate })),
    materials: materials.map((line) => ({ quantity: line.quantity, unit_cost: line.unit_cost })),
    costs: costs.map((line) => ({ quantity: line.quantity, unit_cost: line.unit_cost })),
  });

  /** Adds a page when the requested block would overflow the text area. */
  const ensureRoom = (needed: number) => {
    if (y + needed > bottomLimit) {
      doc.addPage();
      y = drawContinuationHeader(doc, ticket, project, left, right);
    }
  };

  const sectionTitle = (title: string) => {
    ensureRoom(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...BRAND);
    doc.text(title.toUpperCase(), left, y);
    y += 7;
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.7);
    doc.line(left, y, right, y);
    y += 12;
  };

  const paragraph = (text: string, size = 9) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...INK);
    const lines = doc.splitTextToSize(text || '—', contentWidth) as string[];
    lines.forEach((line) => {
      ensureRoom(size + 6);
      doc.text(line, left, y);
      y += size + 4.5;
    });
    return y;
  };

  const labelValue = (label: string, value: string, x: number, width: number, size = 9) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...SLATE);
    doc.text(label.toUpperCase(), x, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...INK);
    const lines = doc.splitTextToSize(value || '—', width) as string[];
    doc.text(lines.slice(0, 2), x, y + 12);
    return y + 12 + Math.max(1, Math.min(2, lines.length)) * (size + 2);
  };

  // ------------------------------------------------------------------ identity band
  const bandHeight = 66;
  doc.setFillColor(...INK);
  doc.roundedRect(left, y - 18, contentWidth, bandHeight, 8, 8, 'F');

  // Bolt mark (vector — standard PDF fonts cannot render emoji)
  const boltX = left + 18;
  const boltY = y - 4;
  doc.setFillColor(...BRAND);
  doc.roundedRect(boltX, boltY, 30, 30, 7, 7, 'F');
  doc.setFillColor(255, 255, 255);
  doc.lines(
    [
      [5, -9],
      [-4.2, 0],
      [3.4, -8.4],
      [4.2, 0],
      [-7.2, 17],
      [1.2, -9.6],
      [-2.4, 0],
    ],
    boltX + 11,
    boltY + 23,
    [1, 1],
    'F',
    true
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(255, 255, 255);
  doc.text((companyName || 'AmpTrail').toUpperCase().slice(0, 46), left + 58, y + 2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(170, 186, 208);
  doc.text('TIME & MATERIAL WORK RECORD', left + 58, y + 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(ticket.ticket_number, right - 18, y + 2, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(170, 186, 208);
  doc.text(`Work performed ${formatDate(ticket.occurred_at)}`, right - 18, y + 16, { align: 'right' });

  y += bandHeight - 2;

  // ------------------------------------------------------------------ notice
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.8);
  doc.setFillColor(...SURFACE);
  doc.roundedRect(left, y, contentWidth, 24, 5, 5, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(...SLATE);
  doc.text(
    'This is a field documentation record of time and materials. It is not a customer approval, an executed change order, or an invoice.',
    left + 10,
    y + 15
  );
  y += 34;

  // ------------------------------------------------------------------ job details
  sectionTitle('Project & Work Location');

  const column = contentWidth / 2 - 14;
  const rightColumnX = left + contentWidth / 2 + 14;

  const detailRow = (
    leftPair: [string, string],
    rightPair: [string, string],
    gap = 11
  ) => {
    const rowTop = y;
    const leftEnd = labelValue(leftPair[0], leftPair[1], left, column, 9.4);
    const rightEnd = labelValue(rightPair[0], rightPair[1], rightColumnX, column, 9.4);
    y = Math.max(rowTop, leftEnd, rightEnd) + gap;
  };

  detailRow(['Project', project.name], ['General contractor', project.general_contractor || '—']);
  detailRow(['Job number', project.project_number || '—'], ['Jobsite address', project.site_address || '—']);
  detailRow(
    ['Area / location', ticket.location || '—'],
    ['Directed / verified by', ticket.gc_representative || '—'],
    16
  );

  // ------------------------------------------------------------------ scope
  sectionTitle('Extra Work Description');
  paragraph(ticket.description, 9.5);
  y += 6;

  if (ticket.out_of_scope_reason) {
    ensureRoom(46);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...SLATE);
    doc.text('REASON OUTSIDE ORIGINAL SCOPE', left, y);
    y += 12;
    paragraph(ticket.out_of_scope_reason, 8.8);
    y += 6;
  }

  // ------------------------------------------------------------------ line item tables
  const renderTable = (
    title: string,
    header: [string, string, string, string],
    rows: Array<{ a: string; b: string; c: string; d: string }>,
    subtotal: number,
    emptyMessage: string
  ) => {
    sectionTitle(title);

    if (!rows.length) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...FAINT);
      doc.text(emptyMessage, left, y);
      y += 16;
      return;
    }

    const drawHeader = () => {
      doc.setFillColor(...SURFACE);
      doc.rect(left, y - 9, contentWidth, 18, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...SLATE);
      doc.text(header[0], left + 7, y + 4);
      doc.text(header[1], left + contentWidth * 0.6, y + 4, { align: 'right' });
      doc.text(header[2], left + contentWidth * 0.79, y + 4, { align: 'right' });
      doc.text(header[3], right - 7, y + 4, { align: 'right' });
      y += 16;
    };

    drawHeader();

    for (const row of rows) {
      ensureRoom(24);
      if (y < 90) drawHeader();

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.6);
      doc.setTextColor(...INK);
      const descriptionLines = doc.splitTextToSize(row.a, contentWidth * 0.54) as string[];
      const visible = descriptionLines.slice(0, 2);
      doc.text(visible, left + 7, y + 3);
      doc.text(row.b, left + contentWidth * 0.6, y + 3, { align: 'right' });
      doc.text(row.c, left + contentWidth * 0.79, y + 3, { align: 'right' });
      doc.setFont('helvetica', 'bold');
      doc.text(row.d, right - 7, y + 3, { align: 'right' });

      const rowHeight = Math.max(15, visible.length * 10 + 5);
      y += rowHeight;
      doc.setDrawColor(...LINE);
      doc.setLineWidth(0.5);
      doc.line(left, y - 5, right, y - 5);
    }

    ensureRoom(26);
    doc.setDrawColor(...LINE);
    doc.line(left, y, right, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.6);
    doc.setTextColor(...SLATE);
    doc.text('Subtotal', left + contentWidth * 0.79, y + 13, { align: 'right' });
    doc.setTextColor(...INK);
    doc.text(formatCurrency(subtotal), right - 7, y + 13, { align: 'right' });
    y += 24;
  };

  renderTable(
    'Labor',
    ['WORKER / ROLE', 'HOURS', 'RATE', 'LINE TOTAL'],
    labor.map((line) => ({
      a: line.worker_name,
      b: formatHours(line.hours),
      c: `${formatCurrency(line.rate)}/hr`,
      d: formatCurrency(line.line_total),
    })),
    totals.labor,
    'No labor hours were recorded on this ticket.'
  );

  renderTable(
    'Materials & supplies',
    ['DESCRIPTION', 'QTY', 'UNIT COST', 'LINE TOTAL'],
    materials.map((line) => ({
      a: line.description,
      b: formatQuantity(line.quantity),
      c: formatCurrency(line.unit_cost),
      d: formatCurrency(line.line_total),
    })),
    totals.materials,
    'No materials were recorded on this ticket.'
  );

  renderTable(
    'Equipment & other direct costs',
    ['DESCRIPTION', 'QTY', 'UNIT COST', 'LINE TOTAL'],
    costs.map((line) => ({
      a: line.description,
      b: formatQuantity(line.quantity),
      c: formatCurrency(line.unit_cost),
      d: formatCurrency(line.line_total),
    })),
    totals.other,
    'No equipment or other direct costs were recorded.'
  );

  // ------------------------------------------------------------------ totals
  ensureRoom(70);
  doc.setFillColor(...INK);
  doc.roundedRect(left, y, contentWidth, 56, 6, 6, 'F');

  const columns: Array<[string, number]> = [
    ['Labor', totals.labor],
    ['Materials', totals.materials],
    ['Equipment & other', totals.other],
  ];

  columns.forEach(([label, value], index) => {
    const x = left + 18 + index * (contentWidth / 3.4);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(150, 168, 192);
    doc.text(label.toUpperCase(), x, y + 18);
    doc.setFontSize(10.5);
    doc.setTextColor(255, 255, 255);
    doc.text(formatCurrency(value), x, y + 37);
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(147, 197, 253);
  doc.text('DOCUMENTED TOTAL', right - 18, y + 18, { align: 'right' });
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text(formatCurrency(totals.total), right - 18, y + 38, { align: 'right' });

  y += 70;

  if (ticket.notes) {
    ensureRoom(50);
    sectionTitle('Additional observations');
    paragraph(ticket.notes, 8.8);
    y += 6;
  }

  // ------------------------------------------------------------------ evidence
  if (evidence.length) {
    sectionTitle(`Evidence appendix (${evidence.length} attachment${evidence.length === 1 ? '' : 's'})`);

    const tileWidth = (contentWidth - 14) / 2;
    const imageHeight = 96;
    const tileHeight = (hasImage: boolean) => (hasImage ? imageHeight + 40 : 56);
    let columnIndex = 0;
    let rowTop = y;

    for (const item of evidence) {
      const data = images[item.id];
      const caption = item.caption || item.original_filename;

      if (columnIndex === 0) {
        ensureRoom(tileHeight(Boolean(data)));
        rowTop = y;
      }

      const x = left + columnIndex * (tileWidth + 14);

      if (data) {
        doc.addImage(data, 'JPEG', x, rowTop, tileWidth, imageHeight, undefined, 'FAST');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.6);
        doc.setTextColor(...INK);
        const captionLines = doc.splitTextToSize(caption, tileWidth) as string[];
        doc.text(captionLines.slice(0, 2), x, rowTop + imageHeight + 11);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.8);
        doc.setTextColor(...SLATE);
        doc.text(formatDate(item.created_at), x, rowTop + imageHeight + 29);
      } else {
        doc.setDrawColor(...LINE);
        doc.setLineWidth(0.6);
        doc.roundedRect(x, rowTop, tileWidth, 40, 4, 4, 'S');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.6);
        doc.setTextColor(...INK);
        const captionLines = doc.splitTextToSize(caption, tileWidth - 16) as string[];
        doc.text(captionLines.slice(0, 2), x + 8, rowTop + 16);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.8);
        doc.setTextColor(...SLATE);
        doc.text(
          `${formatDate(item.created_at)} · view in AmpTrail`,
          x + 8,
          rowTop + 31
        );
      }

      if (columnIndex === 1) {
        y = rowTop + tileHeight(Boolean(data));
        columnIndex = 0;
      } else {
        columnIndex = 1;
      }
    }

    if (columnIndex === 1) {
      y = rowTop + tileHeight(Boolean(images[evidence[evidence.length - 1].id])) - 40;
    }
    y += 8;
  }

  // ------------------------------------------------------------------ signatures
  ensureRoom(74);
  sectionTitle('Field verification');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.4);
  doc.setTextColor(...SLATE);
  const note =
    'Signature lines below are printed blank. Signing confirms the described field conditions and documented hours or materials were observed on site; it does not itself authorise a change or guarantee payment.';
  (doc.splitTextToSize(note, contentWidth) as string[]).forEach((line) => {
    doc.text(line, left, y);
    y += 9.5;
  });
  y += 14;

  const signatureWidth = contentWidth / 2 - 20;
  doc.setDrawColor(...SLATE);
  doc.setLineWidth(0.7);
  doc.line(left, y, left + signatureWidth, y);
  doc.line(right - signatureWidth, y, right, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.4);
  doc.setTextColor(...INK);
  doc.text('PERFORMED BY — SUBCONTRACTOR', left, y + 11);
  doc.text('OBSERVED BY — GC / OWNER REPRESENTATIVE', right - signatureWidth, y + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...SLATE);
  doc.text('Name, signature and date', left, y + 22);
  doc.text('Name, signature and date', right - signatureWidth, y + 22);

  // ------------------------------------------------------------------ footers
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.6);
    doc.line(left, pageHeight - 34, right, pageHeight - 34);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(...SLATE);
    doc.text(
      `${companyName || 'AmpTrail'} · ${ticket.ticket_number} · ${project.name}`.slice(0, 92),
      left,
      pageHeight - 21
    );
    doc.text(`Page ${page} of ${pageCount}`, right, pageHeight - 21, { align: 'right' });
  }

  return doc;
}

function drawContinuationHeader(
  doc: jsPDF,
  ticket: PdfTicket,
  project: { name: string },
  left: number,
  right: number
) {
  const y = 46;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.4);
  doc.setTextColor(...INK);
  doc.text(`${ticket.ticket_number} — continued`, left, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...SLATE);
  doc.text(project.name.slice(0, 48), right, y, { align: 'right' });
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.7);
  doc.line(left, y + 8, right, y + 8);
  return y + 30;
}

export function workRecordFilename(ticketNumber: string) {
  return `${ticketNumber.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}-work-record.pdf`;
}
