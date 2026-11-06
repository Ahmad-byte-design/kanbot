/**
 * TanStack Query keys for the projects feature.
 *
 * The list and every project detail are separate entries; mutations update the
 * detail entry directly and invalidate the list so counters stay accurate.
 */
export const projectKeys = {
  all: ['projects'] as const,
  list: () => [...projectKeys.all, 'list'] as const,
  detail: (projectId: string) => [...projectKeys.all, 'detail', projectId] as const,
};
