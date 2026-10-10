'use client';

import { useMemo, useState } from 'react';
import { EvidencePanel, type EvidenceView } from './evidence-panel';

export function EvidenceCapture({ companyId, projects, tickets, evidence }: {
  companyId: string;
  projects: Array<{ id: string; name: string }>;
  tickets: Array<{ id: string; project_id: string; ticket_number: string }>;
  evidence: Array<EvidenceView & { project_id: string; ticket_id: string | null }>;
}) {
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [ticketId, setTicketId] = useState('');
  const selectedProject = projects.find((project) => project.id === projectId);
  const availableTickets = useMemo(() => tickets.filter((ticket) => ticket.project_id === projectId), [tickets, projectId]);
  const selectedTicket = availableTickets.find((ticket) => ticket.id === ticketId);
  const list = evidence.filter((item) => item.project_id === projectId && (ticketId ? item.ticket_id === ticketId : item.ticket_id === null));

  return <div className="space-y-5">
    <div className="card grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
      <div><label className="field-label" htmlFor="capture-project">Project</label><select id="capture-project" className="field-control" value={projectId} onChange={(event) => { setProjectId(event.target.value); setTicketId(''); }}><option value="" disabled>Choose a project</option>{projects.map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}</select></div>
      <div><label className="field-label" htmlFor="capture-ticket">Work ticket <span className="font-normal text-muted">(optional)</span></label><select id="capture-ticket" className="field-control" value={ticketId} onChange={(event) => setTicketId(event.target.value)}><option value="">Project only</option>{availableTickets.map((ticket) => <option value={ticket.id} key={ticket.id}>{ticket.ticket_number}</option>)}</select></div>
    </div>
    {selectedProject && <EvidencePanel key={`${projectId}:${ticketId}`} companyId={companyId} projectId={projectId} projectName={selectedProject.name} ticketId={selectedTicket?.id || null} ticketNumber={selectedTicket?.ticket_number || null} evidence={list} />}
    {!selectedProject && <div className="rounded-2xl border border-dashed border-line bg-white p-7 text-center text-sm text-muted">Choose an active project to add evidence.</div>}
  </div>;
}
