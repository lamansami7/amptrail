'use client';

import { useMemo, useState } from 'react';
import { FolderKanban } from 'lucide-react';
import { EvidencePanel, type EvidenceView } from './evidence-panel';
import { Card, CardHeader } from '@/components/ui/card';
import { Field, Select } from '@/components/ui/field';
import { EmptyState } from '@/components/ui/empty-state';
import { pluralize } from '@/lib/utils';

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
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '');
  const [ticketId, setTicketId] = useState('');

  const selectedProject = projects.find((project) => project.id === projectId);
  const availableTickets = useMemo(
    () => tickets.filter((ticket) => ticket.project_id === projectId),
    [tickets, projectId]
  );
  const selectedTicket = availableTickets.find((ticket) => ticket.id === ticketId);
  const visibleEvidence = evidence.filter(
    (item) => item.project_id === projectId && (ticketId ? item.ticket_id === ticketId : true)
  );

  return (
    <div className="space-y-6">
      <Card flush>
        <CardHeader
          title="Where does this photo belong?"
          description="Choose the jobsite first, then optionally tie the photo to one ticket."
          icon={<FolderKanban size={16} aria-hidden="true" />}
          bordered
        />
        <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <Field id="capture-project" label="Project" required>
            {(props) => (
              <Select
                {...props}
                value={projectId}
                onChange={(event) => {
                  setProjectId(event.target.value);
                  setTicketId('');
                }}
              >
                <option value="" disabled>
                  Choose a project…
                </option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field
            id="capture-ticket"
            label="Work ticket"
            optional
            hint={
              availableTickets.length
                ? 'Leave empty for general jobsite evidence.'
                : 'No tickets exist for this project yet.'
            }
          >
            {(props) => (
              <Select
                {...props}
                value={ticketId}
                onChange={(event) => setTicketId(event.target.value)}
              >
                <option value="">All project photos</option>
                {availableTickets.map((ticket) => (
                  <option key={ticket.id} value={ticket.id}>
                    Ticket {ticket.ticket_number}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
      </Card>

      {selectedProject ? (
        <>
          <EvidencePanel
            key={`${projectId}:${ticketId}`}
            companyId={companyId}
            projectId={projectId}
            projectName={selectedProject.name}
            ticketId={selectedTicket?.id ?? null}
            ticketNumber={selectedTicket?.ticket_number ?? null}
            evidence={visibleEvidence}
            hideTitle
          />
          <p className="text-[12px] text-muted">
            Showing {pluralize(visibleEvidence.length, 'photo')} for{' '}
            <span className="font-medium text-body">{selectedProject.name}</span>
            {selectedTicket ? ` · ticket ${selectedTicket.ticket_number}` : ''}.
          </p>
        </>
      ) : (
        <EmptyState
          icon={<FolderKanban size={20} aria-hidden="true" />}
          tone="neutral"
          title="Choose a project to continue"
          description="Evidence is always attached to a jobsite so photos stay organized and correctly scoped."
        />
      )}
    </div>
  );
}
