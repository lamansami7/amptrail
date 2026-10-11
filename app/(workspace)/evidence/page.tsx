import type { Metadata } from 'next';
import Link from 'next/link';
import { Camera, ImagePlus, Receipt } from 'lucide-react';
import { requireWorkspace } from '@/lib/data/workspace';
import { PageHeader, DataSetupMessage, EmptyState } from '@/components/workspace/app-page';
import { ButtonLink } from '@/components/ui/button';
import { EvidenceCapture } from '@/components/evidence/evidence-capture';
import type { EvidenceView } from '@/components/evidence/evidence-panel';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Evidence' };

export default async function EvidencePage() {
  const { supabase, user, workspace } = await requireWorkspace();

  const [{ data: projects, error: projectError }, { data: evidence, error: evidenceError }] =
    await Promise.all([
      supabase
        .from('projects')
        .select('id, name, is_archived')
        .eq('company_id', workspace.id)
        .order('name'),
      supabase
        .from('evidence_files')
        .select('*')
        .eq('company_id', workspace.id)
        .order('created_at', { ascending: false })
        .limit(100),
    ]);

  if (projectError || evidenceError) {
    return (
      <>
        <PageHeader title="Evidence" description="Photos and field context, attached to a project or ticket." />
        <DataSetupMessage />
      </>
    );
  }

  const activeProjects = (projects || []).filter((project) => !project.is_archived);
  const tickets = activeProjects.length
    ? await supabase
        .from('work_tickets')
        .select('id, project_id, ticket_number')
        .eq('company_id', workspace.id)
        .in('project_id', activeProjects.map((project) => project.id))
        .order('occurred_at', { ascending: false })
    : { data: [], error: null };

  if (tickets.error) {
    return (
      <>
        <PageHeader title="Evidence" />
        <DataSetupMessage />
      </>
    );
  }

  const projectsById = new Map((projects || []).map((project) => [project.id, project.name]));
  const ticketsById = new Map((tickets.data || []).map((ticket) => [ticket.id, ticket.ticket_number]));

  const evidenceRows = evidence || [];
  const signedEvidence = evidenceRows.length
    ? await supabase.storage.from('evidence').createSignedUrls(evidenceRows.map((item) => item.storage_path), 3600)
    : { data: [], error: null };
  const signedUrlByPath = new Map((signedEvidence.data || []).map((item) => [item.path || '', item.signedUrl]));

  const captureEvidence: Array<EvidenceView & { project_id: string; ticket_id: string | null }> =
    evidenceRows.map((item) => ({
      ...item,
      signedUrl: signedUrlByPath.get(item.storage_path) || null,
      canDelete: item.uploaded_by === user.id,
    }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Jobsite Photo Records"
        title="Photo Evidence"
        description="Store high-resolution field photos with captions and notes. Securely tied to commercial electrical projects and T&M work tickets."
      />

      {!activeProjects.length ? (
        <EmptyState
          icon={<Camera size={22} />}
          title="Create a project before uploading photos"
          description="Evidence is stored securely under a project so photos remain organized and isolated by jobsite."
          action={
            <ButtonLink href="/projects/new">
              <ImagePlus size={16} /> Create First Project
            </ButtonLink>
          }
        />
      ) : (
        <EvidenceCapture
          companyId={workspace.id}
          projects={activeProjects.map(({ id, name }) => ({ id, name }))}
          tickets={tickets.data || []}
          evidence={captureEvidence}
        />
      )}

      {/* Global Recent Evidence Feed */}
      {captureEvidence.length > 0 && (
        <section className="card p-6 mt-8">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Workspace Photo Trail</h2>
              <p className="text-xs text-slate-500">
                Latest jobsite captures across all projects ({captureEvidence.length} total photos)
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              Showing {Math.min(12, captureEvidence.length)} most recent
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {captureEvidence.slice(0, 12).map((item) => (
              <div
                key={item.id}
                className="group flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs transition hover:border-slate-300"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100">
                  {item.signedUrl ? (
                    <img
                      src={item.signedUrl}
                      alt={item.caption || item.original_filename}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-xs text-slate-400">
                      Private preview unavailable
                    </div>
                  )}
                </div>

                <div className="p-3">
                  <p className="truncate text-xs font-bold text-slate-900">
                    {item.caption || item.original_filename}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {projectsById.get(item.project_id) || 'Project'} · {formatDate(item.created_at)}
                  </p>
                  {item.ticket_id && ticketsById.get(item.ticket_id) && (
                    <Link
                      href={`/tickets/${item.ticket_id}`}
                      className="mt-2 inline-flex items-center gap-1 font-mono text-[11px] font-bold text-blue-600 hover:underline"
                    >
                      <Receipt size={12} />
                      Ticket {ticketsById.get(item.ticket_id)}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
