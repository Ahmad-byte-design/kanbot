import type { QueryClient } from '@tanstack/react-query';
import {
  TODO_STATUSES,
  type SprintBoardResponse,
  type SprintStats,
  type Todo,
  type TodoStatus,
} from '../../../types/api';
import { projectKeys } from '../../projects/query-keys';
import { todoKeys } from '../../backlog/query-keys';
import { sprintKeys } from '../query-keys';
import type { SprintColumns } from '../types/sprints.types';

function renumberColumn(todos: Todo[]): Todo[] {
  return todos.map((todo, index) => (todo.order === index ? todo : { ...todo, order: index }));
}

export function statsFromColumns(columns: SprintColumns): SprintStats {
  const byStatus = Object.fromEntries(TODO_STATUSES.map((status) => [status, 0])) as Record<
    TodoStatus,
    number
  >;
  let totalTodos = 0;
  let totalPoints = 0;
  let donePoints = 0;

  for (const status of TODO_STATUSES) {
    for (const todo of columns[status]) {
      byStatus[status] += 1;
      totalTodos += 1;
      totalPoints += todo.storyPoints ?? 0;
      if (status === 'done') donePoints += todo.storyPoints ?? 0;
    }
  }

  return { totalTodos, doneTodos: byStatus.done, totalPoints, donePoints, byStatus };
}

/**
 * Optimistic version of `POST /todos/:id/move` for a sprint board.
 *
 * Unlike the backlog, a sprint's `order` is scoped to each status column:
 * removing the card from its source column shifts every later position, then
 * the card is inserted at `position` in the target column and both columns are
 * renumbered 0..n-1. Stats are recomputed so the progress bar moves at once.
 */
export function moveBoardTodo(
  data: SprintBoardResponse,
  todoId: string,
  status: TodoStatus,
  position: number,
): SprintBoardResponse {
  const sourceStatus = TODO_STATUSES.find((key) =>
    data.columns[key].some((todo) => todo.id === todoId),
  );
  if (!sourceStatus) return data;

  const columns = Object.fromEntries(
    TODO_STATUSES.map((key) => [key, [...data.columns[key]]]),
  ) as SprintColumns;

  const from = columns[sourceStatus].findIndex((todo) => todo.id === todoId);
  if (from < 0) return data;

  const [todo] = columns[sourceStatus].splice(from, 1);
  if (!todo) return data;

  const target = columns[status];
  const clamped = Math.max(0, Math.min(position, target.length));
  target.splice(clamped, 0, { ...todo, status });

  for (const key of TODO_STATUSES) columns[key] = renumberColumn(columns[key]);

  return {
    sprint: { ...data.sprint, stats: statsFromColumns(columns) },
    columns,
  };
}

/**
 * Everything that reads sprint data for a project: the list, the history
 * detail, the board, the workspace counters and the planned-section todos.
 */
export function invalidateSprintDependents(queryClient: QueryClient, projectId: string) {
  void queryClient.invalidateQueries({ queryKey: sprintKeys.project(projectId) });
  void queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
  void queryClient.invalidateQueries({ queryKey: projectKeys.list() });
  void queryClient.invalidateQueries({ queryKey: todoKeys.project(projectId) });
}

/** Sprint deletion/completion can move todos back into the backlog. */
export function invalidateSprintAndBacklog(queryClient: QueryClient, projectId: string) {
  invalidateSprintDependents(queryClient, projectId);
  void queryClient.invalidateQueries({ queryKey: todoKeys.backlog(projectId) });
}
