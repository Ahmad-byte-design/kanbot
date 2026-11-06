import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ConfirmDialog } from '../../../components/ui';
import { errorMessage } from '../../../services/client';
import { PROJECT_ROUTES } from '../constants/projects.constants';
import { useDeleteProject } from '../hooks/use-delete-project';
import type { ProjectListItem } from '../types/projects.types';

interface DeleteProjectDialogProps {
  project: ProjectListItem;
  onClose: () => void;
}

/**
 * PRJ-4: deleting is irreversible, so the confirmation names the project and
 * spells out exactly what disappears with it.
 */
export function DeleteProjectDialog({ project, onClose }: DeleteProjectDialogProps) {
  const navigate = useNavigate();
  const deleteProject = useDeleteProject();
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setError(null);

    try {
      await deleteProject.mutateAsync(project.id);
      onClose();
      navigate(PROJECT_ROUTES.list, { replace: true });
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  return (
    <ConfirmDialog
      open
      destructive
      onClose={deleteProject.isPending ? () => {} : onClose}
      onConfirm={handleConfirm}
      title={`Delete “${project.name}”?`}
      description={`This permanently deletes ${project.name} and everything in it: every todo and every sprint. This cannot be undone.`}
      confirmLabel="Delete project"
      cancelLabel="Keep project"
      loading={deleteProject.isPending}
      error={error}
    />
  );
}
