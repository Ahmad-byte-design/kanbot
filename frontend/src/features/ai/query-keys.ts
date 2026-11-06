/**
 * TanStack Query keys for the AI feature.
 *
 * The status entry is fetched once per session (`staleTime: Infinity`) so the
 * "Mock AI" badge is stable and never hammers the endpoint.
 */
export const aiKeys = {
  all: ['ai'] as const,
  status: () => [...aiKeys.all, 'status'] as const,
};
