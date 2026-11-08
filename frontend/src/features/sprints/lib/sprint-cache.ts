import type { QueryClient } from '@tanstack/react-query';
import type {
  SprintBoardResponse,
  SprintStats,
  Todo,
  TodoStatus,
} from '../../../types/api';
import { projectKeys } from '../../projects/query-keys';
import { todoKeys } from '../../backlog/query-keys';
import { sprintKeys } from '../query-keys';
import type { SprintColumns } from '../types/sprints.types';

const DEFAULT_DONE_STATUSES = ['done'] as const;

function renumberColumn(todos: Todo[]): Todo[] {
  return todos.map((todo, index) => (todo.order === index ? todo : { ...todo, order: index }));
}

/**
 * Stats from a board's columns. `doneStatusIds` comes from the project so
 * custom "counts as done" columns move the progress bar exactly like the
 * server does.
 */
export function statsFromColumns(
  columns: SprintColumns,
  doneStatusIds: readonly string[] = DEFAULT_DONE_STATUSES,
): SprintStats {
  const done = new Set(doneStatusIds);
  const byStatus: Record<TodoStatus, number> = {};
  let totalTodos = 0;
  let totalPoints = 0;
  let donePoints = 0;

  for (const status of Object.keys(columns)) {
    for (const todo of columns[status] ?? []) {
      byStatus[status] = (byStatus[status] ?? 0) + 1;
      totalTodos += 1;
      totalPoints += todo.storyPoints ?? 0;
      if (done.has(status)) donePoints += todo.storyPoints ?? 0;
    }
  }

  let doneTodos = 0;
  for (const status of done) doneTodos += byStatus[status] ?? 0;

  return { totalTodos, doneTodos, totalPoints, donePoints, byStatus };
}

/**
 * Optimistic version of `POST /todos/:id/move` for a sprint board.
 *
 * Unlike the backlog, a sprint's `order` is scoped to each status column:
 * removing the card from its source column shifts every later position, then
 * the card is inserted at `position` in the target column and both columns are
 * renumbered 0..n-1. Stats are recomputed so the progress bar moves at once.
 *
 * Column keys come from the board itself, not a fixed status list, so a todo
 * can move into a status the project added after the board first loaded.
 */
export function moveBoardTodo(
  data: SprintBoardResponse,
  todoId: string,
  status: TodoStatus,
  position: number,
  doneStatusIds: readonly string[] = DEFAULT_DONE_STATUSES,
): SprintBoardResponse {
  const statusKeys = Object.keys(data.columns);
  const sourceStatus = statusKeys.find((key) =>
    (data.columns[key] ?? []).some((todo) => todo.id === todoId),
  );
  if (!sourceStatus) return data;

  const keys = statusKeys.includes(status) ? statusKeys : [...statusKeys, status];
  const columns = Object.fromEntries(
    keys.map((key) => [key, [...(data.columns[key] ?? [])]]),
  ) as SprintColumns;

  const from = columns[sourceStatus].findIndex((todo) => todo.id === todoId);
  if (from < 0) return data;

  const [todo] = columns[sourceStatus].splice(from, 1);
  if (!todo) return data;

  const target = columns[status] ?? (columns[status] = []);
  const clamped = Math.max(0, Math.min(position, target.length));
  target.splice(clamped, 0, { ...todo, status });

  for (const key of keys) columns[key] = renumberColumn(columns[key] ?? []);

  return {
    sprint: { ...data.sprint, stats: statsFromColumns(columns, doneStatusIds) },
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
