import type { QueryClient } from '@tanstack/react-query';
import type { Todo } from '../../../types/api';
import { projectKeys } from '../../projects/query-keys';
import { sprintKeys, todoKeys } from '../query-keys';

/** Server order: `order` first, then creation time as a stable tie-breaker. */
export function byOrder(a: Todo, b: Todo): number {
  return a.order - b.order || a.createdAt.localeCompare(b.createdAt);
}

/**
 * Puts a freshly saved todo in the right place in the backlog cache:
 * - backlog todo → replace the row (or append it), then re-sort by `order`
 * - sprint todo  → it left the backlog, so drop it
 */
export function syncBacklogTodo(
  todos: Todo[] | undefined,
  todo: Todo,
  projectId: string,
): Todo[] | undefined {
  if (todo.projectId !== projectId) return todos;

  const others = (todos ?? []).filter((item) => item.id !== todo.id);
  if (todo.sprintId !== null) return others;

  return [...others, todo].sort(byOrder);
}

/**
 * Counters live outside the backlog query (project cards, workspace header and
 * sprint stats), so every create/update/delete refreshes them. The backlog
 * itself is updated optimistically by each mutation.
 */
export function invalidateTodoDependents(queryClient: QueryClient, projectId: string) {
  void queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
  void queryClient.invalidateQueries({ queryKey: projectKeys.list() });
  void queryClient.invalidateQueries({ queryKey: sprintKeys.project(projectId) });
  void queryClient.invalidateQueries({ queryKey: todoKeys.project(projectId) });
}
