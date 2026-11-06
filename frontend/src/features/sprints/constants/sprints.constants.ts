import type { SprintStatus } from '../../../types/api';

export const SPRINT_LIMITS = {
  nameMax: 80,
  goalMax: 300,
  defaultLengthDays: 14,
} as const;

export const SPRINT_STATUS_LABELS: Record<SprintStatus, string> = {
  planned: 'Planned',
  active: 'Active',
  completed: 'Completed',
};

/** Badge classes, written out so Tailwind can see every variant. */
export const SPRINT_STATUS_STYLES: Record<SprintStatus, string> = {
  planned: 'bg-secondary text-secondary-foreground',
  active: 'bg-status-done-soft text-status-done',
  completed: 'bg-muted text-muted-foreground',
};

export const SPRINT_STATUS_DOTS: Record<SprintStatus, string> = {
  planned: 'bg-status-todo',
  active: 'bg-status-done',
  completed: 'bg-muted-foreground',
};

export const SPRINT_MESSAGES = {
  pageTitle: 'Sprints',
  pageDescription:
    'Every sprint this project has run. Open one to see what shipped, what carried over and how much moved.',
  plannedTitle: 'Planned sprints',
  plannedDescription:
    'Sprints waiting to start. Their todos stay out of the backlog until the sprint begins.',
  create: 'Create sprint',
  createTitle: 'Create a sprint',
  createDescription: 'Give the sprint a name and, if you like, a goal and dates. It stays planned until you start it.',
  editTitle: 'Edit sprint',
  editDescription: 'Update the name, goal or dates. The sprint keeps all of its todos.',
  nameLabel: 'Sprint name',
  goalLabel: 'Goal',
  goalPlaceholder: 'What should this sprint achieve?',
  startDateLabel: 'Start date',
  endDateLabel: 'End date',
  dateHelper: 'Optional. The end date must be on or after the start date.',
  start: 'Start sprint',
  startTitle: 'Start sprint',
  startDescription: 'Pick the dates. Starting the sprint opens its board.',
  startDateHelper: 'Defaults to today.',
  endDateHelper: 'Defaults to 14 days after the start.',
  complete: 'Complete sprint',
  completeTitle: 'Complete sprint',
  completeDescription:
    'The sprint closes and its numbers are saved. Unfinished todos can go back to the backlog or into a planned sprint.',
  deleteTitle: 'Delete sprint',
  deleteWarning:
    'Its todos return to the backlog. This only works for planned sprints and cannot be undone.',
  boardTitle: 'Sprint board',
  boardEmptyTitle: 'No sprint is running',
  boardEmptyDescription:
    'Plan the next sprint in the backlog, then start it to open the board.',
  boardGoToBacklog: 'Plan in the backlog',
  plannedEmptyTitle: 'No sprint planned yet',
  plannedEmptyDescription:
    'Create a sprint to group the work you want to finish next. Nothing moves until you add todos.',
  sprintEmptyTodos: 'No todos in this sprint yet',
  sprintEmptyTodosHint: 'Move work in from the backlog to shape this sprint.',
  historyEmptyTitle: 'No sprints yet',
  historyEmptyDescription:
    'Sprints give a project a rhythm. Create one from the backlog, add a few todos and start it when you are ready.',
  detailBack: 'All sprints',
  detailNotFound: 'Sprint not found',
  boardDone: 'Everything in this sprint is done.',
  startBlocked: (activeName: string) =>
    `"${activeName}" is still active. Complete it before starting another sprint.`,
} as const;

export const SPRINT_PROGRESS_LABEL = 'Sprint progress';
