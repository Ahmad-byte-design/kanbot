import { useState } from 'react';
import { ConfirmDialog } from '../../../components/ui';
import { errorMessage } from '../../../services/client';
import type { Sprint } from '../../../types/api';
import { SPRINT_MESSAGES } from '../constants/sprints.constants';
import { useDeleteSprint } from '../hooks/use-delete-sprint';

interface DeleteSprintDialogProps {
  projectId: string;
  sprint: Sprint;
  onClose: () => void;
}

/** SPR-2: planned sprint deletion always confirms; todos return to backlog. */
export function DeleteSprintDialog({ projectId, sprint, onClose }: DeleteSprintDialogProps) {
  const deleteSprint = useDeleteSprint(projectId);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setError(null);

    try {
      await deleteSprint.mutateAsync(sprint.id);
      onClose();
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  return (
    <ConfirmDialog
      open
      destructive
      onClose={deleteSprint.isPending ? () => {} : onClose}
      onConfirm={() => void handleConfirm()}
      title={`${SPRINT_MESSAGES.deleteTitle} “${sprint.name}”?`}
      description={SPRINT_MESSAGES.deleteWarning}
      confirmLabel="Delete sprint"
      loading={deleteSprint.isPending}
      error={error}
    />
  );
}
