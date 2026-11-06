/**
 * TanStack Query keys for the sprints feature.
 *
 * Every sprint entry for a project shares the `['sprints', projectId]` prefix,
 * so a mutation can invalidate the list, the history detail and the board in
 * one call. The backlog feature re-exports `sprintKeys` for its sprint options.
 */
export const sprintKeys = {
  all: ['sprints'] as const,
  project: (projectId: string) => [...sprintKeys.all, projectId] as const,
  list: (projectId: string) => [...sprintKeys.project(projectId), 'list'] as const,
  detail: (projectId: string, sprintId: string) =>
    [...sprintKeys.project(projectId), 'detail', sprintId] as const,
  board: (projectId: string, sprintId: string) =>
    [...sprintKeys.project(projectId), 'board', sprintId] as const,
};
