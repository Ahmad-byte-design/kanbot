import { useMutation, useQueryClient } from '@tanstack/react-query';
import { todosService } from '../../../services/todos';
import type { BulkCreateTodosResponse, CreateTodoRequest } from '../../../types/api';
import { invalidateCreatedTodos } from '../lib/ai-cache';

/** AI-2: save only the drafts the user kept. */
export function useBulkCreateTodos(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation<BulkCreateTodosResponse, unknown, CreateTodoRequest[]>({
    mutationFn: (todos) => todosService.bulkCreate(projectId, { todos }),
    onSuccess: () => invalidateCreatedTodos(queryClient, projectId),
  });
}
