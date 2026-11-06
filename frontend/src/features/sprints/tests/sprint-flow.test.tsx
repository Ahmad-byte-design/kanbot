import type { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import App from '../../../App';
import { mockApi } from '../../../test/api-mock';
import { useAuthStore } from '../../auth/store/auth.store';
import {
  TODO_STATUSES,
  type ProjectWithStats,
  type Sprint,
  type SprintStats,
  type Todo,
  type TodoStatus,
} from '../../../types/api';
import {
  addDaysIso,
  daysRemainingLabel,
  todayIso,
} from '../lib/sprint-meta';

const demoUser = {
  id: 'user-1',
  name: 'Demo Student',
  email: 'demo@kanbot.dev',
  createdAt: '2026-10-02T09:00:00.000Z',
};

const project: ProjectWithStats = {
  id: 'p-1',
  name: 'Mobile App Redesign',
  key: 'KAN',
  description: 'A calmer way to plan the next release.',
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-02T10:00:00.000Z',
  stats: { backlogCount: 0, totalTodos: 0, activeSprint: null },
};

const NOW = '2026-11-05T09:00:00.000Z';
const EMPTY_BY_STATUS: Record<TodoStatus, number> = {
  todo: 0,
  in_progress: 0,
  in_review: 0,
  done: 0,
};

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
    sprintId: null,
    key: 'KAN-1',
    title: 'First todo',
    description: '',
    type: 'task',
    status: 'todo',
    priority: 'medium',
    storyPoints: null,
    labels: [],
    dueDate: null,
    order: 0,
    createdAt: '2026-10-02T10:00:00.000Z',
    updatedAt: '2026-10-02T10:00:00.000Z',
    completedAt: null,
    ...overrides,
  };
}

interface BackendState {
  sprints: Sprint[];
  todos: Todo[];
  nextSprintNumber: number;
  failMove: boolean;
}

function statsFor(todos: Todo[]): SprintStats {
  const byStatus = { ...EMPTY_BY_STATUS };
  let totalTodos = 0;
  let totalPoints = 0;
  let donePoints = 0;

  for (const todo of todos) {
    byStatus[todo.status] += 1;
    totalTodos += 1;
    totalPoints += todo.storyPoints ?? 0;
    if (todo.status === 'done') donePoints += todo.storyPoints ?? 0;
  }

  return { totalTodos, doneTodos: byStatus.done, totalPoints, donePoints, byStatus };
}

/**
 * A pretend project mid-sprint: four active todos spread across all columns, a
 * planned sprint with one todo, one backlog todo and a completed sprint with a
 * saved snapshot and an AI summary.
 */
function seedState(): BackendState {
  return {
    nextSprintNumber: 6,
    failMove: false,
    sprints: [
      makeSprint({
        id: 's-active',
        name: 'Sprint 4',
        goal: 'Ship the board',
        startDate: '2026-11-01',
        endDate: '2026-11-15',
        status: 'active',
        startedAt: '2026-11-01T09:00:00.000Z',
      }),
      makeSprint({
        id: 's-planned',
        name: 'Sprint 5',
        goal: 'Tighten the backlog',
        status: 'planned',
      }),
      makeSprint({
        id: 's-done',
        name: 'Sprint 3',
        status: 'completed',
        completedAt: '2026-10-30T17:00:00.000Z',
        completedStats: {
          totalTodos: 4,
          doneTodos: 3,
          totalPoints: 10,
          donePoints: 8,
          byStatus: { todo: 1, in_progress: 0, in_review: 0, done: 3 },
          carriedOver: 1,
        },
        summary: {
          content: 'We closed eight of ten points and shipped the new onboarding.',
          source: 'mock',
          generatedAt: '2026-10-30T17:00:00.000Z',
        },
      }),
    ],
    todos: [
      makeTodo({
        id: 't-1',
        key: 'KAN-1',
        title: 'Sketch the sprint board',
        sprintId: 's-active',
        status: 'done',
        type: 'story',
        priority: 'high',
        storyPoints: 3,
        order: 0,
        completedAt: '2026-11-03T10:00:00.000Z',
      }),
      makeTodo({
        id: 't-2',
        key: 'KAN-2',
        title: 'Wire the drag handlers',
        sprintId: 's-active',
        status: 'in_progress',
        storyPoints: 2,
        order: 0,
      }),
      makeTodo({
        id: 't-3',
        key: 'KAN-3',
        title: 'Design the progress header',
        sprintId: 's-active',
        status: 'todo',
        priority: 'high',
        storyPoints: 5,
        order: 0,
      }),
      makeTodo({
        id: 't-4',
        key: 'KAN-4',
        title: 'Review empty columns',
        sprintId: 's-active',
        status: 'in_review',
        type: 'bug',
        priority: 'low',
        storyPoints: 1,
        order: 0,
      }),
      makeTodo({
        id: 't-5',
        key: 'KAN-5',
        title: 'Plan the launch checklist',
        sprintId: 's-planned',
        storyPoints: 3,
        order: 0,
      }),
      makeTodo({
        id: 't-6',
        key: 'KAN-6',
        title: 'Write the release notes',
        storyPoints: 2,
        order: 0,
      }),
      makeTodo({
        id: 't-7',
        key: 'KAN-7',
        title: 'Ship the previous onboarding',
        sprintId: 's-done',
        status: 'done',
        type: 'story',
        storyPoints: 5,
        order: 0,
        completedAt: '2026-10-30T16:00:00.000Z',
      }),
    ],
  };
}

