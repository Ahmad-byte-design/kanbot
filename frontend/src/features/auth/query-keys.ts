/**
 * TanStack Query keys for the auth feature.
 *
 * Keeping keys in one place means hooks, prefetches and invalidations always
 * agree on the same cache entry. Extend this object as the feature grows.
 */
export const authKeys = {
  all: ['auth'] as const,
  me: (token: string | null) => [...authKeys.all, 'me', token] as const,
};
