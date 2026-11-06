import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import App from '../../../App';
import { mockApi, networkError, type MockHandler } from '../../../test/api-mock';
import { useAuthStore } from '../store/auth.store';

const demoUser = {
  id: 'user-1',
  name: 'Demo Student',
  email: 'demo@kanbot.dev',
  createdAt: '2026-10-02T09:00:00.000Z',
};

function renderApp(initialPath = '/login') {
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

async function fillLogin() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Email'), demoUser.email);
  await user.type(screen.getByLabelText('Password'), 'password123');
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
  return user;
}

/**
 * Auth flows end on the projects page now, so the adapter also has to answer
 * GET /projects with an empty list. Everything else goes to the test's handler.
 */
function mockAuthApi(handler: MockHandler) {
  return mockApi((config) => {
    if (config.url === '/projects' && config.method === 'get') {
      return { status: 200, data: { projects: [] } };
    }
    return handler(config);
  });
}

describe('auth flow', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false });
  });

  it('signs in and lands on the projects page', async () => {
    const calls = mockAuthApi(() => ({
      status: 200,
      data: { token: 'jwt-token', user: demoUser },
    }));

    renderApp('/login?redirect=%2Fprojects');
    await fillLogin();

    expect(await screen.findByRole('heading', { name: 'Projects' })).toBeInTheDocument();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().token).toBe('jwt-token');

    expect(calls[0]?.url).toBe('/auth/login');
    expect(calls[0]?.method).toBe('post');
  });

  it('shows the server message above the form on 401', async () => {
    mockApi(() => ({
      status: 401,
      data: { error: { code: 'UNAUTHORIZED', message: 'Incorrect email or password.' } },
    }));

    renderApp('/login');
    await fillLogin();

    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect email or password.');
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('restores a persisted token through GET /auth/me', async () => {
    useAuthStore.setState({ token: 'persisted-token', user: null, isAuthenticated: false });
    const calls = mockAuthApi(() => ({ status: 200, data: { user: demoUser } }));

    renderApp('/projects');

    expect(await screen.findByRole('heading', { name: 'Projects' })).toBeInTheDocument();

    expect(calls[0]?.url).toBe('/auth/me');
    expect(calls[0]?.headers.get('Authorization')).toBe('Bearer persisted-token');
  });

  it('clears the session when /auth/me rejects an expired token', async () => {
    useAuthStore.setState({ token: 'expired-token', user: null, isAuthenticated: false });
    mockApi(() => ({
      status: 401,
      data: {
        error: { code: 'UNAUTHORIZED', message: 'Your session has expired. Please sign in again.' },
      },
    }));

    renderApp('/projects');

    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('shows a retry screen when the session check fails on the network', async () => {
    useAuthStore.setState({ token: 'persisted-token', user: null, isAuthenticated: false });
    mockApi(() => networkError());

    renderApp('/projects');

    expect(
      await screen.findByRole('heading', { name: "We couldn't reach your workspace" }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(useAuthStore.getState().token).toBe('persisted-token');
  });

  it('registers and lands on the projects page', async () => {
    const calls = mockAuthApi(() => ({
      status: 201,
      data: { token: 'jwt-token', user: demoUser },
    }));

    renderApp('/register');
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Full name'), 'Demo Student');
    await user.type(screen.getByLabelText('Email'), demoUser.email);
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('heading', { name: 'Projects' })).toBeInTheDocument();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(calls[0]?.url).toBe('/auth/register');
  });

  it('shows a duplicate email error under the email field', async () => {
    mockApi(() => ({
      status: 409,
      data: {
        error: {
          code: 'CONFLICT',
          message: 'An account with this email already exists.',
          details: [{ path: 'email', message: 'An account with this email already exists.' }],
        },
      },
    }));

    renderApp('/register');
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Full name'), 'Demo Student');
    await user.type(screen.getByLabelText('Email'), demoUser.email);
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('An account with this email already exists.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Create your account' })).toBeInTheDocument();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('signs out, clears the token and returns to login', async () => {
    mockAuthApi(() => ({ status: 200, data: { token: 'jwt-token', user: demoUser } }));

    renderApp('/login');
    const user = await fillLogin();
    await screen.findByRole('heading', { name: 'Projects' });

    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    });
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