/** Same project, but no sprint is running — the pause between sprints. */
function withoutActiveSprint(): BackendState {
  const state = seedState();
  state.sprints = state.sprints.filter((sprint) => sprint.status !== 'active');
  for (const todo of state.todos) {
    if (todo.sprintId === 's-active') todo.sprintId = null;
  }
  return state;
}

function cloneTodo(todo: Todo): Todo {
  return { ...todo, labels: [...todo.labels] };
}

function byOrder(a: Todo, b: Todo): number {
  return a.order - b.order || a.createdAt.localeCompare(b.createdAt);
}

function sprintWithStats(state: BackendState, sprint: Sprint): Sprint {
  const own = state.todos.filter((todo) => todo.sprintId === sprint.id);
  return { ...sprint, stats: statsFor(own) };
}

const STATUS_RANK: Record<Sprint['status'], number> = {
  active: 0,
  planned: 1,
  completed: 2,
};

function orderedSprints(state: BackendState): Sprint[] {
  return [...state.sprints]
    .sort(
      (a, b) =>
        STATUS_RANK[a.status] - STATUS_RANK[b.status] || a.createdAt.localeCompare(b.createdAt),
    )
    .map((sprint) => sprintWithStats(state, sprint));
}

function columnsFor(state: BackendState, sprintId: string) {
  const columns = Object.fromEntries(
    TODO_STATUSES.map((status) => [
      status,
      state.todos
        .filter((todo) => todo.sprintId === sprintId && todo.status === status)
        .sort(byOrder)
        .map(cloneTodo),
    ]),
  ) as Record<TodoStatus, Todo[]>;

  return columns;
}

function projectResponse(state: BackendState): ProjectWithStats {
  const active = state.sprints.find((sprint) => sprint.status === 'active');
  return {
    ...project,
    stats: {
      backlogCount: state.todos.filter((todo) => todo.sprintId === null).length,
      totalTodos: state.todos.length,
      activeSprint: active ? { id: active.id, name: active.name } : null,
    },
  };
}

function readBody(config: AxiosRequestConfig): Record<string, unknown> {
  const raw = config.data;
  if (typeof raw === 'string') return JSON.parse(raw) as Record<string, unknown>;
  if (raw && typeof raw === 'object') return raw as Record<string, unknown>;
  return {};
}

function notFound(message = 'Not found') {
  return { status: 404, data: { error: { code: 'NOT_FOUND', message } } };
}

function conflict(message: string) {
  return { status: 409, data: { error: { code: 'CONFLICT', message } } };
}

