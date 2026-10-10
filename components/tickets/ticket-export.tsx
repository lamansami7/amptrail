'use client';

import { useState } from 'react';
import { Download, LoaderCircle, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateTicketTotals } from '@/lib/tickets/totals';
import { formatCurrency, formatDate, formatStatus } from '@/lib/utils';
import type { EvidenceView } from '@/components/evidence/evidence-panel';

type Labor = { worker_name: string; hours: number; rate: number; line_total: number };
type Cost = { description: string; quantity: number; unit_cost: number; line_total: number };
type ExportTicket = { ticket_number: string; status: string; occurred_at: string; location: string | null; description: string; out_of_scope_reason: string | null; gc_representative: string | null; notes: string | null; created_at: string };

function wrap(doc: import('jspdf').jsPDF, text: string, x: number, y: number, width: number, size = 10) {
  doc.setFontSize(size);
  const lines = doc.splitTextToSize(text || '—', width) as string[];
  doc.text(lines, x, y);
  return y + lines.length * (size + 4);
}

function imageToJpeg(url: string) {
  return new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const max = 1200;
      const scale = Math.min(1, max / Math.max(image.width, image.height));
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext('2d');
      if (!context) { reject(new Error('Canvas unavailable')); return; }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    image.onerror = () => reject(new Error('Image unavailable'));
    image.src = url;
  });
}

