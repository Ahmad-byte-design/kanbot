import type { AiSource, DraftTodo, StoryPoints, TodoPriority, TodoType } from '../../../types/api';
import type { DraftTodoRow } from '../types/ai.types';

let nextId = 0;

/** Stable local ids for React keys; never sent to the server. */
export function localId(prefix: string): string {
  nextId += 1;
  return `${prefix}-${nextId}`;
}

export function draftRows(todos: DraftTodo[]): DraftTodoRow[] {
  return todos.map((todo) => ({ ...todo, id: localId('draft'), checked: true }));
}

export function checkedDrafts(rows: DraftTodoRow[]): DraftTodoRow[] {
  return rows.filter((row) => row.checked && row.title.trim().length > 0);
}

export function draftsTotalPoints(rows: DraftTodoRow[]): number {
  return rows.reduce(
    (total, row) => total + (row.checked ? (row.storyPoints ?? 0) : 0),
    0,
  );
}

export function sourceTone(source: AiSource | null | undefined): string {
  return source === 'ai'
    ? 'bg-tone-soft text-tone'
    : 'bg-muted text-muted-foreground';
}

export const TODO_TYPE_CHOICES: { value: TodoType; label: string }[] = [
  { value: 'task', label: 'Task' },
  { value: 'story', label: 'Story' },
  { value: 'bug', label: 'Bug' },
];

export const TODO_PRIORITY_CHOICES: { value: TodoPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export const STORY_POINT_CHOICES: { value: string; label: string }[] = [
  { value: '', label: 'No estimate' },
  { value: '1', label: '1 point' },
  { value: '2', label: '2 points' },
  { value: '3', label: '3 points' },
  { value: '5', label: '5 points' },
  { value: '8', label: '8 points' },
  { value: '13', label: '13 points' },
];

export function parsePoints(value: string): StoryPoints | null {
  if (!value) return null;
  const points = Number(value);
  return ([1, 2, 3, 5, 8, 13] as const).find((candidate) => candidate === points) ?? null;
}
