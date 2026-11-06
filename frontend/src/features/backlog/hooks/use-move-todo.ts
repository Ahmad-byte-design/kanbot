import { useMutation, useQueryClient } from '@tanstack/react-query';
import { todosService } from '../../../services/todos';
import type { Todo } from '../../../types/api';
import { syncBacklogTodo } from '../lib/backlog-cache';
import { reorderTodos } from '../lib/todo-meta';
import { todoKeys } from '../query-keys';
import type { MoveTodoInput } from '../types/todo.types';

interface MoveContext {
  previous?: Todo[];
}

/**
 * BL-5: reorder with an optimistic cache update. The previous list is kept in
 * the mutation context so a failed request restores the exact server order.
 */
export function useMoveTodo(projectId: string) {
  const queryClient = useQueryClient();
  const key = todoKeys.backlog(projectId);

  return useMutation<Todo, unknown, MoveTodoInput, MoveContext>({
    mutationFn: async ({ todoId, position }) => (await todosService.move(todoId, { position })).todo,
    onMutate: async ({ todoId, position }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Todo[]>(key);

      if (previous) {
        queryClient.setQueryData<Todo[]>(key, reorderTodos(previous, todoId, position));
      }

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData<Todo[]>(key, context.previous);
    },
    onSuccess: (todo) => {
      // The server clamps the position; re-sync from its answer.
      queryClient.setQueryData<Todo[]>(key, (todos) => syncBacklogTodo(todos, todo, projectId));
    },
  });
}