export function TicketExport({ ticket, project, labor, materials, costs, evidence }: {
  ticket: ExportTicket;
  project: { name: string; project_number: string | null; site_address: string | null; general_contractor: string | null };
  labor: Labor[];
  materials: Cost[];
  costs: Cost[];
  evidence: EvidenceView[];
}) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');

  async function downloadPdf() {
    setPending(true);
    setMessage('');
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'pt', format: 'letter' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const left = 48;
      const right = pageWidth - 48;
      const contentWidth = right - left;
      let y = 52;
      const navy: [number, number, number] = [23, 37, 53];
      const orange: [number, number, number] = [231, 109, 50];
      const slate: [number, number, number] = [102, 114, 128];
      const line: [number, number, number] = [224, 227, 230];

      const ensureRoom = (height: number) => { if (y + height > pageHeight - 60) { doc.addPage(); y = 52; } };
      const sectionTitle = (title: string) => {
        ensureRoom(30);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...navy);
        doc.text(title.toUpperCase(), left, y);
        y += 8; doc.setDrawColor(...line); doc.line(left, y, right, y); y += 18;
      };
      const field = (label: string, value: string, x: number, width: number) => {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...slate); doc.text(label.toUpperCase(), x, y);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...navy);
        const lines = doc.splitTextToSize(value || '—', width) as string[];
        doc.text(lines, x, y + 14);
        return lines.length;
      };

      doc.setFillColor(...navy); doc.roundedRect(left, y - 24, contentWidth, 90, 12, 12, 'F');
      doc.setFillColor(...orange); doc.roundedRect(left + 18, y - 7, 30, 30, 7, 7, 'F');
      doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.text('A', left + 29, y + 13);
      doc.setFontSize(15); doc.text('AMPTRAIL', left + 60, y + 2);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(220, 228, 237); doc.text('TIME & MATERIAL WORK RECORD', left + 60, y + 18);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(255, 255, 255); doc.text(ticket.ticket_number, right - 18, y + 2, { align: 'right' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(220, 228, 237); doc.text(`Tracking status: ${formatStatus(ticket.status)}`, right - 18, y + 18, { align: 'right' });
      y += 84;

      doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(...navy); doc.text('Work ticket record', left, y); y += 15;
      y = wrap(doc, 'This document records extra work and related time or costs. It is not an invoice, a change order, or proof of customer approval or payment.', left, y, contentWidth, 9) + 14;

      sectionTitle('Project and work');
      field('Project', project.name, left, 225); field('Project number', project.project_number || '—', left + 250, 120); y += 35;
      field('Work date and time', formatDate(ticket.occurred_at, { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }), left, 225); field('Area / location', ticket.location || '—', left + 250, 230); y += 35;
      field('Jobsite address', project.site_address || '—', left, 250); field('General contractor', project.general_contractor || '—', left + 275, 220); y += 38;
      field('Customer / GC representative', ticket.gc_representative || '—', left, contentWidth); y += 32;
      sectionTitle('Extra work description');
      y = wrap(doc, ticket.description, left, y, contentWidth, 10) + 8;
      if (ticket.out_of_scope_reason) { doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...slate); doc.text('OUTSIDE ORIGINAL SCOPE', left, y); y += 14; y = wrap(doc, ticket.out_of_scope_reason, left, y, contentWidth, 10) + 8; }

      const table = (title: string, rows: Array<{ a: string; b: string; c: string; total: number }>) => {
        sectionTitle(title);
        if (!rows.length) { doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...slate); doc.text('No entries recorded.', left, y); y += 20; return; }
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...slate);
        doc.text(title === 'Labor' ? 'WORKER / ROLE' : 'DESCRIPTION', left, y);
        doc.text(title === 'Labor' ? 'HOURS' : 'QTY', left + contentWidth * 0.58, y, { align: 'right' });
        doc.text(title === 'Labor' ? 'RATE' : 'UNIT COST', left + contentWidth * 0.78, y, { align: 'right' });
        doc.text('LINE TOTAL', right, y, { align: 'right' }); y += 10;
        rows.forEach((row) => {
          ensureRoom(24);
          doc.setDrawColor(...line); doc.line(left, y, right, y);
          doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...navy);
          const clipped = doc.splitTextToSize(row.a, contentWidth * 0.53) as string[];
          doc.text(clipped.slice(0, 2), left, y + 13);
          doc.text(row.b, left + contentWidth * 0.58, y + 13, { align: 'right' });
          doc.text(row.c, left + contentWidth * 0.78, y + 13, { align: 'right' });
          doc.setFont('helvetica', 'bold'); doc.text(formatCurrency(row.total), right, y + 13, { align: 'right' });
          y += Math.max(25, clipped.slice(0, 2).length * 11 + 14);
        });
        y += 7;
      };
      table('Labor', labor.map((row) => ({ a: row.worker_name, b: `${row.hours} hrs`, c: `${formatCurrency(row.rate)}/hr`, total: row.line_total })));
      table('Materials', materials.map((row) => ({ a: row.description, b: String(row.quantity), c: formatCurrency(row.unit_cost), total: row.line_total })));
      table('Equipment / other costs', costs.map((row) => ({ a: row.description, b: String(row.quantity), c: formatCurrency(row.unit_cost), total: row.line_total })));

      const totals = calculateTicketTotals({ labor, materials, costs });
      ensureRoom(100);
      doc.setFillColor(247, 246, 242); doc.roundedRect(left, y, contentWidth, 78, 10, 10, 'F');
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...slate);
      doc.text('Labor', left + 15, y + 22); doc.text(formatCurrency(totals.labor), left + contentWidth * 0.27, y + 22, { align: 'right' });
      doc.text('Materials', left + contentWidth * 0.37, y + 22); doc.text(formatCurrency(totals.materials), left + contentWidth * 0.62, y + 22, { align: 'right' });
      doc.text('Other', left + contentWidth * 0.7, y + 22); doc.text(formatCurrency(totals.other), right - 15, y + 22, { align: 'right' });
      doc.setDrawColor(...line); doc.line(left + 15, y + 32, right - 15, y + 32);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...navy); doc.text('DOCUMENTED TOTAL', left + 15, y + 56); doc.setFontSize(15); doc.setTextColor(...orange); doc.text(formatCurrency(totals.total), right - 15, y + 57, { align: 'right' });
      y += 96;

      if (ticket.notes) { ensureRoom(55); sectionTitle('Additional notes'); y = wrap(doc, ticket.notes, left, y, contentWidth, 9) + 10; }
      if (evidence.length) {
        sectionTitle('Supporting evidence');
        for (let index = 0; index < evidence.length; index += 1) {
          const item = evidence[index];
          let imageData = '';
          if (item.signedUrl && index < 8) {
            try { imageData = await imageToJpeg(item.signedUrl); } catch { /* Signed preview may expire or be blocked by storage CORS. */ }
          }
          const caption = item.caption || item.original_filename;
          if (imageData) {
            const width = 150;
            const height = 100;
            ensureRoom(height + 30);
            doc.addImage(imageData, 'JPEG', left, y, width, height);
            doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...navy);
            const lines = doc.splitTextToSize(caption, contentWidth - width - 18) as string[];
            doc.text(lines.slice(0, 3), left + width + 14, y + 13);
            doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...slate);
            doc.text(`${formatDate(item.created_at)} · ${item.original_filename}`, left + width + 14, y + 31);
            if (item.notes) wrap(doc, item.notes, left + width + 14, y + 47, contentWidth - width - 18, 8);
            y += height + 12;
          } else {
            ensureRoom(26);
            y = wrap(doc, `${caption} · ${formatDate(item.created_at)}${item.notes ? ` · ${item.notes}` : ''}`, left, y, contentWidth, 9) + 5;
          }
        }
      }

      ensureRoom(70);
      sectionTitle('Acknowledgment (optional)');
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...slate);
      doc.text('Signatures or acknowledgments do not replace contract requirements or customer approval procedures.', left, y); y += 27;
      doc.setDrawColor(...slate); doc.line(left, y, left + 200, y); doc.line(left + 270, y, right, y);
      doc.setFontSize(8); doc.text('Prepared by / date', left, y + 12); doc.text('Customer / GC acknowledgment / date', left + 270, y + 12);

      const pageCount = doc.getNumberOfPages();
      for (let page = 1; page <= pageCount; page += 1) {
        doc.setPage(page);
        doc.setDrawColor(...line); doc.line(left, pageHeight - 36, right, pageHeight - 36);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...slate);
        doc.text(`${ticket.ticket_number} · Created ${formatDate(ticket.created_at)}`, left, pageHeight - 22);
        doc.text(`Page ${page} of ${pageCount} · Work record, not an approved invoice`, right, pageHeight - 22, { align: 'right' });
      }
      doc.save(`${ticket.ticket_number.toLowerCase()}-work-record.pdf`);
      setMessage('PDF downloaded. Evidence images may be omitted if their private preview links expired.');
    } catch {
      console.error('Ticket PDF export failed');
      setMessage('The PDF could not be generated. Use Print / Save as PDF instead.');
    } finally {
      setPending(false);
    }
  }

  return <div className="flex flex-wrap gap-2">
    <Button type="button" variant="secondary" onClick={() => window.print()}><Printer size={16} />Print / Save as PDF</Button>
    <Button type="button" onClick={downloadPdf} disabled={pending}>{pending ? <LoaderCircle size={16} className="animate-spin" /> : <Download size={16} />}{pending ? 'Preparing PDF…' : 'Download PDF'}</Button>
    {message && <p className="w-full text-xs text-muted" role="status">{message}</p>}
  </div>;
}
