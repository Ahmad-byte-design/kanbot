import type { InternalAxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import App from '../../../App';
import { mockApi } from '../../../test/api-mock';
import { useAuthStore } from '../../auth/store/auth.store';
import type { CreateProjectRequest, ProjectWithStats } from '../../../types/api';
import { suggestProjectKey } from '../lib/project-tone';

const demoUser = {
  id: 'user-1',
  name: 'Demo Student',
  email: 'demo@kanbot.dev',
  createdAt: '2026-10-02T09:00:00.000Z',
};

function makeProject(overrides: Partial<ProjectWithStats> = {}): ProjectWithStats {
  return {
    id: 'p-1',
    name: 'Mobile App Redesign',
    key: 'MAR',
    description: 'A calmer way to plan the next release.',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-02T10:00:00.000Z',
    stats: {
      backlogCount: 4,
      totalTodos: 9,
      activeSprint: { id: 's-1', name: 'Sprint 3' },
    },
    ...overrides,
  };
}

interface BackendState {
  projects: ProjectWithStats[];
  nextId: number;
}

function seedBackend(): BackendState {
  return {
    nextId: 3,
    projects: [
      makeProject(),
      makeProject({
        id: 'p-2',
        name: 'Analytics Dashboard',
        key: 'ANA',
        description: 'Usage numbers at a glance.',
        stats: { backlogCount: 2, totalTodos: 3, activeSprint: null },
      }),
    ],
  };
}

function readBody(config: InternalAxiosRequestConfig): Record<string, unknown> {
  const raw = config.data;
  if (typeof raw === 'string') return JSON.parse(raw) as Record<string, unknown>;
  if (raw && typeof raw === 'object') return raw as Record<string, unknown>;
  return {};
}

const notFound = {
  status: 404,
  data: { error: { code: 'NOT_FOUND', message: 'Project not found' } },
};

const duplicateKey = {
  status: 409,
  data: {
    error: {
      code: 'CONFLICT',
      message: 'You already have a project with the key "MAR".',
      details: [{ path: 'key', message: 'This key is already used by another project' }],
    },
  },
};

/** A small stateful stand-in for the Express project routes. */
function mockProjectsBackend(state: BackendState) {
  return mockApi((config) => {
    const method = (config.method ?? 'get').toLowerCase();
    const url = config.url ?? '';

    if (url === '/auth/me') return { status: 200, data: { user: demoUser } };

    if (url === '/projects') {
      if (method === 'get') return { status: 200, data: { projects: state.projects } };

      if (method === 'post') {
        const body = readBody(config) as unknown as CreateProjectRequest;
        const key = (body.key ?? suggestProjectKey(body.name)).toUpperCase();
        if (state.projects.some((project) => project.key === key)) return duplicateKey;

        const project = makeProject({
          id: `p-${state.nextId}`,
          name: body.name,
          key,
          description: body.description ?? '',
          stats: { backlogCount: 0, totalTodos: 0, activeSprint: null },
        });
        state.nextId += 1;
        state.projects = [project, ...state.projects];

        return { status: 201, data: { project } };
      }
    }

    const todosMatch = /^\/projects\/([^/]+)\/todos(?:\?.*)?$/.exec(url);
    if (todosMatch) {
      const owner = state.projects.find((item) => item.id === todosMatch[1]);
      if (!owner) return notFound;
      if (method === 'get') return { status: 200, data: { todos: [] } };
    }

    const sprintsMatch = /^\/projects\/([^/]+)\/sprints$/.exec(url);
    if (sprintsMatch) {
      const owner = state.projects.find((item) => item.id === sprintsMatch[1]);
      if (!owner) return notFound;
      if (method === 'get') return { status: 200, data: { sprints: [] } };
    }

    const match = /^\/projects\/([^/]+)$/.exec(url);
    const projectId = match?.[1];

    if (projectId) {
      const project = state.projects.find((item) => item.id === projectId);
      if (!project) return notFound;

      if (method === 'get') return { status: 200, data: { project } };

      if (method === 'patch') {
        const body = readBody(config);
        const key = String(body.key ?? project.key).toUpperCase();
        if (state.projects.some((item) => item.id !== project.id && item.key === key)) {
          return duplicateKey;
        }
        Object.assign(project, body, { key, updatedAt: new Date().toISOString() });
        return { status: 200, data: { project } };
      }

      if (method === 'delete') {
        state.projects = state.projects.filter((item) => item.id !== project.id);
        return { status: 204 };
      }
    }

    return notFound;
  });
}

function renderApp(initialPath = '/projects') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('projects flow', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ user: demoUser, token: 'jwt-token', isAuthenticated: true });
  });

  it('lists projects with their key, counters and active sprint', async () => {
    mockProjectsBackend(seedBackend());
    renderApp();

    expect(await screen.findByRole('heading', { name: 'Projects' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Mobile App Redesign' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Analytics Dashboard' })).toBeInTheDocument();

    expect(screen.getByText('Sprint 3')).toBeInTheDocument();
    expect(screen.getByText('No active sprint')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open Mobile App Redesign backlog' })).toHaveAttribute(
      'href',
      '/projects/p-1/backlog',
    );
  });

  it('creates a project and opens its backlog', async () => {
    const state = seedBackend();
    mockProjectsBackend(state);
    renderApp();

    const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'Mobile App Redesign' });
    await user.click(screen.getByRole('button', { name: 'New project' }));

    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('Project name'), 'Website Refresh');
    await user.type(within(dialog).getByLabelText('Key'), 'web');
    await user.type(within(dialog).getByLabelText('Description'), 'New marketing site');
    await user.click(within(dialog).getByRole('button', { name: 'Create project' }));

    expect(
      await screen.findByRole('heading', { name: 'Website Refresh', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('WEB').length).toBeGreaterThan(0);
    expect(await screen.findByText('Your backlog is empty')).toBeInTheDocument();

    expect(state.projects[0]).toMatchObject({ name: 'Website Refresh', key: 'WEB' });
    expect(state.projects).toHaveLength(3);
  });

  it('shows a duplicate key error under the key field', async () => {
    const state = seedBackend();
    mockProjectsBackend(state);
    renderApp();

    const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'Mobile App Redesign' });
    await user.click(screen.getByRole('button', { name: 'New project' }));

    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('Project name'), 'Marketing site');
    await user.type(within(dialog).getByLabelText('Key'), 'mar');
    await user.click(within(dialog).getByRole('button', { name: 'Create project' }));

    expect(
      await within(dialog).findByText('This key is already used by another project'),
    ).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(state.projects).toHaveLength(2);
  });

  it('edits a project and explains that existing todo keys do not change', async () => {
    const state = seedBackend();
    mockProjectsBackend(state);
    renderApp('/projects/p-1/backlog');

    const user = userEvent.setup();
    expect(await screen.findByRole('heading', { name: 'Mobile App Redesign' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Edit project' }));

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText(/Changing the key only affects new todos/i),
    ).toBeInTheDocument();

    const name = within(dialog).getByLabelText('Project name');
    await user.clear(name);
    await user.type(name, 'Mobile App Rebuild');
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }));

    expect(
      await screen.findByRole('heading', { name: 'Mobile App Rebuild' }),
    ).toBeInTheDocument();
    expect(state.projects[0]?.name).toBe('Mobile App Rebuild');
    expect(state.projects[0]?.key).toBe('MAR');
  });

  it('deletes a project after naming it and warning about todos and sprints', async () => {
    const state = seedBackend();
    mockProjectsBackend(state);
    renderApp();

    const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'Mobile App Redesign' });
    await user.click(screen.getByRole('button', { name: 'Delete Mobile App Redesign' }));

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByRole('heading', { name: 'Delete “Mobile App Redesign”?' }),
    ).toBeInTheDocument();
    expect(within(dialog).getByText(/every todo and every sprint/i)).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Delete project' }));

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: 'Mobile App Redesign' }),
      ).not.toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: 'Analytics Dashboard' })).toBeInTheDocument();
    expect(state.projects.map((project) => project.id)).toEqual(['p-2']);
  });

  it('switches project through the sidebar and follows the URL', async () => {
    mockProjectsBackend(seedBackend());
    renderApp('/projects/p-1/backlog');

    const user = userEvent.setup();
    expect(await screen.findByRole('heading', { name: 'Mobile App Redesign' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^Mobile App Redesign/ }));

    const menu = await screen.findByRole('menu', { name: 'Switch project' });
    await user.click(within(menu).getByRole('menuitem', { name: /Analytics Dashboard/ }));

    expect(await screen.findByRole('heading', { name: 'Analytics Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Backlog/ })).toHaveAttribute(
      'href',
      '/projects/p-2/backlog',
    );
  });

  it('shows a not-found screen for an unknown project id', async () => {
    mockProjectsBackend(seedBackend());
    renderApp('/projects/missing/backlog');

    expect(
      await screen.findByRole('heading', { name: 'This project is no longer here' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to projects/ })).toHaveAttribute(
      'href',
      '/projects',
    );
  });
});
