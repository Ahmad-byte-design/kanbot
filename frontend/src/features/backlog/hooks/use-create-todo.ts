import { useMutation, useQueryClient } from '@tanstack/react-query';
import { todosService } from '../../../services/todos';
import type { CreateTodoRequest, Todo } from '../../../types/api';
import { invalidateTodoDependents, syncBacklogTodo } from '../lib/backlog-cache';
import { todoKeys } from '../query-keys';

/** BL-2: create a todo and make it appear at the end of the backlog immediately. */
export function useCreateTodo(projectId: string) {
  const queryClient = useQueryClient();
  const key = todoKeys.backlog(projectId);

  return useMutation<Todo, unknown, CreateTodoRequest>({
    mutationFn: async (input) => (await todosService.create(projectId, input)).todo,
    onSuccess: (todo) => {
      queryClient.setQueryData<Todo[]>(key, (todos) => syncBacklogTodo(todos, todo, projectId));
      invalidateTodoDependents(queryClient, projectId);
    },
  });
}