/** Applies the server's move semantics to the fake store. */
function applyTodoMove(state: BackendState, todo: Todo, body: Record<string, unknown>) {
  const targetStatus = (body.status as TodoStatus | undefined) ?? todo.status;
  const targetSprint = body.sprintId === undefined ? todo.sprintId : (body.sprintId as string | null);
  const sourceSprint = todo.sprintId;
  const sourceStatus = todo.status;

  // Renumber the source column after the card leaves it.
  state.todos
    .filter((item) => item.sprintId === sourceSprint && item.status === sourceStatus && item.id !== todo.id)
    .sort(byOrder)
    .forEach((item, index) => {
      item.order = index;
    });

  todo.sprintId = targetSprint;
  todo.status = targetStatus;
  todo.completedAt =
    targetStatus === 'done' ? (todo.completedAt ?? NOW) : null;
  todo.updatedAt = NOW;

  const target = state.todos
    .filter(
      (item) =>
        item.sprintId === targetSprint && item.status === targetStatus && item.id !== todo.id,
    )
    .sort(byOrder);
  const requested = Number(body.position);
  const position = Math.max(
    0,
    Math.min(Number.isFinite(requested) ? requested : 0, target.length),
  );
  target.splice(position, 0, todo);
  target.forEach((item, index) => {
    item.order = index;
  });

  return cloneTodo(todo);
}

