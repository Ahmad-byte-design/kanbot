import { useQuery } from '@tanstack/react-query';
import { sprintsService } from '../../../services/sprints';
import { sprintKeys } from '../query-keys';

/**
 * Sprint destinations for BL-3/BL-7. Completed sprints are history: the server
 * rejects any todo entering them, so the UI filters them out.
 */
export function useSprintOptions(projectId: string | undefined) {
  return useQuery({
    queryKey: sprintKeys.list(projectId ?? ''),
    queryFn: async () => (await sprintsService.list(projectId as string)).sprints,
    enabled: Boolean(projectId),
  });
}
