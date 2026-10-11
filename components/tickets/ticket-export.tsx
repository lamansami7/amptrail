'use client';

import { useState } from 'react';
import { Download, LoaderCircle, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateTicketTotals } from '@/lib/tickets/totals';
import { formatCurrency, formatDate, formatStatus } from '@/lib/utils';
import type { EvidenceView } from '@/components/evidence/evidence-panel';

type Labor = { worker_name: string; hours: number; rate: number; line_total: number };
type Cost = { description: string; quantity: number; unit_cost: number; line_total: number };
type ExportTicket = {
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

function wrap(doc: import('jspdf').jsPDF, text: string, x: number, y: number, width: number, size = 9.5) {
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
      if (!context) {
        reject(new Error('Canvas unavailable'));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    image.onerror = () => reject(new Error('Image load failed'));
    image.src = url;
  });
}

export function TicketExport({
  companyName,
  ticket,
  project,
  labor,
  materials,
  costs,
  evidence,
}: {
  companyName?: string;
  ticket: ExportTicket;
  project: {
    name: string;
    project_number: string | null;
    site_address: string | null;
    general_contractor: string | null;
  };
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
      const left = 44;
      const right = pageWidth - 44;
      const contentWidth = right - left;
      let y = 46;

      // Color Palette
      const navy: [number, number, number] = [15, 23, 42]; // Slate-900
      const blue: [number, number, number] = [37, 99, 235]; // Blue-600
      const slate: [number, number, number] = [100, 116, 139]; // Slate-500
      const slateLight: [number, number, number] = [241, 245, 249]; // Slate-100
      const borderLine: [number, number, number] = [226, 232, 240]; // Slate-200

      const ensureRoom = (height: number) => {
        if (y + height > pageHeight - 65) {
          doc.addPage();
          y = 48;
        }
      };

      const sectionTitle = (title: string) => {
        ensureRoom(28);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...blue);
        doc.text(title.toUpperCase(), left, y);
        y += 6;
        doc.setDrawColor(...borderLine);
        doc.setLineWidth(0.8);
        doc.line(left, y, right, y);
        y += 14;
      };

      // 1. TOP HEADER BANNER
      doc.setFillColor(...navy);
      doc.roundedRect(left, y - 16, contentWidth, 80, 8, 8, 'F');

      // Bolt Icon Box
      doc.setFillColor(...blue);
      doc.roundedRect(left + 16, y - 2, 28, 28, 6, 6, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('⚡', left + 24, y + 18);

      // Subcontractor & App Title
      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      doc.text((companyName || 'AMPTRAIL ELECTRICAL').toUpperCase(), left + 54, y + 10);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(190, 205, 225);
      doc.text('TIME & MATERIAL WORK TICKET RECORD', left + 54, y + 24);

      // Ticket Number & Status on right
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      doc.text(ticket.ticket_number, right - 16, y + 10, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(190, 205, 225);
      doc.text(`Tracking Status: ${formatStatus(ticket.status)}`, right - 16, y + 24, { align: 'right' });

      y += 82;

      // Disclaimer Banner
      doc.setFillColor(254, 243, 199); // Amber-100
      doc.roundedRect(left, y - 8, contentWidth, 24, 4, 4, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(146, 64, 14); // Amber-800
      doc.text(
        'NOTICE: Field documentation record. Status and amounts do not imply customer approval, change order agreement, or guaranteed invoice payment.',
        left + 10,
        y + 7
      );
      y += 32;

      // 2. PROJECT & JOBSITE INFORMATION (2-Column Box)
      sectionTitle('Project & Work Location');
      doc.setFillColor(...slateLight);
      doc.roundedRect(left, y - 6, contentWidth, 68, 6, 6, 'F');

      const col1 = left + 14;
      const col2 = left + contentWidth * 0.52;

      // Left Column
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...slate);
      doc.text('PROJECT NAME', col1, y + 6);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...navy);
      doc.text(project.name || '—', col1, y + 18);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...slate);
      doc.text('GENERAL CONTRACTOR', col1, y + 36);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...navy);
      doc.text(project.general_contractor || '—', col1, y + 48);

      // Right Column
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...slate);
      doc.text('PROJECT / JOB #', col2, y + 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...navy);
      doc.text(project.project_number || '—', col2, y + 18);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...slate);
      doc.text('JOBSITE ADDRESS', col2, y + 36);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...navy);
      const addr = doc.splitTextToSize(project.site_address || '—', contentWidth * 0.44) as string[];
      doc.text(addr.slice(0, 1), col2, y + 48);

      y += 76;

      // Work Date & Representative Row
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...slate);
      doc.text('DATE PERFORMED', left, y);
      doc.text('WORK AREA / LOCATION', left + contentWidth * 0.4, y);
      doc.text('CUSTOMER / GC REP', left + contentWidth * 0.72, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...navy);
      doc.text(formatDate(ticket.occurred_at, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }), left, y + 12);
      doc.text(ticket.location || '—', left + contentWidth * 0.4, y + 12);
      doc.text(ticket.gc_representative || '—', left + contentWidth * 0.72, y + 12);

      y += 26;

      // 3. WORK DESCRIPTION
      sectionTitle('Extra Work Description');
      y = wrap(doc, ticket.description, left, y, contentWidth, 9.5) + 6;

      if (ticket.out_of_scope_reason) {
        ensureRoom(40);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...slate);
        doc.text('REASON OUTSIDE ORIGINAL SCOPE', left, y);
        y += 12;
        y = wrap(doc, ticket.out_of_scope_reason, left, y, contentWidth, 9) + 8;
      }

      // 4. LINE ITEM TABLES (Labor, Materials, Costs)
      const renderTable = (
        title: string,
        headers: [string, string, string, string],
        rows: Array<{ a: string; b: string; c: string; d: string }>,
        subtotal: number
      ) => {
        sectionTitle(title);
        if (!rows.length) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(...slate);
          doc.text('No entries recorded for this section.', left, y);
          y += 16;
          return;
        }

        // Table Header Row
        doc.setFillColor(248, 250, 252);
        doc.rect(left, y - 8, contentWidth, 18, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(...slate);
        doc.text(headers[0], left + 6, y + 4);
        doc.text(headers[1], left + contentWidth * 0.58, y + 4, { align: 'right' });
        doc.text(headers[2], left + contentWidth * 0.78, y + 4, { align: 'right' });
        doc.text(headers[3], right - 6, y + 4, { align: 'right' });
        y += 16;

        // Rows
        rows.forEach((row) => {
          ensureRoom(20);
          doc.setDrawColor(...borderLine);
          doc.setLineWidth(0.5);
          doc.line(left, y + 8, right, y + 8);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(...navy);
          const clipped = doc.splitTextToSize(row.a, contentWidth * 0.52) as string[];
          doc.text(clipped.slice(0, 2), left + 6, y + 4);
          doc.text(row.b, left + contentWidth * 0.58, y + 4, { align: 'right' });
          doc.text(row.c, left + contentWidth * 0.78, y + 4, { align: 'right' });
          doc.setFont('helvetica', 'bold');
          doc.text(row.d, right - 6, y + 4, { align: 'right' });

          y += Math.max(18, clipped.slice(0, 2).length * 10 + 6);
        });

        // Subtotal row
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(...slate);
        doc.text(`${title} Subtotal`, left + contentWidth * 0.78, y + 6, { align: 'right' });
        doc.setTextColor(...navy);
        doc.text(formatCurrency(subtotal), right - 6, y + 6, { align: 'right' });
        y += 18;
      };

      const totals = calculateTicketTotals({
        labor: labor.map((l) => ({ hours: l.hours, rate: l.rate })),
        materials: materials.map((m) => ({ quantity: m.quantity, unit_cost: m.unit_cost })),
        costs: costs.map((c) => ({ quantity: c.quantity, unit_cost: c.unit_cost })),
      });

      renderTable(
        'Labor Entries',
        ['WORKER / ROLE', 'HOURS', 'RATE', 'LINE TOTAL'],
        labor.map((l) => ({
          a: l.worker_name,
          b: `${l.hours} hrs`,
          c: `${formatCurrency(l.rate)}/hr`,
          d: formatCurrency(l.line_total),
        })),
        totals.labor
      );

      renderTable(
        'Materials Installed',
        ['DESCRIPTION', 'QTY', 'UNIT COST', 'LINE TOTAL'],
        materials.map((m) => ({
          a: m.description,
          b: String(m.quantity),
          c: formatCurrency(m.unit_cost),
          d: formatCurrency(m.line_total),
        })),
        totals.materials
      );

      renderTable(
        'Equipment & Other Direct Costs',
        ['DESCRIPTION', 'QTY', 'UNIT COST', 'LINE TOTAL'],
        costs.map((c) => ({
          a: c.description,
          b: String(c.quantity),
          c: formatCurrency(c.unit_cost),
          d: formatCurrency(c.line_total),
        })),
        totals.other
      );

      // 5. TOTALS SUMMARY BOX
      ensureRoom(75);
      doc.setFillColor(...navy);
      doc.roundedRect(left, y, contentWidth, 60, 6, 6, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(190, 205, 225);
      doc.text('LABOR', left + 16, y + 20);
      doc.text('MATERIALS', left + contentWidth * 0.32, y + 20);
      doc.text('OTHER COSTS', left + contentWidth * 0.6, y + 20);
      doc.setTextColor(147, 197, 253);
      doc.text('TOTAL DOCUMENTED COST', right - 16, y + 20, { align: 'right' });

      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text(formatCurrency(totals.labor), left + 16, y + 40);
      doc.text(formatCurrency(totals.materials), left + contentWidth * 0.32, y + 40);
      doc.text(formatCurrency(totals.other), left + contentWidth * 0.6, y + 40);

      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text(formatCurrency(totals.total), right - 16, y + 40, { align: 'right' });

      y += 75;

      // 6. ADDITIONAL NOTES (if any)
      if (ticket.notes) {
        ensureRoom(45);
        sectionTitle('Additional Observations');
        y = wrap(doc, ticket.notes, left, y, contentWidth, 9) + 8;
      }

      // 7. EVIDENCE REFERENCES OR IMAGES
      if (evidence.length > 0) {
        sectionTitle(`Supporting Evidence (${evidence.length} Photo${evidence.length === 1 ? '' : 's'})`);
        for (let i = 0; i < evidence.length; i++) {
          const item = evidence[i];
          let imgData = '';
          if (item.signedUrl && i < 6) {
            try {
              imgData = await imageToJpeg(item.signedUrl);
            } catch {
              // fallback gracefully
            }
          }

          if (imgData) {
            const w = 140;
            const h = 95;
            ensureRoom(h + 20);
            doc.addImage(imgData, 'JPEG', left, y, w, h);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.setTextColor(...navy);
            const caption = item.caption || item.original_filename;
            const lines = doc.splitTextToSize(caption, contentWidth - w - 16) as string[];
            doc.text(lines.slice(0, 2), left + w + 14, y + 14);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(...slate);
            doc.text(`Uploaded: ${formatDate(item.created_at)} · File: ${item.original_filename}`, left + w + 14, y + 30);
            if (item.notes) {
              wrap(doc, item.notes, left + w + 14, y + 44, contentWidth - w - 16, 7.5);
            }
            y += h + 14;
          } else {
            ensureRoom(20);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(...slate);
            y = wrap(
              doc,
              `• ${item.caption || item.original_filename} (Uploaded: ${formatDate(item.created_at)})${item.notes ? ` — ${item.notes}` : ''}`,
              left,
              y,
              contentWidth,
              8
            ) + 4;
          }
        }
      }

      // 8. FORMAL ACKNOWLEDGMENT / FIELD VERIFICATION BLOCK
      ensureRoom(80);
      sectionTitle('Field Verification & Acknowledgment');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...slate);
      doc.text(
        'Verification acknowledges that described field conditions and documented hours/materials were observed on site. This document does not replace contract requirements, change order agreements, or customer billing review.',
        left,
        y
      );
      y += 24;

      // Dual signature lines
      const sigWidth = 200;
      doc.setDrawColor(...slate);
      doc.setLineWidth(0.8);
      doc.line(left, y, left + sigWidth, y);
      doc.line(right - sigWidth, y, right, y);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...navy);
      doc.text('SUBMITTED BY (SUBCONTRACTOR)', left, y + 10);
      doc.text('VERIFIED BY (GC / CUSTOMER REP)', right - sigWidth, y + 10);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...slate);
      doc.text('Authorized Signature & Date', left, y + 20);
      doc.text('Representative Signature & Date', right - sigWidth, y + 20);

      // 9. PAGE NUMBERS & RUNNING FOOTER
      const totalPages = doc.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setDrawColor(...borderLine);
        doc.setLineWidth(0.5);
        doc.line(left, pageHeight - 32, right, pageHeight - 32);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...slate);
        doc.text(
          `${companyName || 'AmpTrail'} · Ticket ${ticket.ticket_number} · Performed ${formatDate(ticket.occurred_at)}`,
          left,
          pageHeight - 20
        );
        doc.text(`Page ${p} of ${totalPages}`, right, pageHeight - 20, { align: 'right' });
      }

      const filename = `${ticket.ticket_number.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}-work-record.pdf`;
      doc.save(filename);
      setMessage('PDF generated and downloaded successfully.');
    } catch (err) {
      console.error('PDF export error:', err);
      setMessage('PDF export failed. You can use the Print / Save as PDF button.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <Button type="button" onClick={downloadPdf} disabled={pending} className="min-w-36 shadow-xs">
        {pending ? <LoaderCircle size={15} className="animate-spin" /> : <Download size={15} />}
        {pending ? 'Generating PDF…' : 'Download PDF'}
      </Button>

      <Button
        type="button"
        variant="secondary"
        onClick={() => window.print()}
        className="min-w-32 shadow-xs"
      >
        <Printer size={15} />
        Print Record
      </Button>

      {message && (
        <span className="text-xs font-semibold text-slate-600 animate-fade-in" role="status">
          {message}
        </span>
      )}
    </div>
  );
}
