import { useState } from 'react';
import { ConfirmDialog } from '../../../components/ui';
import { errorMessage } from '../../../services/client';
import type { Todo } from '../../../types/api';
import { TODO_MESSAGES } from '../constants/backlog.constants';
import { useDeleteTodo } from '../hooks/use-delete-todo';

interface DeleteTodoDialogProps {
  projectId: string;
  todo: Todo;
  onClose: () => void;
}

/** BL-4: a row-menu delete always confirms first. */
export function DeleteTodoDialog({ projectId, todo, onClose }: DeleteTodoDialogProps) {
  const deleteTodo = useDeleteTodo(projectId);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setError(null);

    try {
      await deleteTodo.mutateAsync(todo.id);
      onClose();
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  return (
    <ConfirmDialog
      open
      destructive
      onClose={deleteTodo.isPending ? () => {} : onClose}
      onConfirm={handleConfirm}
      title={`Delete ${todo.key}?`}
      description={`“${todo.title}” will be removed from the backlog. ${TODO_MESSAGES.deleteWarning}`}
      confirmLabel="Delete todo"
      cancelLabel="Keep todo"
      loading={deleteTodo.isPending}
      error={error}
    />
  );
}