/** A small stateful stand-in for the Express sprint and todo routes. */
function mockSprintBackend(state: BackendState) {
  return mockApi((config) => {
    const method = (config.method ?? 'get').toLowerCase();
    const url = config.url ?? '';

    if (url === '/auth/me') return { status: 200, data: { user: demoUser } };
    if (url === '/projects') return { status: 200, data: { projects: [projectResponse(state)] } };
    if (url === '/projects/p-1' && method === 'get') {
      return { status: 200, data: { project: projectResponse(state) } };
    }

    if (url === '/projects/p-1/sprints' && method === 'get') {
      return { status: 200, data: { sprints: orderedSprints(state) } };
    }

    if (url === '/projects/p-1/sprints' && method === 'post') {
      const body = readBody(config);
      const number = state.nextSprintNumber;
      state.nextSprintNumber += 1;
      const sprint = makeSprint({
        id: `s-${number}`,
        name: (body.name as string | undefined) || `Sprint ${number}`,
        goal: (body.goal as string | undefined) ?? '',
        startDate: (body.startDate as string | null | undefined) ?? null,
        endDate: (body.endDate as string | null | undefined) ?? null,
        createdAt: NOW,
        updatedAt: NOW,
      });
      state.sprints.push(sprint);
      return { status: 201, data: { sprint: sprintWithStats(state, sprint) } };
    }

    if (url === '/projects/p-1/todos?sprintId=backlog' && method === 'get') {
      return {
        status: 200,
        data: {
          todos: state.todos
            .filter((todo) => todo.sprintId === null)
            .sort(byOrder)
            .map(cloneTodo),
        },
      };
    }

    if (url === '/projects/p-1/todos' && method === 'get') {
      return { status: 200, data: { todos: state.todos.map(cloneTodo) } };
    }

    const boardMatch = /^\/sprints\/([^/]+)\/todos$/.exec(url);
    if (boardMatch && method === 'get') {
      const sprint = state.sprints.find((item) => item.id === boardMatch[1]);
      if (!sprint) return notFound('Sprint not found');

      return {
        status: 200,
        data: {
          sprint: sprintWithStats(state, sprint),
          columns: columnsFor(state, sprint.id),
        },
      };
    }

    const actionMatch = /^\/sprints\/([^/]+)\/(start|complete)$/.exec(url);
    if (actionMatch && method === 'post') {
      const sprint = state.sprints.find((item) => item.id === actionMatch[1]);
      if (!sprint) return notFound('Sprint not found');
      const action = actionMatch[2];
      const body = readBody(config);

      if (action === 'start') {
        if (sprint.status !== 'planned') return conflict('Only planned sprints can be started.');
        const active = state.sprints.find(
          (item) => item.status === 'active' && item.id !== sprint.id,
        );
        if (active) {
          return conflict(`"${active.name}" is still active. Complete it before starting another sprint.`);
        }

        sprint.status = 'active';
        sprint.startDate = (body.startDate as string | undefined) ?? sprint.startDate ?? todayIso();
        sprint.endDate =
          (body.endDate as string | undefined) ?? sprint.endDate ?? addDaysIso(sprint.startDate, 14);
        sprint.startedAt = NOW;
        sprint.updatedAt = NOW;
        return { status: 200, data: { sprint: sprintWithStats(state, sprint) } };
      }

      if (sprint.status !== 'active') return conflict('Only the active sprint can be completed.');

      const destination = (body.moveUnfinishedTo as string | undefined) ?? 'backlog';
      const targetId = destination === 'backlog' ? null : destination;
      const own = state.todos.filter((todo) => todo.sprintId === sprint.id);
      const unfinished = own.filter((todo) => todo.status !== 'done');

      sprint.completedStats = { ...statsFor(own), carriedOver: unfinished.length };

      for (const todo of unfinished) {
        todo.sprintId = targetId;
        todo.updatedAt = NOW;
      }

      for (const target of new Set([targetId, sprint.id])) {
        for (const status of TODO_STATUSES) {
          state.todos
            .filter((todo) => todo.sprintId === target && todo.status === status)
            .sort(byOrder)
            .forEach((todo, index) => {
              todo.order = index;
            });
        }
      }

      sprint.status = 'completed';
      sprint.completedAt = NOW;
      sprint.updatedAt = NOW;
      return { status: 200, data: { sprint: sprintWithStats(state, sprint) } };
    }

    const sprintMatch = /^\/sprints\/([^/]+)$/.exec(url);
    if (sprintMatch) {
      const sprint = state.sprints.find((item) => item.id === sprintMatch[1]);
      if (!sprint) return notFound('Sprint not found');

      if (method === 'get') {
        return { status: 200, data: { sprint: sprintWithStats(state, sprint) } };
      }

      if (method === 'patch') {
        Object.assign(sprint, readBody(config), { updatedAt: NOW });
        return { status: 200, data: { sprint: sprintWithStats(state, sprint) } };
      }

      if (method === 'delete') {
        if (sprint.status !== 'planned') return conflict('Only planned sprints can be deleted.');

        for (const todo of state.todos.filter((item) => item.sprintId === sprint.id)) {
          todo.sprintId = null;
        }
        state.todos
          .filter((todo) => todo.sprintId === null)
          .sort(byOrder)
          .forEach((todo, index) => {
            todo.order = index;
          });
        state.sprints = state.sprints.filter((item) => item.id !== sprint.id);
        return { status: 204 };
      }
    }

    const moveMatch = /^\/todos\/([^/]+)\/move$/.exec(url);
    if (moveMatch && method === 'post') {
      if (state.failMove) {
        return {
          status: 500,
          data: { error: { code: 'INTERNAL_ERROR', message: 'The server hiccuped.' } },
        };
      }

      const todo = state.todos.find((item) => item.id === moveMatch[1]);
      if (!todo) return notFound('Todo not found');

      return { status: 200, data: { todo: applyTodoMove(state, todo, readBody(config)) } };
    }

    return notFound();
  });
}

