import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BriefcaseBusiness, MapPin, Plus, Tag } from 'lucide-react';
import { requireWorkspace } from '@/lib/data/workspace';
import { PageHeader, EmptyState, DataSetupMessage } from '@/components/workspace/app-page';
import { ButtonLink } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Projects' };

export default async function ProjectsPage() {
  const { supabase, workspace } = await requireWorkspace();
  const { data: projects, error } = await supabase.from('projects').select('id, name, project_number, site_address, general_contractor, is_archived, updated_at').eq('company_id', workspace.id).order('updated_at', { ascending: false });
  if (error) return <><PageHeader title="Projects" description="Keep job details and extra-work records together." /><DataSetupMessage /></>;

  const active = (projects || []).filter((project) => !project.is_archived);
  const archived = (projects || []).filter((project) => project.is_archived);
  return <>
    <PageHeader eyebrow="Your work" title="Projects" description="The jobsite details behind each work record." action={<ButtonLink href="/projects/new"><Plus size={17} />New project</ButtonLink>} />
    {!projects?.length ? <EmptyState icon={<BriefcaseBusiness size={22} />} title="Start with a project" description="Create your first project with its job number, site, and general contractor. Your tickets will stay connected to it." action={<ButtonLink href="/projects/new"><Plus size={17} />Create a project</ButtonLink>} /> : <>
      {active.length === 0 && <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">All your projects are archived. Restore a project to create new tickets, or add a new one.</div>}
      <div className="grid gap-4 lg:grid-cols-2">
        {active.map((project) => <Link key={project.id} href={`/projects/${project.id}`} className="group rounded-2xl border border-line bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lift sm:p-6">
          <div className="flex items-start justify-between gap-4"><span className="grid h-11 w-11 place-items-center rounded-xl bg-orange/10 text-orange"><BriefcaseBusiness size={19} /></span><ArrowRight size={18} className="mt-1 text-slate-300 transition group-hover:translate-x-1 group-hover:text-orange" /></div>
          <h2 className="mt-5 text-lg font-bold tracking-tight text-ink">{project.name}</h2>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
            {project.project_number && <span className="inline-flex items-center gap-1.5"><Tag size={13} />{project.project_number}</span>}
            {project.site_address && <span className="inline-flex items-center gap-1.5"><MapPin size={13} />{project.site_address}</span>}
          </div>
          {project.general_contractor && <p className="mt-4 border-t border-line pt-3 text-xs text-muted">General contractor <span className="font-semibold text-ink">{project.general_contractor}</span></p>}
        </Link>)}
      </div>
      {archived.length > 0 && <section className="mt-10"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold text-ink">Archived projects</h2><span className="text-xs text-muted">{archived.length}</span></div><div className="divide-y divide-line rounded-2xl border border-line bg-white">{archived.map((project) => <Link key={project.id} href={`/projects/${project.id}`} className="flex items-center justify-between gap-3 p-4 text-sm hover:bg-slate-50"><span><span className="font-semibold text-ink">{project.name}</span>{project.project_number && <span className="ml-2 text-xs text-muted">{project.project_number}</span>}</span><span className="text-xs text-muted">Archived</span></Link>)}</div></section>}
    </>}
  </>;
}
