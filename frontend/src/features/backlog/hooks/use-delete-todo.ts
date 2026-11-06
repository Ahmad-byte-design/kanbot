import { useMutation, useQueryClient } from '@tanstack/react-query';
import { todosService } from '../../../services/todos';
import type { Todo } from '../../../types/api';
import { invalidateTodoDependents } from '../lib/backlog-cache';
import { todoKeys } from '../query-keys';

interface DeleteContext {
  previous?: Todo[];
}

/** BL-4: delete optimistically; put the row back if the server rejects it. */
export function useDeleteTodo(projectId: string) {
  const queryClient = useQueryClient();
  const key = todoKeys.backlog(projectId);

  return useMutation<void, unknown, string, DeleteContext>({
    mutationFn: (todoId) => todosService.remove(todoId),
    onMutate: async (todoId) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Todo[]>(key);

      if (previous) {
        queryClient.setQueryData<Todo[]>(
          key,
          previous.filter((todo) => todo.id !== todoId),
        );
      }

      return { previous };
    },
    onError: (_error, _todoId, context) => {
      if (context?.previous) queryClient.setQueryData<Todo[]>(key, context.previous);
    },
    onSuccess: () => invalidateTodoDependents(queryClient, projectId),
  });
}
