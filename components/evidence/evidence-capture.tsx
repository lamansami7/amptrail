'use client';

import { useMemo, useState } from 'react';
import { EvidencePanel, type EvidenceView } from './evidence-panel';

export function EvidenceCapture({
  companyId,
  projects,
  tickets,
  evidence,
}: {
  companyId: string;
  projects: Array<{ id: string; name: string }>;
  tickets: Array<{ id: string; project_id: string; ticket_number: string }>;
  evidence: Array<EvidenceView & { project_id: string; ticket_id: string | null }>;
}) {
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [ticketId, setTicketId] = useState('');

  const selectedProject = projects.find((project) => project.id === projectId);
  const availableTickets = useMemo(
    () => tickets.filter((ticket) => ticket.project_id === projectId),
    [tickets, projectId]
  );
  const selectedTicket = availableTickets.find((ticket) => ticket.id === ticketId);

  const list = evidence.filter(
    (item) => item.project_id === projectId && (ticketId ? item.ticket_id === ticketId : true)
  );

  return (
    <div className="space-y-6">
      {/* Target Selector Card */}
      <div className="card p-5 sm:p-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Select Jobsite Context
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="capture-project">
              Target Project <span className="text-blue-600">*</span>
            </label>
            <div className="relative">
              <select
                id="capture-project"
                className="field-control"
                value={projectId}
                onChange={(e) => {
                  setProjectId(e.target.value);
                  setTicketId('');
                }}
              >
                <option value="" disabled>
                  Choose a project...
                </option>
                {projects.map((project) => (
                  <option value={project.id} key={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="capture-ticket">
              Associated Work Ticket <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <select
                id="capture-ticket"
                className="field-control"
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
              >
                <option value="">All Project Photos (or general jobsite evidence)</option>
                {availableTickets.map((ticket) => (
                  <option value={ticket.id} key={ticket.id}>
                    Ticket {ticket.ticket_number}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {selectedProject ? (
        <EvidencePanel
          key={`${projectId}:${ticketId}`}
          companyId={companyId}
          projectId={projectId}
          projectName={selectedProject.name}
          ticketId={selectedTicket?.id || null}
          ticketNumber={selectedTicket?.ticket_number || null}
          evidence={list}
        />
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
          Choose an active project above to capture or review jobsite evidence.
        </div>
      )}
    </div>
  );
}
