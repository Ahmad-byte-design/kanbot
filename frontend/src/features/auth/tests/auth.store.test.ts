import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from '../store/auth.store';

const user = {
  id: 'user-1',
  name: 'Ahmad Hasan',
  email: 'ahmad@example.com',
  createdAt: '2026-11-01T10:00:00.000Z',
};

describe('auth store', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false });
  });

  it('starts unauthenticated', () => {
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('signs a user in', () => {
    useAuthStore.getState().signIn('token-123', user);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.token).toBe('token-123');
    expect(state.user?.email).toBe('ahmad@example.com');
  });

  it('signs the user out and removes the persisted token', () => {
    useAuthStore.getState().signIn('token-123', user);
    useAuthStore.getState().signOut();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });

  it('persists only the token', () => {
    useAuthStore.getState().signIn('token-123', user);

    const persisted = JSON.parse(localStorage.getItem('auth-storage') ?? '{}');
    expect(persisted.state).toEqual({ token: 'token-123' });
  });
});