function renderApp(path: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function keysInList(list: HTMLElement): string[] {
  return within(list)
    .getAllByRole('listitem')
    .map((item) => item.textContent?.match(/KAN-\d+/)?.[0] ?? '')
    .filter(Boolean);
}

function columnKeys(label: string): string[] {
  return keysInList(screen.getByRole('list', { name: `${label} todos` }));
}

function requestBodies(calls: InternalAxiosRequestConfig[]) {
  return calls.map((call) => ({
    method: (call.method ?? 'get').toLowerCase(),
    url: call.url,
    body: call.data ? readBody(call) : {},
  }));
}

function articleFor(name: string): HTMLElement {
  const article = screen.getByText(name).closest('article');
  if (!article) throw new Error(`No planned sprint article for ${name}`);
  return article;
}

function progressBar(): HTMLElement {
  return screen.getByRole('progressbar', { name: 'Sprint progress' });
}

describe('sprint flow', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ user: demoUser, token: 'jwt-token', isAuthenticated: true });
  });

  it('lists planned sprints above the backlog, then creates, edits and deletes one', async () => {
    const state = seedState();
    const calls = mockSprintBackend(state);
    renderApp('/projects/p-1/backlog');

    const user = userEvent.setup();
    await screen.findByText('Sprint 5');

    const planned = screen.getByRole('region', { name: 'Planned sprints' });
    expect(within(planned).getByText('Sprint 5')).toBeInTheDocument();
    expect(within(planned).getByText('1 todo')).toBeInTheDocument();
    expect(within(planned).getByText('3 pts')).toBeInTheDocument();
    expect(within(planned).getByText('Plan the launch checklist')).toBeInTheDocument();

    // The running sprint blocks starting another one, with an explanation.
    const sprintArticle = articleFor('Sprint 5');
    const startButton = within(sprintArticle).getByRole('button', { name: 'Start sprint' });
    expect(startButton).toBeDisabled();
    expect(
      screen.getByText('"Sprint 4" is still active. Complete it before starting another sprint.'),
    ).toBeInTheDocument();

    // Collapsing hides the todos but keeps the header numbers.
    await user.click(within(sprintArticle).getByRole('button', { expanded: true }));
    expect(within(sprintArticle).queryByText('Plan the launch checklist')).not.toBeInTheDocument();
    expect(within(sprintArticle).getByText('1 todo')).toBeInTheDocument();

    // Create: the name defaults to the next sprint number.
    await user.click(screen.getByRole('button', { name: 'Create sprint' }));
    const createDialog = await screen.findByRole('dialog', { name: 'Create a sprint' });
    expect(within(createDialog).getByLabelText('Sprint name')).toHaveValue('Sprint 6');
    await user.type(within(createDialog).getByLabelText('Goal'), 'Quality pass');
    await user.click(within(createDialog).getByRole('button', { name: 'Create sprint' }));

    await screen.findByText('Sprint 6');
    const create = requestBodies(calls).find(
      (call) => call.method === 'post' && call.url === '/projects/p-1/sprints',
    );
    expect(create?.body).toEqual({
      name: 'Sprint 6',
      goal: 'Quality pass',
      startDate: null,
      endDate: null,
    });

    // Edit the planned sprint's name.
    await user.click(screen.getByRole('button', { name: 'Edit Sprint 5' }));
    const editDialog = await screen.findByRole('dialog', { name: 'Edit sprint' });
    const nameInput = within(editDialog).getByLabelText('Sprint name');
    await user.clear(nameInput);
    await user.type(nameInput, 'Sprint 5 · Hardening');
    await user.click(within(editDialog).getByRole('button', { name: 'Save changes' }));

    await screen.findByText('Sprint 5 · Hardening');
    const update = requestBodies(calls).find(
      (call) => call.method === 'patch' && call.url === '/sprints/s-planned',
    );
    expect(update?.body).toMatchObject({ name: 'Sprint 5 · Hardening' });

    // Delete with confirmation; its todo returns to the backlog.
    await user.click(screen.getByRole('button', { name: 'Delete Sprint 5 · Hardening' }));
    const deleteDialog = await screen.findByRole('dialog', { name: /Delete sprint/ });
    expect(deleteDialog).toHaveTextContent('Its todos return to the backlog.');
    await user.click(within(deleteDialog).getByRole('button', { name: 'Delete sprint' }));

    await waitFor(() =>
      expect(screen.queryByText('Sprint 5 · Hardening')).not.toBeInTheDocument(),
    );
    expect(
      requestBodies(calls).some(
        (call) => call.method === 'delete' && call.url === '/sprints/s-planned',
      ),
    ).toBe(true);
    await waitFor(() =>
      expect(
        within(screen.getByRole('region', { name: 'Backlog board' })).getByText(
          'Plan the launch checklist',
        ),
      ).toBeInTheDocument(),
    );
  });

  it('starts a planned sprint with a two-week default window and opens the board', async () => {
    const state = withoutActiveSprint();
    const calls = mockSprintBackend(state);
    renderApp('/projects/p-1/backlog');

    const user = userEvent.setup();
    await screen.findByText('Sprint 5');

    const sprintArticle = articleFor('Sprint 5');
    await user.click(within(sprintArticle).getByRole('button', { name: 'Start sprint' }));

    const dialog = await screen.findByRole('dialog', { name: 'Start sprint' });
    expect(within(dialog).getByLabelText('Start date')).toHaveValue(todayIso());
    expect(within(dialog).getByLabelText('End date')).toHaveValue(addDaysIso(todayIso(), 14));

    await user.click(within(dialog).getByRole('button', { name: 'Start sprint' }));

    await screen.findByRole('heading', { name: 'Sprint 5' });
    expect(state.sprints.find((sprint) => sprint.id === 's-planned')?.status).toBe('active');

    const start = requestBodies(calls).find(
      (call) => call.method === 'post' && call.url === '/sprints/s-planned/start',
    );
    expect(start?.body).toEqual({
      startDate: todayIso(),
      endDate: addDaysIso(todayIso(), 14),
    });
  });

  it('shows the active sprint board and moves cards by drag and by menu', async () => {
    const state = seedState();
    const calls = mockSprintBackend(state);
    renderApp('/projects/p-1/board');

    const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'Sprint 4' });

    expect(screen.getByText('Ship the board')).toBeInTheDocument();
    expect(screen.getByText('1 Nov 2026 – 15 Nov 2026')).toBeInTheDocument();
    expect(screen.getByText(daysRemainingLabel('2026-11-15'))).toBeInTheDocument();
    expect(progressBar()).toHaveAttribute('aria-valuenow', '27');

    expect(columnKeys('To do')).toEqual(['KAN-3']);
    expect(columnKeys('In progress')).toEqual(['KAN-2']);
    expect(columnKeys('In review')).toEqual(['KAN-4']);
    expect(columnKeys('Done')).toEqual(['KAN-1']);

    // Card click opens the existing BL-3 details dialog.
    await user.click(screen.getByRole('button', { name: 'Design the progress header' }));
    expect(await screen.findByRole('dialog', { name: 'KAN-3 · Edit todo' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'KAN-3 · Edit todo' })).not.toBeInTheDocument(),
    );

    // Dragging a card into Done updates progress optimistically (3 → 5 points).
    const draggedCard = screen.getByText('Wire the drag handlers').closest('li');
    expect(draggedCard).not.toBeNull();
    fireEvent.dragStart(draggedCard as HTMLElement);
    fireEvent.dragOver(screen.getByRole('list', { name: 'Done todos' }));
    fireEvent.drop(screen.getByRole('list', { name: 'Done todos' }));

    await waitFor(() => expect(columnKeys('Done')).toEqual(['KAN-1', 'KAN-2']));
    expect(progressBar()).toHaveAttribute('aria-valuenow', '45');
    expect(columnKeys('In progress')).toEqual([]);

    const dragMove = requestBodies(calls).find(
      (call) => call.method === 'post' && call.url === '/todos/t-2/move',
    );
    expect(dragMove?.body).toMatchObject({ status: 'done', position: 1 });

    // The card menu offers the same status change without a pointer.
    await user.click(screen.getByRole('button', { name: 'Actions for KAN-3' }));
    const menu = await screen.findByRole('menu', { name: 'Actions for KAN-3' });
    await user.click(within(menu).getByRole('menuitemradio', { name: 'In review' }));

    await waitFor(() => expect(columnKeys('In review')).toEqual(['KAN-4', 'KAN-3']));
    expect(columnKeys('To do')).toEqual([]);

    const menuMove = requestBodies(calls).find(
      (call) => call.method === 'post' && call.url === '/todos/t-3/move',
    );
    expect(menuMove?.body).toMatchObject({ status: 'in_review', position: 1 });
  });

  it('rolls the board back when a move fails', async () => {
    const state = seedState();
    state.failMove = true;
    mockSprintBackend(state);
    renderApp('/projects/p-1/board');

    await screen.findByRole('heading', { name: 'Sprint 4' });

    const card = screen.getByText('Design the progress header').closest('li');
    expect(card).not.toBeNull();
    fireEvent.dragStart(card as HTMLElement);
    fireEvent.dragOver(screen.getByRole('list', { name: 'Done todos' }));
    fireEvent.drop(screen.getByRole('list', { name: 'Done todos' }));

    expect(await screen.findByText(/Could not move the card/)).toBeInTheDocument();
    expect(columnKeys('To do')).toEqual(['KAN-3']);
    expect(columnKeys('Done')).toEqual(['KAN-1']);
    expect(progressBar()).toHaveAttribute('aria-valuenow', '27');
  });

  it('completes the sprint into a planned sprint and opens its report', async () => {
    const state = seedState();
    const calls = mockSprintBackend(state);
    renderApp('/projects/p-1/board');

    const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'Sprint 4' });

    await user.click(screen.getByRole('button', { name: 'Complete sprint' }));
    const dialog = await screen.findByRole('dialog', { name: 'Complete sprint' });
    expect(dialog).toHaveTextContent(/Done\s*1\s*todo/);
    expect(dialog).toHaveTextContent(/Not done\s*3\s*todos/);
    const summaryToggle = within(dialog).getByRole('checkbox', {
      name: /Generate AI summary/,
    });
    expect(summaryToggle).not.toBeChecked();
    expect(summaryToggle).toBeEnabled();

    await user.selectOptions(
      within(dialog).getByLabelText('Where should unfinished todos go?'),
      's-planned',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Complete sprint' }));

    await screen.findByText('Completed todos');
    expect(state.sprints.find((sprint) => sprint.id === 's-active')?.status).toBe('completed');
    expect(state.sprints.find((sprint) => sprint.id === 's-active')?.completedStats?.carriedOver).toBe(3);
    expect(state.todos.find((todo) => todo.id === 't-2')?.sprintId).toBe('s-planned');
    expect(state.todos.find((todo) => todo.id === 't-3')?.sprintId).toBe('s-planned');
    expect(state.todos.find((todo) => todo.id === 't-4')?.sprintId).toBe('s-planned');
    expect(state.todos.find((todo) => todo.id === 't-1')?.sprintId).toBe('s-active');

    const completed = requestBodies(calls).find(
      (call) => call.method === 'post' && call.url === '/sprints/s-active/complete',
    );
    expect(completed?.body).toEqual({ moveUnfinishedTo: 's-planned' });

    expect(screen.getByText('Completed todos').parentElement).toHaveTextContent('1 / 4');
    expect(screen.getByText('Carried over').parentElement).toHaveTextContent('3');
    expect(screen.getByText('Completion').parentElement).toHaveTextContent('25%');
    expect(screen.getByText('Sketch the sprint board')).toBeInTheDocument();
    expect(screen.queryByText('Wire the drag handlers')).not.toBeInTheDocument();
  });

  it('lists every sprint in history and renders a completed report with its summary', async () => {
    const state = seedState();
    mockSprintBackend(state);
    renderApp('/projects/p-1/sprints');

    const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'Sprints' });

    expect(screen.getByText('Sprint 4')).toBeInTheDocument();
    expect(screen.getByText('Sprint 5')).toBeInTheDocument();
    expect(screen.getByText('Sprint 3')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('On the board')).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /Sprint 3/ }));

    await screen.findByText('AI summary');
    expect(
      screen.getByText('We closed eight of ten points and shipped the new onboarding.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Carried over').parentElement).toHaveTextContent('1');
    expect(screen.getByText('Completion').parentElement).toHaveTextContent('75%');
    expect(screen.getByText('Ship the previous onboarding')).toBeInTheDocument();
  });

  it('shows the empty board with a route back to the backlog', async () => {
    const state = withoutActiveSprint();
    mockSprintBackend(state);
    renderApp('/projects/p-1/board');

    await screen.findByText('No sprint is running');
    expect(
      screen.getByText('1 planned sprint is ready to start.'),
    ).toBeInTheDocument();

    const backlogLink = screen.getByRole('link', { name: 'Plan in the backlog' });
    expect(backlogLink).toHaveAttribute('href', '/projects/p-1/backlog');
    expect(screen.getByRole('link', { name: 'Sprint history' })).toHaveAttribute(
      'href',
      '/projects/p-1/sprints',
    );
  });
});
