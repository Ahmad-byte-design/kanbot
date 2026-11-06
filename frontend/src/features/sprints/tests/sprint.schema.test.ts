import { describe, expect, it } from 'vitest';
import { STORY_POINTS } from '../../../types/api';
import {
  addDaysIso,
  boardDropPosition,
  completionPercent,
  daysRemaining,
  daysRemainingLabel,
  findActiveSprint,
  formatSprintRange,
  nextSprintName,
  progressPercent,
  todayIso,
} from '../lib/sprint-meta';
import { moveBoardTodo } from '../lib/sprint-cache';
import { sprintFormSchema, sprintRequestFromValues, startSprintSchema } from '../schema/sprint.schema';
import type { Sprint, SprintBoardResponse, Todo } from '../../../types/api';

const EMPTY_BY_STATUS = { todo: 0, in_progress: 0, in_review: 0, done: 0 };

function makeSprint(overrides: Partial<Sprint> = {}): Sprint {
  return {
    id: 's-1',
    projectId: 'p-1',
    name: 'Sprint 1',
    goal: '',
    startDate: null,
    endDate: null,
    status: 'planned',
    startedAt: null,
    completedAt: null,
    completedStats: null,
    summary: null,
    stats: {
      totalTodos: 0,
      doneTodos: 0,
      totalPoints: 0,
      donePoints: 0,
      byStatus: { ...EMPTY_BY_STATUS },
    },
    createdAt: '2026-10-02T10:00:00.000Z',
    updatedAt: '2026-10-02T10:00:00.000Z',
    ...overrides,
  };
}

function makeTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: 't-1',
    projectId: 'p-1',
    sprintId: 's-1',
    key: 'KAN-1',
    title: 'First',
    description: '',
    type: 'task',
    status: 'todo',
    priority: 'medium',
    storyPoints: 3,
    labels: [],
    dueDate: null,
    order: 0,
    createdAt: '2026-10-02T10:00:00.000Z',
    updatedAt: '2026-10-02T10:00:00.000Z',
    completedAt: null,
    ...overrides,
  };
}

