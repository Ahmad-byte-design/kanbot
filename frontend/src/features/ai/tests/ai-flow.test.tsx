import type { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
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
import { AI_MESSAGES } from '../constants/ai.constants';
import { useAssistantStore } from '../store/assistant.store';

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
  stats: { backlogCount: 2, totalTodos: 3, activeSprint: { id: 's-active', name: 'Sprint 4' } },
};

const NOW = '2026-11-06T09:00:00.000Z';
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
  nextTodoNumber: number;
  failGenerate: boolean;
  failChat: boolean;
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

function seedState(): BackendState {
  return {
    nextSprintNumber: 8,
    nextTodoNumber: 100,
    failGenerate: false,
    failChat: false,
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
      }),
    ],
    todos: [
      makeTodo({
        id: 'a-1',
        key: 'KAN-1',
        title: 'Sketch the sprint board',
        sprintId: 's-active',
        status: 'done',
        type: 'story',
        priority: 'high',
        storyPoints: 3,
      }),
      makeTodo({
        id: 'a-2',
        key: 'KAN-2',
        title: 'Wire the drag handlers',
        sprintId: 's-active',
        status: 'in_progress',
        storyPoints: 2,
      }),
      makeTodo({
        id: 'b-1',
        key: 'KAN-20',
        title: 'Polish the profile form',
        storyPoints: 2,
        priority: 'high',
      }),
      makeTodo({
        id: 'b-2',
        key: 'KAN-21',
        title: 'Add avatar uploads',
        storyPoints: 3,
        type: 'story',
      }),
    ],
  };
}

function cloneTodo(todo: Todo): Todo {
  return { ...todo, labels: [...todo.labels] };
}

function byOrder(a: Todo, b: Todo): number {
  return a.order - b.order || a.createdAt.localeCompare(b.createdAt);
}

function sprintWithStats(state: BackendState, sprint: Sprint): Sprint {
  return { ...sprint, stats: statsFor(state.todos.filter((todo) => todo.sprintId === sprint.id)) };
}

const STATUS_RANK: Record<Sprint['status'], number> = { active: 0, planned: 1, completed: 2 };

function orderedSprints(state: BackendState): Sprint[] {
  return [...state.sprints]
    .sort(
      (a, b) =>
        STATUS_RANK[a.status] - STATUS_RANK[b.status] || a.createdAt.localeCompare(b.createdAt),
    )
    .map((sprint) => sprintWithStats(state, sprint));
}

