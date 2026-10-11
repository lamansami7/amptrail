'use client';

import { useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { buildWorkRecordPdf, workRecordFilename, type WorkRecordInput } from '@/lib/tickets/pdf';
import type { EvidenceView } from '@/components/evidence/evidence-panel';

type Labor = { worker_name: string; hours: number; rate: number; line_total: number };
type Cost = { description: string; quantity: number; unit_cost: number; line_total: number };
type ExportTicket = WorkRecordInput['ticket'];

/** Downscales a private, signed image into a JPEG data URL the PDF can embed. */
function imageToJpeg(url: string) {
  return new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const maxEdge = 1100;
      const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Canvas unavailable'));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
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
  project: WorkRecordInput['project'];
  labor: Labor[];
  materials: Cost[];
  costs: Cost[];
  evidence: EvidenceView[];
}) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState<'info' | 'warning'>('info');

  async function downloadPdf() {
    setPending(true);
    setMessage('');
    try {
      // Load up to six thumbnails; anything that fails is listed by caption
      // instead so the record never silently drops evidence.
      const images: Record<string, string> = {};
      const candidates = evidence.filter((item) => item.signedUrl).slice(0, 6);
      await Promise.all(
        candidates.map(async (item) => {
          try {
            images[item.id] = await imageToJpeg(item.signedUrl as string);
          } catch {
            /* falls back to a caption tile */
          }
        })
      );

      const doc = buildWorkRecordPdf({
        companyName,
        ticket,
        project,
        labor,
        materials,
        costs,
        evidence,
        images,
      });
      doc.save(workRecordFilename(ticket.ticket_number));
      setTone('info');
      setMessage('PDF downloaded.');
    } catch (error) {
      console.error('PDF export failed', error);
      setTone('warning');
      setMessage('The PDF could not be generated. Use Print instead, then choose “Save as PDF”.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={downloadPdf} loading={pending}>
          {!pending && <Download size={15} aria-hidden="true" />}
          {pending ? 'Building PDF…' : 'Download PDF'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => window.print()}
          title="Opens your browser print dialog — choose Save as PDF to keep a copy"
        >
          <Printer size={15} aria-hidden="true" />
          Print
        </Button>
      </div>

      <p
        role="status"
        aria-live="polite"
        className={`text-[12px] ${tone === 'warning' ? 'text-danger' : 'text-muted'}`}
      >
        {message ||
          'Blank signature lines are printed — AmpTrail does not record approvals.'}
      </p>
    </div>
  );
}
