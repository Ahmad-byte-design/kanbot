import {
  TODO_STATUSES,
  type Sprint,
  type SprintStats,
  type Todo,
  type TodoStatus,
} from '../../../types/api';
import type { SprintColumns, SprintFormValues } from '../types/sprints.types';

const DAY_MS = 86_400_000;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** Today in the user's local calendar as YYYY-MM-DD. */
export function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Date-only arithmetic in UTC, so DST never changes the result. */
export function addDaysIso(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

/** "2026-11-12" → "12 Nov 2026". Invalid values are returned untouched. */
export function formatSprintDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function formatSprintRange(startDate: string | null, endDate: string | null): string {
  if (!startDate && !endDate) return 'No dates yet';
  if (startDate && !endDate) return `From ${formatSprintDate(startDate)}`;
  if (!startDate && endDate) return `Until ${formatSprintDate(endDate)}`;
  return `${formatSprintDate(startDate as string)} – ${formatSprintDate(endDate as string)}`;
}

/** Whole days from today to the end date; negative when the date has passed. */
export function daysRemaining(endDate: string | null, from = todayIso()): number | null {
  if (!endDate) return null;

  const end = Date.parse(`${endDate}T00:00:00Z`);
  const start = Date.parse(`${from}T00:00:00Z`);
  if (Number.isNaN(end) || Number.isNaN(start)) return null;

  return Math.round((end - start) / DAY_MS);
}

export function daysRemainingLabel(endDate: string | null, from = todayIso()): string {
  const days = daysRemaining(endDate, from);
  if (days === null) return 'No end date';
  if (days > 1) return `${days} days left`;
  if (days === 1) return '1 day left';
  if (days === 0) return 'Ends today';
  if (days === -1) return 'Ended yesterday';
  return `Ended ${Math.abs(days)} days ago`;
}

/** Round a ratio to a whole percentage, guarding the empty-sprint case. */
function percent(done: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((done / total) * 100);
}

/** Completion by todo count (SPR-7's completion %). */
export function completionPercent(stats: SprintStats): number {
  return percent(stats.doneTodos, stats.totalTodos);
}

/** The progress bar prefers story points and falls back to todo count. */
export function progressPercent(stats: SprintStats): number {
  return stats.totalPoints > 0
    ? percent(stats.donePoints, stats.totalPoints)
    : percent(stats.doneTodos, stats.totalTodos);
}

/** Flattens the board back into one list, column order preserved. */
export function flattenColumns(
  columns: SprintColumns,
  statuses: readonly string[] = TODO_STATUSES,
): Todo[] {
  return statuses.flatMap((status) => columns[status] ?? []);
}

/** Server order for sprint todos: status column, then `order`. */
export function sortSprintTodos(
  todos: Todo[],
  statuses: readonly string[] = TODO_STATUSES,
): Todo[] {
  const rank: Record<string, number> = {};
  statuses.forEach((status, index) => {
    rank[status] = index;
  });
  const fallback = statuses.length;

  return [...todos].sort(
    (a, b) =>
      (rank[a.status] ?? fallback) - (rank[b.status] ?? fallback) ||
      a.order - b.order ||
      a.createdAt.localeCompare(b.createdAt),
  );
}

/**
 * The `position` the move endpoint expects when a card is dropped on another
 * card (or at the bottom of a column).
 *
 * The server removes the card from its source column first, so dropping below
 * its old place in the same column needs one step subtracted. Dropping onto a
 * card inserts before that card; dropping onto empty space appends.
 */
export function boardDropPosition(
  columns: SprintColumns,
  draggingId: string,
  targetStatus: TodoStatus,
  overId?: string,
): number {
  const sourceStatus = Object.keys(columns).find((status) =>
    (columns[status] ?? []).some((todo) => todo.id === draggingId),
  );
  const target = columns[targetStatus] ?? [];

  if (!overId) {
    return target.length - (sourceStatus === targetStatus ? 1 : 0);
  }

  const overIndex = target.findIndex((todo) => todo.id === overId);
  if (overIndex < 0) return target.length;

  const sourceIndex =
    sourceStatus === undefined
      ? -1
      : (columns[sourceStatus] ?? []).findIndex((todo) => todo.id === draggingId);

  if (sourceStatus === targetStatus && sourceIndex >= 0 && sourceIndex < overIndex) {
    return overIndex - 1;
  }

  return overIndex;
}

export function plannedSprints(sprints: Sprint[]): Sprint[] {
  return sprints.filter((sprint) => sprint.status === 'planned');
}

export function findActiveSprint(sprints: Sprint[]): Sprint | undefined {
  return sprints.find((sprint) => sprint.status === 'active');
}

/**
 * "Sprint 12" → next is 13. Names that do not end in a number fall back to the
 * number of existing sprints plus one, matching the server's default.
 */
export function nextSprintName(sprints: Sprint[]): string {
  const highest = sprints.reduce((max, sprint) => {
    const match = /(\d+)\s*$/.exec(sprint.name);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);

  return `Sprint ${Math.max(highest + 1, sprints.length + 1)}`;
}

export function toSprintFormValues(sprint?: Sprint): SprintFormValues {
  return {
    name: sprint?.name ?? '',
    goal: sprint?.goal ?? '',
    startDate: sprint?.startDate ?? '',
    endDate: sprint?.endDate ?? '',
  };
}

export function isSprintFormDirty(initial: SprintFormValues, current: SprintFormValues): boolean {
  return (
    initial.name !== current.name ||
    initial.goal !== current.goal ||
    initial.startDate !== current.startDate ||
    initial.endDate !== current.endDate
  );
}

/** Prefer the snapshot a completed sprint saved; fall back to live numbers. */
export function sprintStats(sprint: Sprint): SprintStats & { carriedOver?: number } {
  if (sprint.status === 'completed' && sprint.completedStats) return sprint.completedStats;
  return sprint.stats;
}
