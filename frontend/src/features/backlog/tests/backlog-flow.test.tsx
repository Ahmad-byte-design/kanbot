import type { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import App from '../../../App';
import { mockApi } from '../../../test/api-mock';
import { useAuthStore } from '../../auth/store/auth.store';
import { useAssistantStore } from '../../ai/store/assistant.store';
import { AI_MESSAGES } from '../../ai/constants/ai.constants';
import type {
  CreateTodoRequest,
  ProjectWithStats,
  Sprint,
  Todo,
  UpdateTodoRequest,
} from '../../../types/api';

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

const EMPTY_BY_STATUS = { todo: 0, in_progress: 0, in_review: 0, done: 0 };

function makeSprint(overrides: Partial<Sprint> = {}): Sprint {
  return {
    id: 's-planned',
    projectId: 'p-1',
    name: 'Sprint 5',
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
    title: 'Map the onboarding flow',
    description: 'Sketch the first-run journey.',
    type: 'story',
    status: 'todo',
    priority: 'high',
    storyPoints: 3,
    labels: ['design', 'research'],
    dueDate: '2026-11-12',
    order: 0,
    createdAt: '2026-10-02T10:00:00.000Z',
    updatedAt: '2026-10-02T10:00:00.000Z',
    completedAt: null,
    ...overrides,
  };
}

interface BackendState {
  todos: Todo[];
  sprints: Sprint[];
  nextNumber: number;
  createError?: string;
  failMove?: boolean;
}

function seedBackend(): BackendState {
  return {
    nextNumber: 4,
    sprints: [
      makeSprint({ id: 's-active', name: 'Sprint 4', status: 'active' }),
      makeSprint({ id: 's-planned', name: 'Sprint 5', status: 'planned' }),
      makeSprint({
        id: 's-done',
        name: 'Sprint 3',
        status: 'completed',
        completedAt: '2026-10-01T10:00:00.000Z',
      }),
    ],
    todos: [
      makeTodo(),
      makeTodo({
        id: 't-2',
        key: 'KAN-2',
        title: 'Fix the login timeout',
        description: '',
        type: 'bug',
        priority: 'urgent',
        storyPoints: 2,
        labels: ['auth'],
        dueDate: null,
        order: 1,
      }),
      makeTodo({
        id: 't-3',
        key: 'KAN-3',
        title: 'Write empty-state copy',
        description: '',
        type: 'task',
        priority: 'low',
        storyPoints: null,
        labels: [],
        dueDate: null,
        order: 2,
      }),
    ],
  };
}

function backlogTodos(state: BackendState): Todo[] {
  return state.todos.filter((todo) => todo.sprintId === null).sort((a, b) => a.order - b.order);
}

/** Responses must be clones so the query cache never shares objects with the fake server. */
function cloneTodo(todo: Todo): Todo {
  return { ...todo, labels: [...todo.labels] };
}

function projectResponse(state: BackendState): ProjectWithStats {
  const active = state.sprints.find((sprint) => sprint.status === 'active');
  return {
    ...project,
    stats: {
      backlogCount: backlogTodos(state).length,
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

const notFound = {
  status: 404,
  data: { error: { code: 'NOT_FOUND', message: 'Todo not found' } },
};

/** A small stateful stand-in for the Express todo and sprint routes. */
function mockBacklogBackend(state: BackendState) {
  return mockApi((config) => {
    const method = (config.method ?? 'get').toLowerCase();
    const url = config.url ?? '';

    if (url === '/auth/me') return { status: 200, data: { user: demoUser } };
    if (url === '/projects') {
      return { status: 200, data: { projects: [projectResponse(state)] } };
    }
    if (url === '/projects/p-1') {
      return { status: 200, data: { project: projectResponse(state) } };
    }
    if (url === '/projects/p-1/sprints') {
      return { status: 200, data: { sprints: state.sprints } };
    }
    if (url === '/projects/p-1/todos?sprintId=backlog' && method === 'get') {
      return { status: 200, data: { todos: backlogTodos(state).map(cloneTodo) } };
    }
    if (url === '/projects/p-1/todos' && method === 'get') {
      return { status: 200, data: { todos: state.todos.map(cloneTodo) } };
    }

    if (url === '/projects/p-1/todos' && method === 'post') {
      if (state.createError) {
        return {
          status: 422,
          data: {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'The todo could not be created.',
              details: [{ path: 'title', message: state.createError }],
            },
          },
        };
      }

      const body = readBody(config) as unknown as CreateTodoRequest;
      const number = state.nextNumber;
      state.nextNumber += 1;
      const todo = makeTodo({
        id: `t-${number}`,
        key: `KAN-${number}`,
        title: body.title,
        description: body.description ?? '',
        type: body.type ?? 'task',
        priority: body.priority ?? 'medium',
        storyPoints: body.storyPoints ?? null,
        labels: body.labels ?? [],
        dueDate: body.dueDate ?? null,
        sprintId: body.sprintId ?? null,
        order: backlogTodos(state).length,
        createdAt: '2026-10-03T10:00:00.000Z',
        updatedAt: '2026-10-03T10:00:00.000Z',
      });
      state.todos.push(todo);
      return { status: 201, data: { todo: cloneTodo(todo) } };
    }

    const todoMatch = /^\/todos\/([^/]+)$/.exec(url);
    const todoId = todoMatch?.[1];
    const todo = todoId ? state.todos.find((item) => item.id === todoId) : undefined;

    if (todoMatch && todo) {
      if (method === 'patch') {
        const body = readBody(config) as unknown as UpdateTodoRequest;
        const updated = { ...todo, ...body, updatedAt: '2026-10-03T10:00:00.000Z' };
        state.todos[state.todos.indexOf(todo)] = updated;

        if (updated.sprintId !== null) {
          updated.order = state.todos.filter(
            (item) => item.sprintId === updated.sprintId && item.id !== updated.id,
          ).length;
          backlogTodos(state).forEach((item, index) => {
            item.order = index;
          });
        }

        return { status: 200, data: { todo: cloneTodo(updated) } };
      }

      if (method === 'delete') {
        state.todos = state.todos.filter((item) => item.id !== todo.id);
        backlogTodos(state).forEach((item, index) => {
          item.order = index;
        });
        return { status: 204 };
      }
    }

    const moveMatch = /^\/todos\/([^/]+)\/move$/.exec(url);
    const moveId = moveMatch?.[1];

    if (moveMatch && method === 'post') {
      if (state.failMove) {
        return {
          status: 500,
          data: { error: { code: 'INTERNAL_ERROR', message: 'The server hiccuped.' } },
        };
      }

      const moved = state.todos.find((item) => item.id === moveId);
      if (!moved) return notFound;

      const body = readBody(config);
      const list = backlogTodos(state);
      const from = list.findIndex((item) => item.id === moved.id);
      if (from < 0) return notFound;

      const [item] = list.splice(from, 1);
      const position = Math.max(0, Math.min(Number(body.position) || 0, list.length));
      list.splice(position, 0, item as Todo);
      list.forEach((entry, index) => {
        entry.order = index;
      });

      return { status: 200, data: { todo: cloneTodo(moved) } };
    }

    return notFound;
  });
}

function renderApp() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/projects/p-1/backlog']}>
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

function backlogKeys(): string[] {
  return keysInList(screen.getByRole('region', { name: 'Backlog board' }));
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

async function openRowMenu(user: ReturnType<typeof userEvent.setup>, key: string) {
  await user.click(screen.getByRole('button', { name: `Actions for ${key}` }));
  return screen.findByRole('menu', { name: `Actions for ${key}` });
}

describe('backlog flow', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ user: demoUser, token: 'jwt-token', isAuthenticated: true });
    useAssistantStore.setState({ projectId: null, open: false, messages: [], dialog: null });
  });

  it('lists the backlog in order with its counters, and filters it instantly', async () => {
    const state = seedBackend();
    mockBacklogBackend(state);
    renderApp();

    expect(await screen.findByText('Map the onboarding flow')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Backlog board' })).toBeInTheDocument();
    expect(backlogKeys()).toEqual(['KAN-1', 'KAN-2', 'KAN-3']);
    expect(columnKeys('To do')).toEqual(['KAN-1', 'KAN-2', 'KAN-3']);
    expect(screen.getByText('5 pts')).toBeInTheDocument();
    expect(screen.getByText('Sprint 4')).toBeInTheDocument();
    expect(screen.getByLabelText('3 story points')).toBeInTheDocument();

    const user = userEvent.setup();
    const search = screen.getByLabelText('Search backlog');
    await user.type(search, 'onboarding');

    expect(backlogKeys()).toEqual(['KAN-1']);
    expect(screen.getByText('Showing 1 of 3')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'KAN-1 cannot be reordered right now' }),
    ).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    await user.selectOptions(screen.getByLabelText('Filter by priority'), 'urgent');
    expect(backlogKeys()).toEqual(['KAN-2']);

    await user.type(screen.getByLabelText('Search backlog'), 'nothing matches this');
    expect(screen.getByText('No todos match these filters')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(backlogKeys()).toEqual(['KAN-1', 'KAN-2', 'KAN-3']);
  });

  it('quick-creates a todo, keeps focus and clears active filters', async () => {
    const state = seedBackend();
    const calls = mockBacklogBackend(state);
    renderApp();

    const user = userEvent.setup();
    await screen.findByText('Map the onboarding flow');

    const search = screen.getByLabelText('Search backlog');
    await user.type(search, 'nothing matches this');
    expect(screen.getByText('No todos match these filters')).toBeInTheDocument();

    const input = screen.getByLabelText('New todo title');
    await user.type(input, 'Draft the release notes');
    await user.keyboard('{Enter}');

    await waitFor(() => expect(state.todos).toHaveLength(4));
    expect(await screen.findByText('Draft the release notes')).toBeInTheDocument();
    expect(input).toHaveValue('');
    await waitFor(() => expect(input).toHaveFocus());
    expect(search).toHaveValue('');
    expect(backlogKeys()).toEqual(['KAN-1', 'KAN-2', 'KAN-3', 'KAN-4']);

    const create = requestBodies(calls).find(
      (call) => call.method === 'post' && call.url === '/projects/p-1/todos',
    );
    expect(create?.body).toMatchObject({ title: 'Draft the release notes' });
  });

  it('shows a server field error under the quick-create input', async () => {
    const state = seedBackend();
    state.createError = 'That title is already used';
    mockBacklogBackend(state);
    renderApp();

    const user = userEvent.setup();
    await screen.findByText('Map the onboarding flow');
    const input = screen.getByLabelText('New todo title');

    await user.type(input, 'Duplicate title');
    await user.keyboard('{Enter}');

    expect(await screen.findByText('That title is already used')).toBeInTheDocument();
    expect(input).toHaveValue('Duplicate title');
    expect(state.todos).toHaveLength(3);
  });

  it('edits a todo in the details dialog and saves every changed field', async () => {
    const state = seedBackend();
    const calls = mockBacklogBackend(state);
    renderApp();

    const user = userEvent.setup();
    await screen.findByText('Map the onboarding flow');
    await user.click(screen.getByRole('button', { name: 'Map the onboarding flow' }));

    const dialog = await screen.findByRole('dialog');
    const title = within(dialog).getByLabelText('Title');
    expect(title).toHaveValue('Map the onboarding flow');

    await user.clear(title);
    await user.type(title, 'Map the new onboarding flow');
    await user.selectOptions(within(dialog).getByLabelText('Priority'), 'urgent');
    await user.selectOptions(within(dialog).getByLabelText('Story points'), '8');
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(await screen.findByText('Map the new onboarding flow')).toBeInTheDocument();

    const patch = requestBodies(calls).find(
      (call) => call.method === 'patch' && call.url === '/todos/t-1',
    );
    expect(patch?.body).toMatchObject({
      title: 'Map the new onboarding flow',
      priority: 'urgent',
      storyPoints: 8,
    });
  });

  it('asks before discarding unsaved edits, then leaves the todo untouched', async () => {
    const state = seedBackend();
    const calls = mockBacklogBackend(state);
    renderApp();

    const user = userEvent.setup();
    await screen.findByText('Map the onboarding flow');
    await user.click(screen.getByRole('button', { name: 'Map the onboarding flow' }));

    const dialog = await screen.findByRole('dialog');
    const title = within(dialog).getByLabelText('Title');
    await user.clear(title);
    await user.type(title, 'Half-finished edit');

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(within(dialog).getByText('Discard unsaved changes?')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Keep editing' }));
    expect(within(dialog).queryByText('Discard unsaved changes?')).not.toBeInTheDocument();
    expect(within(dialog).getByLabelText('Title')).toHaveValue('Half-finished edit');

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await user.click(within(dialog).getByRole('button', { name: 'Discard changes' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByText('Map the onboarding flow')).toBeInTheDocument();
    expect(
      requestBodies(calls).some((call) => call.method === 'patch' && call.url === '/todos/t-1'),
    ).toBe(false);
  });

  it('deletes a todo only after the confirmation dialog', async () => {
    const state = seedBackend();
    const calls = mockBacklogBackend(state);
    renderApp();

    const user = userEvent.setup();
    await screen.findByText('Fix the login timeout');

    const menu = await openRowMenu(user, 'KAN-2');
    await user.click(within(menu).getByRole('menuitem', { name: 'Delete todo' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Delete KAN-2?' })).toBeInTheDocument();
    expect(within(dialog).getByText(/cannot be undone/i)).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Delete todo' }));

    await waitFor(() =>
      expect(screen.queryByText('Fix the login timeout')).not.toBeInTheDocument(),
    );
    expect(state.todos.map((todo) => todo.id)).toEqual(['t-1', 't-3']);
    expect(
      requestBodies(calls).some((call) => call.method === 'delete' && call.url === '/todos/t-2'),
    ).toBe(true);
  });

  it('reorders from the row menu and restores the order when the server fails', async () => {
    const state = seedBackend();
    const calls = mockBacklogBackend(state);
    renderApp();

    const user = userEvent.setup();
    await screen.findByText('Map the onboarding flow');

    let menu = await openRowMenu(user, 'KAN-1');
    await user.click(within(menu).getByRole('menuitem', { name: 'Move to bottom' }));

    await waitFor(() => expect(backlogKeys()).toEqual(['KAN-2', 'KAN-3', 'KAN-1']));
    const move = requestBodies(calls).find(
      (call) => call.method === 'post' && call.url === '/todos/t-1/move',
    );
    expect(move?.body).toMatchObject({ position: 2 });

    state.failMove = true;
    menu = await openRowMenu(user, 'KAN-2');
    await user.click(within(menu).getByRole('menuitem', { name: 'Move to bottom' }));

    expect(await screen.findByText(/Could not reorder the backlog/i)).toBeInTheDocument();
    await waitFor(() => expect(backlogKeys()).toEqual(['KAN-2', 'KAN-3', 'KAN-1']));
  });

  it('reorders by dragging a row onto a later row', async () => {
    const state = seedBackend();
    const calls = mockBacklogBackend(state);
    renderApp();

    await screen.findByText('Map the onboarding flow');

    const handle = screen.getByRole('button', { name: 'Reorder KAN-1' });
    const targetRow = screen.getByText('Write empty-state copy').closest('li');
    expect(targetRow).not.toBeNull();

    fireEvent.dragStart(handle);
    fireEvent.dragOver(targetRow as HTMLElement);
    fireEvent.drop(targetRow as HTMLElement);

    await waitFor(() => expect(backlogKeys()).toEqual(['KAN-2', 'KAN-1', 'KAN-3']));
    const move = requestBodies(calls).find(
      (call) => call.method === 'post' && call.url === '/todos/t-1/move',
    );
    expect(move?.body).toMatchObject({ position: 1 });
  });

  it('changes status from the card menu, even while filters pause dragging', async () => {
    const state = seedBackend();
    const calls = mockBacklogBackend(state);
    renderApp();

    const user = userEvent.setup();
    await screen.findByText('Map the onboarding flow');

    await user.type(screen.getByLabelText('Search backlog'), 'onboarding');

    const menu = await openRowMenu(user, 'KAN-1');
    expect(within(menu).getByRole('menuitemradio', { name: 'To do' })).toBeChecked();
    expect(within(menu).getByRole('menuitem', { name: 'Move to bottom' })).toBeDisabled();

    await user.click(within(menu).getByRole('menuitemradio', { name: 'In review' }));

    await waitFor(() => expect(columnKeys('In review')).toEqual(['KAN-1']));
    expect(state.todos.find((todo) => todo.id === 't-1')?.status).toBe('in_review');

    const patch = requestBodies(calls).find(
      (call) => call.method === 'patch' && call.url === '/todos/t-1',
    );
    expect(patch?.body).toMatchObject({ status: 'in_review' });
  });

  it('changes status by dragging a card into another column', async () => {
    const state = seedBackend();
    const calls = mockBacklogBackend(state);
    renderApp();

    await screen.findByText('Map the onboarding flow');

    const handle = screen.getByRole('button', { name: 'Reorder KAN-1' });
    const inProgress = screen.getByRole('list', { name: 'In progress todos' });

    fireEvent.dragStart(handle);
    fireEvent.dragOver(inProgress);
    fireEvent.drop(inProgress);

    await waitFor(() => expect(columnKeys('In progress')).toEqual(['KAN-1']));
    expect(columnKeys('To do')).toEqual(['KAN-2', 'KAN-3']);

    const patch = requestBodies(calls).find(
      (call) => call.method === 'patch' && call.url === '/todos/t-1',
    );
    expect(patch?.body).toMatchObject({ status: 'in_progress' });
    expect(
      requestBodies(calls).some((call) => call.method === 'post' && call.url === '/todos/t-1/move'),
    ).toBe(false);
  });

  it('moves a todo to a planned sprint and never offers completed sprints', async () => {
    const state = seedBackend();
    const calls = mockBacklogBackend(state);
    renderApp();

    const user = userEvent.setup();
    await screen.findByText('Fix the login timeout');

    const menu = await openRowMenu(user, 'KAN-2');
    expect(within(menu).getByRole('menuitem', { name: 'Sprint 4 · Active' })).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: 'Sprint 5' })).toBeInTheDocument();
    expect(within(menu).queryByRole('menuitem', { name: /Sprint 3/ })).not.toBeInTheDocument();

    await user.click(within(menu).getByRole('menuitem', { name: 'Sprint 5' }));

    await waitFor(() => expect(backlogKeys()).not.toContain('KAN-2'));
    expect(
      within(screen.getByRole('region', { name: 'Planned sprints' })).getByText(
        'Fix the login timeout',
      ),
    ).toBeInTheDocument();
    expect(state.todos.find((todo) => todo.id === 't-2')?.sprintId).toBe('s-planned');

    const patch = requestBodies(calls).find(
      (call) => call.method === 'patch' && call.url === '/todos/t-2',
    );
    expect(patch?.body).toMatchObject({ sprintId: 's-planned' });
  });

  it('opens AI-2 from the empty backlog', async () => {
    const state = seedBackend();
    state.todos = [];
    mockBacklogBackend(state);
    renderApp();

    expect(await screen.findByText('Your backlog is empty')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Generate with AI/i }));
    expect(
      await screen.findByRole('dialog', { name: AI_MESSAGES.generateTitle }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await user.click(screen.getByRole('button', { name: 'Create a todo' }));
    expect(screen.getByLabelText('New todo title')).toHaveFocus();
  });
});
