import { sprintKeys } from '../sprints/query-keys';

/**
 * TanStack Query keys for the backlog feature.
 *
 * Sprint options are read here too: the backlog needs them for the details
 * form and the "move to sprint" menu. The canonical sprint keys live in the
 * sprints feature, so both features share one cache entry.
 */
export const todoKeys = {
  all: ['todos'] as const,
  backlog: (projectId: string) => [...todoKeys.all, 'backlog', projectId] as const,
  /** All todos of a project; the backlog page groups them by sprint. */
  project: (projectId: string) => [...todoKeys.all, 'project', projectId] as const,
};

export { sprintKeys };