describe('sprint form schema', () => {
  it('accepts an empty goal and optional dates, and trims text', () => {
    const parsed = sprintFormSchema.safeParse({
      name: '  Sprint 7  ',
      goal: '  Ship the board  ',
      startDate: '',
      endDate: '',
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.name).toBe('Sprint 7');
    expect(parsed.data.goal).toBe('Ship the board');
  });

  it('rejects an end date before the start date', () => {
    const parsed = sprintFormSchema.safeParse({
      name: 'Sprint 7',
      goal: '',
      startDate: '2026-11-10',
      endDate: '2026-11-09',
    });

    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    expect(parsed.error.issues[0]?.path).toEqual(['endDate']);
    expect(parsed.error.issues[0]?.message).toBe('End date must be on or after the start date');
  });

  it('requires a name and a real calendar date', () => {
    const noName = sprintFormSchema.safeParse({
      name: '  ',
      goal: '',
      startDate: '',
      endDate: '',
    });
    expect(noName.success).toBe(false);

    const badDate = sprintFormSchema.safeParse({
      name: 'Sprint 7',
      goal: '',
      startDate: '2026-02-30',
      endDate: '',
    });
    expect(badDate.success).toBe(false);
  });

  it('maps blank dates to null for the API', () => {
    expect(
      sprintRequestFromValues({
        name: ' Sprint 7 ',
        goal: ' Goal ',
        startDate: '',
        endDate: '2026-11-14',
      }),
    ).toEqual({ name: 'Sprint 7', goal: 'Goal', startDate: null, endDate: '2026-11-14' });
  });

  it('requires both dates when starting and validates their order', () => {
    const valid = startSprintSchema.safeParse({
      startDate: '2026-11-05',
      endDate: '2026-11-05',
    });
    expect(valid.success).toBe(true);

    const invalid = startSprintSchema.safeParse({
      startDate: '2026-11-05',
      endDate: '2026-11-04',
    });
    expect(invalid.success).toBe(false);
  });
});

describe('sprint date and stat helpers', () => {
  it('adds days across month boundaries in UTC', () => {
    expect(addDaysIso('2026-10-28', 14)).toBe('2026-11-11');
    expect(addDaysIso('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('formats ranges and days remaining', () => {
    expect(formatSprintRange(null, null)).toBe('No dates yet');
    expect(formatSprintRange('2026-11-05', null)).toBe('From 5 Nov 2026');
    expect(daysRemaining('2026-11-10', '2026-11-05')).toBe(5);
    expect(daysRemainingLabel('2026-11-10', '2026-11-05')).toBe('5 days left');
    expect(daysRemainingLabel('2026-11-06', '2026-11-05')).toBe('1 day left');
    expect(daysRemainingLabel('2026-11-05', '2026-11-05')).toBe('Ends today');
    expect(daysRemainingLabel(null)).toBe('No end date');
  });

  it('prefers points for progress and count for completion', () => {
    const stats = {
      totalTodos: 4,
      doneTodos: 2,
      totalPoints: 8,
      donePoints: 6,
      byStatus: { todo: 1, in_progress: 1, in_review: 0, done: 2 },
    };

    expect(progressPercent(stats)).toBe(75);
    expect(completionPercent(stats)).toBe(50);
    expect(
      progressPercent({ ...stats, totalPoints: 0, donePoints: 0 }),
    ).toBe(50);
    expect(completionPercent({ ...stats, totalTodos: 0, doneTodos: 0 })).toBe(0);
  });

  it('defaults the next name from the highest suffix and finds the active sprint', () => {
    const sprints = [
      makeSprint({ id: 's-10', name: 'Sprint 10' }),
      makeSprint({ id: 's-2', name: 'Sprint 2', status: 'active' }),
      makeSprint({ id: 's-x', name: 'Hardening' }),
    ];

    expect(nextSprintName(sprints)).toBe('Sprint 11');
    expect(findActiveSprint(sprints)?.id).toBe('s-2');
    expect(nextSprintName([])).toBe('Sprint 1');
  });

  it('uses the first story point value from the shared contract', () => {
    expect(STORY_POINTS).toContain(3);
    expect(STORY_POINTS).toContain(13);
  });
});

describe('sprint board moves', () => {
  const columns = {
    todo: [makeTodo({ id: 'a', key: 'KAN-1', status: 'todo', order: 0 })],
    in_progress: [
      makeTodo({ id: 'b', key: 'KAN-2', status: 'in_progress', order: 0 }),
      makeTodo({ id: 'c', key: 'KAN-3', status: 'in_progress', order: 1 }),
    ],
    in_review: [],
    done: [makeTodo({ id: 'd', key: 'KAN-4', status: 'done', order: 0 })],
  } as const;

  it('computes insert positions after the card leaves its column', () => {
    const mutable = {
      todo: [...columns.todo],
      in_progress: [...columns.in_progress],
      in_review: [...columns.in_review],
      done: [...columns.done],
    };

    expect(boardDropPosition(mutable, 'b', 'in_progress', 'c')).toBe(0);
    expect(boardDropPosition(mutable, 'c', 'in_progress', 'b')).toBe(0);
    expect(boardDropPosition(mutable, 'a', 'in_progress', 'c')).toBe(1);
    expect(boardDropPosition(mutable, 'a', 'done')).toBe(1);
    expect(boardDropPosition(mutable, 'd', 'done')).toBe(0);
  });

  it('moves a card between columns and recomputes the stats', () => {
    const board: SprintBoardResponse = {
      sprint: makeSprint({ status: 'active' }),
      columns: {
        todo: [...columns.todo],
        in_progress: [...columns.in_progress],
        in_review: [],
        done: [...columns.done],
      },
    };

    const moved = moveBoardTodo(board, 'a', 'done', 1);

    expect(moved.columns.todo).toHaveLength(0);
    expect(moved.columns.done.map((todo) => todo.id)).toEqual(['d', 'a']);
    expect(moved.columns.done.map((todo) => todo.order)).toEqual([0, 1]);
    expect(moved.columns.done[1]?.status).toBe('done');
    expect(moved.sprint.stats.doneTodos).toBe(2);
    expect(moved.sprint.stats.donePoints).toBe(6);
    expect(moved.sprint.stats.totalTodos).toBe(4);
    expect(moved.sprint.stats.byStatus.done).toBe(2);
  });

  it('keeps the original board when the card is missing', () => {
    const board: SprintBoardResponse = {
      sprint: makeSprint({ status: 'active' }),
      columns: {
        todo: [],
        in_progress: [],
        in_review: [],
        done: [],
      },
    };

    expect(moveBoardTodo(board, 'missing', 'done', 0)).toBe(board);
  });

  it('uses today in YYYY-MM-DD form', () => {
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
