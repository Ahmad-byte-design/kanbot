import { useMutation, useQueryClient } from '@tanstack/react-query';
import { todosService } from '../../../services/todos';
import type { SprintBoardResponse, Todo } from '../../../types/api';
import { projectKeys } from '../../projects/query-keys';
import type { ProjectListItem } from '../../projects/types/projects.types';
import { sprintKeys } from '../query-keys';
import { moveBoardTodo } from '../lib/sprint-cache';
import type { MoveBoardTodoInput } from '../types/sprints.types';

interface MoveContext {
  previous?: SprintBoardResponse;
}

/**
 * SPR-5: move cards between or within status columns with an optimistic board
 * update. The previous response is restored exactly if the server rejects the
 * move, and the sprint list/project counters refresh after success.
 */
export function useMoveBoardTodo(projectId: string, sprintId: string) {
  const queryClient = useQueryClient();
  const key = sprintKeys.board(projectId, sprintId);

  return useMutation<Todo, unknown, MoveBoardTodoInput, MoveContext>({
    mutationFn: async ({ todoId, status, position }) =>
      (await todosService.move(todoId, { status, position })).todo,
    onMutate: async ({ todoId, status, position }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<SprintBoardResponse>(key);

      if (previous) {
        // The project owns the status list, so custom "done" columns must also
        // move the optimistic progress bar.
        const project = queryClient.getQueryData<ProjectListItem>(
          projectKeys.detail(projectId),
        );
        const doneStatusIds = project?.statuses.filter((s) => s.done).map((s) => s.id);

        queryClient.setQueryData<SprintBoardResponse>(
          key,
          moveBoardTodo(previous, todoId, status, position, doneStatusIds),
        );
      }

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sprintKeys.list(projectId) });
      void queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      void queryClient.invalidateQueries({ queryKey: projectKeys.list() });
    },
  });
}
