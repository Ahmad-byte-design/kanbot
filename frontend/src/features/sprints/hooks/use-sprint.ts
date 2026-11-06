import { useQuery } from '@tanstack/react-query';
import { sprintsService } from '../../../services/sprints';
import { sprintKeys } from '../query-keys';

/** SPR-7: one sprint's metadata, used when the board response is not needed. */
export function useSprint(projectId: string | undefined, sprintId: string | undefined) {
  return useQuery({
    queryKey: sprintKeys.detail(projectId ?? '', sprintId ?? ''),
    queryFn: async () => (await sprintsService.get(sprintId as string)).sprint,
    enabled: Boolean(projectId && sprintId),
  });
}
