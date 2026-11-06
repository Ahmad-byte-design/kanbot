import { useQuery } from '@tanstack/react-query';
import { sprintsService } from '../../../services/sprints';
import { sprintKeys } from '../query-keys';

/** SPR-1 / SPR-7: every sprint of the project, in the server's display order. */
export function useSprints(projectId: string | undefined) {
  return useQuery({
    queryKey: sprintKeys.list(projectId ?? ''),
    queryFn: async () => (await sprintsService.list(projectId as string)).sprints,
    enabled: Boolean(projectId),
  });
}
