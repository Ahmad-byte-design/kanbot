import { useMutation, useQueryClient } from '@tanstack/react-query';
import { todosService } from '../../../services/todos';
import type { Todo } from '../../../types/api';
import { invalidateTodoDependents, syncBacklogTodo } from '../lib/backlog-cache';
import { todoKeys } from '../query-keys';
import type { UpdateTodoInput } from '../types/todo.types';

/**
 * BL-3 + BL-7: edit any field, including moving the todo to another sprint
 * (or back to the backlog). The server decides the new list position.
 */
export function useUpdateTodo(projectId: string) {
  const queryClient = useQueryClient();
  const key = todoKeys.backlog(projectId);

  return useMutation<Todo, unknown, UpdateTodoInput>({
    mutationFn: async ({ todoId, changes }) => (await todosService.update(todoId, changes)).todo,
    onSuccess: (todo) => {
      queryClient.setQueryData<Todo[]>(key, (todos) => syncBacklogTodo(todos, todo, projectId));
      invalidateTodoDependents(queryClient, projectId);
    },
  });
}
