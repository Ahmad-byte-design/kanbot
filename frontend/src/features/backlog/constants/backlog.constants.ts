import type { TodoPriority, TodoStatus, TodoType } from '../../../types/api';
import type { TodoFilters } from '../types/todo.types';

/** The resting filter state; reusing the object keeps memo dependencies stable. */
export const EMPTY_TODO_FILTERS: TodoFilters = { search: '', priority: '', type: '' };

export const TODO_LIMITS = {
  titleMax: 200,
  descriptionMax: 5000,
  labelsMax: 10,
  labelMax: 30,
} as const;

/** The quick-create input is focused by the empty state, so it needs a stable id. */
export const QUICK_CREATE_INPUT_ID = 'backlog-quick-create';

export const TODO_MESSAGES = {
  heading: 'Backlog',
  subtitle: 'Everything not in a sprint, grouped by status.',
  summaryTitle: 'Shape what comes next',
  summaryDescription:
    'Work the board from top to bottom. Estimation and labels can wait until a todo is ready for a sprint.',
  emptyTitle: 'Your backlog is empty',
  emptyDescription:
    'Add the first thing you might work on. A todo needs a title — everything else can wait until you shape it.',
  filteredEmptyTitle: 'No todos match these filters',
  filteredEmptyDescription: 'Try a different search, or clear the filters to see the whole backlog.',
  quickCreatePlaceholder: 'Create a todo and press Enter',
  quickCreateHint: 'Enter to add · Esc to clear',
  keyHintEdit:
    'Changing the sprint moves this todo. Its key never changes, and completed sprints cannot receive todos.',
  dragDisabled:
    'Clear the search and filters to drag cards. Status changes stay available from each card menu.',
  boardLabel: 'Backlog board',
  emptyColumn: 'Drop a todo here',
  deleteWarning: 'This removes the todo for good. It cannot be undone.',
} as const;

export const TODO_TYPE_OPTIONS: { value: TodoType; label: string }[] = [
  { value: 'task', label: 'Task' },
  { value: 'story', label: 'Story' },
  { value: 'bug', label: 'Bug' },
];

export const TODO_STATUS_OPTIONS: { value: TodoStatus; label: string }[] = [
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'in_review', label: 'In review' },
  { value: 'done', label: 'Done' },
];

export const TODO_PRIORITY_OPTIONS: { value: TodoPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export const TODO_STORY_POINT_OPTIONS = [
  { value: '', label: 'No estimate' },
  { value: '1', label: '1 point' },
  { value: '2', label: '2 points' },
  { value: '3', label: '3 points' },
  { value: '5', label: '5 points' },
  { value: '8', label: '8 points' },
  { value: '13', label: '13 points' },
];

export const TODO_TYPE_LABELS: Record<TodoType, string> = {
  task: 'Task',
  story: 'Story',
  bug: 'Bug',
};

export const TODO_STATUS_LABELS: Record<TodoStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  in_review: 'In review',
  done: 'Done',
};

export const TODO_PRIORITY_LABELS: Record<TodoPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

/*
 * Full class strings (not interpolated) so Tailwind can find them. The colours
 * come from the type/priority/status tokens in index.css.
 */
export const TODO_TYPE_STYLES: Record<TodoType, string> = {
  task: 'bg-type-task-soft text-type-task',
  story: 'bg-type-story-soft text-type-story',
  bug: 'bg-type-bug-soft text-type-bug',
};

/** The tinted backing behind the type icon in a backlog row. */
export const TODO_TYPE_ICON_STYLES: Record<TodoType, string> = {
  task: 'bg-type-task-soft text-type-task',
  story: 'bg-type-story-soft text-type-story',
  bug: 'bg-type-bug-soft text-type-bug',
};

export const TODO_PRIORITY_STYLES: Record<TodoPriority, string> = {
  low: 'bg-priority-low-soft text-priority-low',
  medium: 'bg-priority-medium-soft text-priority-medium',
  high: 'bg-priority-high-soft text-priority-high',
  urgent: 'bg-priority-urgent-soft text-priority-urgent',
};

export const TODO_STATUS_STYLES: Record<TodoStatus, string> = {
  todo: 'bg-status-todo-soft text-status-todo',
  in_progress: 'bg-status-in-progress-soft text-status-in-progress',
  in_review: 'bg-status-in-review-soft text-status-in-review',
  done: 'bg-status-done-soft text-status-done',
};

/** Solid status dots for the board headers, written out for Tailwind. */
export const TODO_STATUS_DOTS: Record<TodoStatus, string> = {
  todo: 'bg-status-todo',
  in_progress: 'bg-status-in-progress',
  in_review: 'bg-status-in-review',
  done: 'bg-status-done',
};
