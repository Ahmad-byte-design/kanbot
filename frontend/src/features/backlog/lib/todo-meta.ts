import { TODO_STATUSES, type Sprint, type Todo, type TodoStatus } from '../../../types/api';
import type { TodoFilters, TodoFormValues } from '../types/todo.types';

/** Sum of story points, treating "no estimate" as 0. */
export function totalPoints(todos: Todo[]): number {
  return todos.reduce((sum, todo) => sum + (todo.storyPoints ?? 0), 0);
}

/** Case-insensitive match on key, title, description and labels. */
export function todoMatches(todo: Todo, filters: TodoFilters): boolean {
  if (filters.priority && todo.priority !== filters.priority) return false;
  if (filters.type && todo.type !== filters.type) return false;

  const search = filters.search.trim().toLowerCase();
  if (!search) return true;

  return [todo.key, todo.title, todo.description, ...todo.labels].some((field) =>
    field.toLowerCase().includes(search),
  );
}

export function hasActiveFilters(filters: TodoFilters): boolean {
  return filters.search.trim() !== '' || filters.priority !== '' || filters.type !== '';
}

/**
 * The server's position rules: the list is renumbered 0..n-1, so moving
 * `todoId` to `position` means removing it first, then inserting.
 */
export function reorderTodos(todos: Todo[], todoId: string, position: number): Todo[] {
  const from = todos.findIndex((todo) => todo.id === todoId);
  if (from < 0) return todos;

  const next = [...todos];
  const [moved] = next.splice(from, 1);
  if (!moved) return todos;

  const target = Math.max(0, Math.min(position, next.length));
  next.splice(target, 0, moved);

  return next.map((todo, index) => (todo.order === index ? todo : { ...todo, order: index }));
}

/** Drop-on-row semantics: insert before the row under the pointer. */
export function dropPosition(todos: Todo[], draggedId: string, overId: string): number {
  const from = todos.findIndex((todo) => todo.id === draggedId);
  const over = todos.findIndex((todo) => todo.id === overId);
  if (from < 0 || over < 0 || over === from) return from;

  return from < over ? over - 1 : over;
}

/**
 * Splits the backlog into status columns without re-sorting, so the global
 * backlog order survives inside every column.
 */
export function groupByStatus(todos: Todo[]): Record<TodoStatus, Todo[]> {
  const columns = Object.fromEntries(
    TODO_STATUSES.map((status) => [status, [] as Todo[]]),
  ) as Record<TodoStatus, Todo[]>;

  for (const todo of todos) columns[todo.status].push(todo);

  return columns;
}

/**
 * Position, in the list without this todo, that puts it at the top or bottom
 * of its own status column. The backlog is one global list, so the column edge
 * has to be translated into a backlog index before calling /todos/:id/move.
 */
export function columnEdgePosition(
  todos: Todo[],
  todoId: string,
  edge: 'top' | 'bottom',
): number {
  const current = todos.find((todo) => todo.id === todoId);
  if (!current) return 0;

  const others = todos.filter((todo) => todo.id !== todoId);
  const column = others.filter((todo) => todo.status === current.status);
  if (column.length === 0) return others.length;

  if (edge === 'top') return others.findIndex((todo) => todo.id === column[0]!.id);

  const last = column[column.length - 1]!;
  return others.findIndex((todo) => todo.id === last.id) + 1;
}

export function toTodoFormValues(todo: Todo): TodoFormValues {
  return {
    title: todo.title,
    description: todo.description,
    type: todo.type,
    status: todo.status,
    priority: todo.priority,
    storyPoints: todo.storyPoints === null ? '' : String(todo.storyPoints),
    labels: todo.labels.join(', '),
    dueDate: todo.dueDate ?? '',
    sprintId: todo.sprintId ?? '',
  };
}

/** Dirty check for BL-3's "Discard changes?" prompt. */
export function isTodoFormDirty(initial: TodoFormValues, current: TodoFormValues): boolean {
  return (
    initial.title !== current.title ||
    initial.description !== current.description ||
    initial.type !== current.type ||
    initial.status !== current.status ||
    initial.priority !== current.priority ||
    initial.storyPoints !== current.storyPoints ||
    initial.labels !== current.labels ||
    initial.dueDate !== current.dueDate ||
    initial.sprintId !== current.sprintId
  );
}

/** "YYYY-MM-DD" → "12 Nov 2026" without pulling in a date library. */
export function formatDueDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/** A due date before today (UTC) is overdue. */
export function isOverdue(value: string): boolean {
  return value < new Date().toISOString().slice(0, 10);
}

/** Only planned and active sprints can receive todos. */
export function selectableSprints(sprints: Sprint[]): Sprint[] {
  return sprints.filter((sprint) => sprint.status !== 'completed');
}

export function sprintOptionLabel(sprint: Sprint): string {
  return sprint.status === 'active' ? `${sprint.name} · Active` : sprint.name;
}
