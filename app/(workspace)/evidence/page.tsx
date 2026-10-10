import type { Metadata } from 'next';
import Link from 'next/link';
import { Camera, ImagePlus } from 'lucide-react';
import { requireWorkspace } from '@/lib/data/workspace';
import { PageHeader, DataSetupMessage, EmptyState } from '@/components/workspace/app-page';
import { ButtonLink } from '@/components/ui/button';
import { EvidenceCapture } from '@/components/evidence/evidence-capture';
import type { EvidenceView } from '@/components/evidence/evidence-panel';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Evidence' };

export default async function EvidencePage() {
  const { supabase, user, workspace } = await requireWorkspace();
  const [{ data: projects, error: projectError }, { data: evidence, error: evidenceError }] = await Promise.all([
    supabase.from('projects').select('id, name, is_archived').eq('company_id', workspace.id).order('name'),
    supabase.from('evidence_files').select('*').eq('company_id', workspace.id).order('created_at', { ascending: false }).limit(100),
  ]);
  if (projectError || evidenceError) return <><PageHeader title="Evidence" description="Photos and field context, attached to a project or ticket." /><DataSetupMessage /></>;
  const activeProjects = (projects || []).filter((project) => !project.is_archived);
  const tickets = activeProjects.length ? await supabase.from('work_tickets').select('id, project_id, ticket_number').eq('company_id', workspace.id).in('project_id', activeProjects.map((project) => project.id)).order('occurred_at', { ascending: false }) : { data: [], error: null };
  if (tickets.error) return <><PageHeader title="Evidence" /><DataSetupMessage /></>;
  const projectsById = new Map((projects || []).map((project) => [project.id, project.name]));
  const ticketsById = new Map((tickets.data || []).map((ticket) => [ticket.id, ticket.ticket_number]));
  const evidenceRows = evidence || [];
  const signedEvidence = evidenceRows.length
    ? await supabase.storage.from('evidence').createSignedUrls(evidenceRows.map((item) => item.storage_path), 3600)
    : { data: [], error: null };
  const signedUrlByPath = new Map((signedEvidence.data || []).map((item) => [item.path || '', item.signedUrl]));
  const captureEvidence: Array<EvidenceView & { project_id: string; ticket_id: string | null }> = evidenceRows.map((item) => ({
    ...item,
    signedUrl: signedUrlByPath.get(item.storage_path) || null,
    canDelete: item.uploaded_by === user.id,
  }));
  const recentEvidence = captureEvidence.slice(0, 12);

  return <>
    <PageHeader eyebrow="Field capture" title="Evidence" description="Keep photos and short notes with the right project, and optionally the work ticket." />
    {!activeProjects.length ? <EmptyState icon={<Camera size={22} />} title="Add a project before capturing evidence" description="Evidence is stored with a project so it stays connected to the job. You can add a ticket association after creating a work record." action={<ButtonLink href="/projects/new"><ImagePlus size={16} />Create a project</ButtonLink>} /> : <EvidenceCapture companyId={workspace.id} projects={activeProjects.map(({ id, name }) => ({ id, name }))} tickets={tickets.data || []} evidence={captureEvidence} />}

    {recentEvidence.length > 0 && <section className="mt-9"><div className="mb-4 flex items-end justify-between gap-3"><div><h2 className="text-lg font-bold text-ink">Latest evidence</h2><p className="mt-1 text-sm text-muted">Private photo records from across your workspace.</p></div><span className="text-xs text-muted">Most recent {recentEvidence.length}</span></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {recentEvidence.map((item) => <article key={item.id} className="overflow-hidden rounded-2xl border border-line bg-white shadow-card"><div className="aspect-[16/10] bg-canvas">{item.signedUrl ? <img src={item.signedUrl} alt={item.caption || item.original_filename} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-xs text-muted">Private preview unavailable</div>}</div><div className="p-4"><p className="truncate text-sm font-bold text-ink">{item.caption || item.original_filename}</p><p className="mt-1 text-xs text-muted">{projectsById.get(item.project_id) || 'Project'} · {formatDate(item.created_at)}</p>{item.ticket_id && ticketsById.get(item.ticket_id) && <Link href={`/tickets/${item.ticket_id}`} className="mt-2 inline-block text-xs font-bold text-orange-dark hover:underline">Ticket {ticketsById.get(item.ticket_id)}</Link>}</div></article>)}
    </div></section>}
  </>;
}
