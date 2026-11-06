import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { authService } from '../../../services/auth';
import { ApiError } from '../../../services/client';
import { AUTH_ROUTES } from '../constants/auth.constants';
import { authKeys } from '../query-keys';
import { useAuthStore } from '../store/auth.store';
import type { AuthUser } from '../types/auth.types';

/** Reactive view of the session for components. */
export function useAuthSession() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const signIn = useAuthStore((state) => state.signIn);
  const signOut = useAuthStore((state) => state.signOut);

  return { user, token, isAuthenticated, signIn, signOut };
}

/**
 * AUTH-3: when a persisted token exists, validate it with GET /auth/me before
 * the app renders. The store only persists the token, never the user.
 */
export function useAuthBootstrap() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const signIn = useAuthStore((state) => state.signIn);
  const signOut = useAuthStore((state) => state.signOut);
  const hydrated = useSyncExternalStore(
    (onStoreChange) => useAuthStore.subscribe(onStoreChange),
    () => useAuthStore.persist.hasHydrated(),
    () => false,
  );

  const needsValidation = hydrated && Boolean(token) && !user;

  const session = useQuery<AuthUser>({
    queryKey: authKeys.me(token),
    queryFn: async () => (await authService.me()).user,
    enabled: needsValidation,
    retry: false,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (session.data && token) signIn(token, session.data);
  }, [session.data, token, signIn]);

  useEffect(() => {
    if (session.error instanceof ApiError && session.error.status === 401) signOut();
  }, [session.error, signOut]);

  const isReady = hydrated && (!token || Boolean(user));

  return {
    isReady,
    error: session.error,
    retry: () => {
      void session.refetch();
    },
  };
}

/** AUTH-4: clear the session + all cached server data, then go to login. */
export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const signOut = useAuthStore((state) => state.signOut);

  return useCallback(() => {
    signOut();
    queryClient.clear();
    navigate(AUTH_ROUTES.login, { replace: true });
  }, [navigate, queryClient, signOut]);
}