function columnsFor(state: BackendState, sprintId: string) {
  return Object.fromEntries(
    TODO_STATUSES.map((status) => [
      status,
      state.todos
        .filter((todo) => todo.sprintId === sprintId && todo.status === status)
        .sort(byOrder)
        .map(cloneTodo),
    ]),
  ) as Record<TodoStatus, Todo[]>;
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

const SUMMARY_MARKDOWN =
  '### Highlights\n\nWe shipped **the board** and closed two of five points.\n\n' +
  '### Not finished\n\n- Drag handlers\n\n### Suggestions\n\nFinish KAN-2 before adding new work.';

const REPLY_MARKDOWN =
  '**Start with** the board work.\n\n- Finish **KAN-1**\n- Then unblock *KAN-2*';

/**
 * A stateful stand-in for the project, sprint, todo and AI routes. AI behaviour
 * is controlled by the two failure flags so tests can exercise retries.
 */
function mockBackend(state: BackendState) {
  return mockApi((config) => {
    const method = (config.method ?? 'get').toLowerCase();
    const url = config.url ?? '';

    if (url === '/auth/me') return { status: 200, data: { user: demoUser } };
    if (url === '/projects') return { status: 200, data: { projects: [projectResponse(state)] } };
    if (url === '/projects/p-1' && method === 'get') {
      return { status: 200, data: { project: projectResponse(state) } };
    }

    if (url === '/ai/status' && method === 'get') {
      return { status: 200, data: { mode: 'mock', model: null } };
    }

    if (url === '/projects/p-1/ai/chat' && method === 'post') {
      if (state.failChat) {
        return {
          status: 429,
          data: {
            error: {
              code: 'RATE_LIMITED',
              message: 'Too many AI requests. Wait a minute and try again.',
            },
          },
        };
      }
      return {
        status: 200,
        data: {
          message: {
            role: 'assistant',
            content:
              (readBody(config).messages as { content?: string }[] | undefined)?.at(-1)
                ?.content === 'And then?'
                ? 'Next, **review** the board.'
                : REPLY_MARKDOWN,
          },
          source: 'mock',
        },
      };
    }

    if (url === '/projects/p-1/ai/generate-todos' && method === 'post') {
      if (state.failGenerate) {
        return {
          status: 502,
          data: {
            error: {
              code: 'AI_ERROR',
              message: 'The AI provider is unavailable. Try again in a moment.',
            },
          },
        };
      }
      return {
        status: 200,
        data: {
          todos: [
            {
              title: 'Add avatar upload',
              description: 'Drag and drop with a preview.',
              type: 'story',
              priority: 'high',
              storyPoints: 3,
            },
            {
              title: 'Validate the profile form',
              description: 'Inline errors for every field.',
              type: 'task',
              priority: 'medium',
              storyPoints: 2,
            },
          ],
          source: 'mock',
        },
      };
    }

    if (url === '/projects/p-1/ai/plan-sprint' && method === 'post') {
      return {
        status: 200,
        data: {
          goal: 'Finish the onboarding',
          todoIds: ['b-1', 'b-2'],
          totalPoints: 5,
          reasoning: 'These two backlog items fit the capacity and share one theme.',
          source: 'mock',
        },
      };
    }

    const summaryMatch = /^\/sprints\/([^/]+)\/ai\/summary$/.exec(url);
    if (summaryMatch && method === 'post') {
      const sprint = state.sprints.find((item) => item.id === summaryMatch[1]);
      if (!sprint) return notFound('Sprint not found');

      sprint.summary = {
        content: SUMMARY_MARKDOWN,
        source: 'mock',
        generatedAt: '2026-11-06T10:30:00.000Z',
      };

      return {
        status: 200,
        data: { sprint: sprintWithStats(state, sprint), summary: sprint.summary },
      };
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
        createdAt: NOW,
        updatedAt: NOW,
      });
      state.sprints.push(sprint);

      const ids = (body.todoIds as string[] | undefined) ?? [];
      ids.forEach((id, index) => {
        const todo = state.todos.find((item) => item.id === id);
        if (todo) {
          todo.sprintId = sprint.id;
          todo.status = 'todo';
          todo.order = index;
        }
      });

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

    if (url === '/projects/p-1/todos/bulk' && method === 'post') {
      const body = readBody(config);
      const drafts = (body.todos as Record<string, unknown>[] | undefined) ?? [];
      const created = drafts.map((draft, index) => {
        const number = state.nextTodoNumber;
        state.nextTodoNumber += 1;
        const todo = makeTodo({
          id: `c-${number}`,
          key: `KAN-${number}`,
          title: String(draft.title ?? ''),
          description: String(draft.description ?? ''),
          type: (draft.type as Todo['type'] | undefined) ?? 'task',
          priority: (draft.priority as Todo['priority'] | undefined) ?? 'medium',
          storyPoints: (draft.storyPoints as Todo['storyPoints'] | undefined) ?? null,
          order: state.todos.filter((item) => item.sprintId === null).length + index,
          createdAt: NOW,
          updatedAt: NOW,
        });
        state.todos.push(todo);
        return cloneTodo(todo);
      });

      return { status: 201, data: { todos: created } };
    }

    const boardMatch = /^\/sprints\/([^/]+)\/todos$/.exec(url);
    if (boardMatch && method === 'get') {
      const sprint = state.sprints.find((item) => item.id === boardMatch[1]);
      if (!sprint) return notFound('Sprint not found');
      return {
        status: 200,
        data: { sprint: sprintWithStats(state, sprint), columns: columnsFor(state, sprint.id) },
      };
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

function requests(calls: InternalAxiosRequestConfig[]) {
  return calls.map((call) => ({
    method: (call.method ?? 'get').toLowerCase(),
    url: call.url,
    body: call.data ? readBody(call) : {},
  }));
}

function chatCalls(calls: InternalAxiosRequestConfig[]) {
  return requests(calls).filter((call) => call.url === '/projects/p-1/ai/chat');
}

async function openAssistant() {
  const user = userEvent.setup();
  const trigger = await screen.findByRole('button', { name: AI_MESSAGES.trigger });
  await user.click(trigger);
  return { user, drawer: await screen.findByRole('dialog', { name: AI_MESSAGES.panelTitle }) };
}

describe('AI assistant flow', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ user: demoUser, token: 'jwt-token', isAuthenticated: true });
    useAssistantStore.setState({ projectId: null, open: false, messages: [], dialog: null });
  });

  it('sends the whole conversation, renders Markdown and keeps it while closed', async () => {
    const state = seedState();
    const calls = mockBackend(state);
    renderApp('/projects/p-1/backlog');

    const { user, drawer } = await openAssistant();
    expect(await within(drawer).findByText('Mock AI')).toBeInTheDocument();

    const composer = within(drawer).getByRole('textbox', { name: AI_MESSAGES.chatPlaceholder });
    await user.type(composer, 'What should I do first?{Enter}');

    expect(await within(drawer).findByText('Start with')).toBeInTheDocument();
    expect(within(drawer).getByText('KAN-1')).toBeInTheDocument();

    const firstSend = chatCalls(calls)[0];
    expect(firstSend?.body).toEqual({
      messages: [{ role: 'user', content: 'What should I do first?' }],
    });

    // A second turn posts the full history, not just the new message.
    await user.type(composer, 'And then?{Enter}');
    expect(await screen.findByText('review')).toBeInTheDocument();
    expect(chatCalls(calls)[1]?.body).toEqual({
      messages: [
        { role: 'user', content: 'What should I do first?' },
        { role: 'assistant', content: REPLY_MARKDOWN },
        { role: 'user', content: 'And then?' },
      ],
    });

    // Closing and reopening keeps the conversation.
    await user.click(within(drawer).getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog', { name: AI_MESSAGES.panelTitle })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: AI_MESSAGES.trigger }));
    expect(await screen.findByText('What should I do first?')).toBeInTheDocument();
    expect(screen.getByText('And then?')).toBeInTheDocument();

    // New chat clears it, and Shift+Enter adds a line instead of sending.
    await user.click(screen.getByRole('button', { name: AI_MESSAGES.newChat }));
    expect(screen.getByText(AI_MESSAGES.emptyTitle)).toBeInTheDocument();
    expect(screen.queryByText('What should I do first?')).not.toBeInTheDocument();

    const afterClear = screen.getByRole('textbox', { name: AI_MESSAGES.chatPlaceholder });
    await user.type(afterClear, 'Line one{Shift>}{Enter}{/Shift}Line two');
    expect(afterClear).toHaveValue('Line one\nLine two');
    expect(chatCalls(calls)).toHaveLength(2);
  });

  it('generates drafts and only saves the checked, edited ones', async () => {
    const state = seedState();
    const calls = mockBackend(state);
    renderApp('/projects/p-1/backlog');

    const { user, drawer } = await openAssistant();
    await user.click(within(drawer).getByRole('button', { name: new RegExp(`^${AI_MESSAGES.createTodos}`) }));

    const dialog = await screen.findByRole('dialog', { name: AI_MESSAGES.generateTitle });
    await user.type(
      within(dialog).getByLabelText(AI_MESSAGES.promptLabel),
      'A profile page with avatar upload',
    );

    const count = within(dialog).getByLabelText(AI_MESSAGES.countLabel);
    await user.clear(count);
    await user.type(count, '2');
    await user.click(within(dialog).getByRole('button', { name: AI_MESSAGES.generate }));

    expect(await within(dialog).findByText(AI_MESSAGES.draftsTitle)).toBeInTheDocument();
    const checkboxes = within(dialog).getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);
    expect(checkboxes[0]).toBeChecked();

    await user.click(within(dialog).getByRole('checkbox', { name: 'Include draft 1' }));

    const secondTitle = within(dialog).getByLabelText('Draft 2 title');
    await user.clear(secondTitle);
    await user.type(secondTitle, 'Validate avatar uploads');

    expect(
      requests(calls).some((call) => call.url === '/projects/p-1/todos/bulk'),
    ).toBe(false);

    await user.click(
      within(dialog).getByRole('button', { name: AI_MESSAGES.addToBacklog(1) }),
    );

    const saved = await screen.findByText('Validate avatar uploads');
    expect(saved).toBeInTheDocument();

    const bulk = requests(calls).find((call) => call.url === '/projects/p-1/todos/bulk');
    const body = bulk?.body as { todos: { title: string; storyPoints: number | null }[] };
    expect(body.todos).toHaveLength(1);
    expect(body.todos[0]).toMatchObject({ title: 'Validate avatar uploads', storyPoints: 2 });
  });

  it('plans a sprint against capacity and creates it from the checked todos', async () => {
    const state = seedState();
    const calls = mockBackend(state);
    renderApp('/projects/p-1/backlog');

    const { user, drawer } = await openAssistant();
    await user.click(within(drawer).getByRole('button', { name: new RegExp(`^${AI_MESSAGES.planSprint}`) }));

    const dialog = await screen.findByRole('dialog', { name: AI_MESSAGES.planTitle });
    await user.type(within(dialog).getByLabelText(AI_MESSAGES.capacityLabel), '5');
    await user.type(within(dialog).getByLabelText(/Focus/), 'Finish onboarding');
    await user.click(within(dialog).getByRole('button', { name: AI_MESSAGES.suggest }));

    expect(await within(dialog).findByDisplayValue('Finish the onboarding')).toBeInTheDocument();
    expect(within(dialog).getByText('Polish the profile form')).toBeInTheDocument();
    expect(within(dialog).getByText('Add avatar uploads')).toBeInTheDocument();
    expect(
      within(dialog).getByText(/These two backlog items fit the capacity/),
    ).toBeInTheDocument();

    const progress = within(dialog).getByRole('progressbar', {
      name: 'Selected points against capacity',
    });
    expect(progress).toHaveAttribute('aria-valuenow', '5');

    await user.click(within(dialog).getByRole('checkbox', { name: 'Include KAN-21' }));
    expect(progress).toHaveAttribute('aria-valuenow', '2');

    await user.click(
      within(dialog).getByRole('button', { name: AI_MESSAGES.createSprint(1) }),
    );

    expect(await screen.findByText('Sprint 8')).toBeInTheDocument();

    const created = requests(calls).find(
      (call) => call.method === 'post' && call.url === '/projects/p-1/sprints',
    );
    expect(created?.body).toEqual({ goal: 'Finish the onboarding', todoIds: ['b-1'] });
    expect(state.todos.find((todo) => todo.id === 'b-1')?.sprintId).toBe('s-8');
    expect(state.todos.find((todo) => todo.id === 'b-2')?.sprintId).toBeNull();
  });

  it('summarizes the active sprint and shows the saved summary on the report', async () => {
    const state = seedState();
    const calls = mockBackend(state);
    renderApp('/projects/p-1/board');

    const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'Sprint 4' });
    await user.click(screen.getByRole('button', { name: AI_MESSAGES.summaryOnBoard }));

    const dialog = await screen.findByRole('dialog', { name: AI_MESSAGES.summaryTitle });
    await user.click(within(dialog).getByRole('button', { name: AI_MESSAGES.summaryGenerate }));

    expect(await within(dialog).findByText('Highlights')).toBeInTheDocument();
    expect(within(dialog).getByText('the board')).toBeInTheDocument();
    expect(
      within(dialog).getByText(new RegExp(`Generated .* · ${AI_MESSAGES.summarySaved}`)),
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await user.click(screen.getByRole('link', { name: 'Sprint details' }));

    expect(await screen.findByText('AI summary')).toBeInTheDocument();
    expect(screen.getByText(/closed two of five points/)).toBeInTheDocument();
    expect(state.sprints.find((sprint) => sprint.id === 's-active')?.summary?.content).toBe(
      SUMMARY_MARKDOWN,
    );

    await user.click(screen.getByRole('button', { name: AI_MESSAGES.summaryRegenerate }));
    expect(
      requests(calls).filter((call) => call.url === '/sprints/s-active/ai/summary'),
    ).toHaveLength(2);
  });

  it('shows the AI error with a retry when generating todos fails', async () => {
    const state = seedState();
    state.failGenerate = true;
    mockBackend(state);
    renderApp('/projects/p-1/backlog');

    const { user, drawer } = await openAssistant();
    await user.click(within(drawer).getByRole('button', { name: new RegExp(`^${AI_MESSAGES.createTodos}`) }));

    const dialog = await screen.findByRole('dialog', { name: AI_MESSAGES.generateTitle });
    await user.type(within(dialog).getByLabelText(AI_MESSAGES.promptLabel), 'Profile page');
    await user.click(within(dialog).getByRole('button', { name: AI_MESSAGES.generate }));

    expect(
      await within(dialog).findByText('The AI provider is unavailable. Try again in a moment.'),
    ).toBeInTheDocument();

    state.failGenerate = false;
    await user.click(within(dialog).getByRole('button', { name: AI_MESSAGES.tryAgain }));

    expect(await within(dialog).findByText(AI_MESSAGES.draftsTitle)).toBeInTheDocument();
  });

  it('shows the rate-limit message and retries a failed chat turn without duplicating it', async () => {
    const state = seedState();
    state.failChat = true;
    const calls = mockBackend(state);
    renderApp('/projects/p-1/backlog');

    const { user, drawer } = await openAssistant();
    const composer = within(drawer).getByRole('textbox', { name: AI_MESSAGES.chatPlaceholder });
    await user.type(composer, 'Hello there{Enter}');

    expect(
      await within(drawer).findByText('Too many AI requests. Wait a minute and try again.'),
    ).toBeInTheDocument();
    expect(within(drawer).getByText('Hello there')).toBeInTheDocument();

    state.failChat = false;
    await user.click(within(drawer).getByRole('button', { name: AI_MESSAGES.tryAgain }));

    expect(await within(drawer).findByText('Start with')).toBeInTheDocument();
    expect(within(drawer).getAllByText('Hello there')).toHaveLength(1);

    const sent = chatCalls(calls);
    expect(sent).toHaveLength(2);
    expect(sent[1]?.body).toEqual({ messages: [{ role: 'user', content: 'Hello there' }] });
  });
});
