'use client';

import { Archive, ArchiveRestore } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { setProjectArchivedAction } from '@/lib/actions/projects';

/**
 * Archive / restore with an explicit confirmation. Archiving never deletes
 * records, so the copy is precise about what changes.
 */
export function ProjectArchiveButton({
  id,
  isArchived,
  projectName,
}: {
  id: string;
  isArchived: boolean;
  projectName: string;
}) {
  return (
    <ConfirmDialog
      triggerLabel={isArchived ? 'Restore project' : 'Archive project'}
      triggerVariant={isArchived ? 'secondary' : 'ghost'}
      triggerSize="sm"
      triggerIcon={
        isArchived ? (
          <ArchiveRestore size={14} aria-hidden="true" />
        ) : (
          <Archive size={14} aria-hidden="true" />
        )
      }
      title={isArchived ? `Restore ${projectName}?` : `Archive ${projectName}?`}
      description={
        isArchived
          ? 'The project becomes active again and the team can create new tickets against it.'
          : 'Nothing is deleted. Existing tickets and photos stay available, but new tickets cannot be created until the project is restored.'
      }
      confirmLabel={isArchived ? 'Restore project' : 'Archive project'}
      pendingLabel={isArchived ? 'Restoring…' : 'Archiving…'}
      tone={isArchived ? 'primary' : 'danger'}
      onConfirm={() => setProjectArchivedAction(id, !isArchived)}
    />
  );
}
