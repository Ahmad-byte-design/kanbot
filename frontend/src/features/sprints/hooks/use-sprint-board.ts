import { useQuery } from '@tanstack/react-query';
import { sprintsService } from '../../../services/sprints';
import { sprintKeys } from '../query-keys';

/** SPR-4 / SPR-7: the sprint plus its todos grouped by status column. */
export function useSprintBoard(
  projectId: string | undefined,
  sprintId: string | undefined,
) {
  return useQuery({
    queryKey: sprintKeys.board(projectId ?? '', sprintId ?? ''),
    queryFn: async () => sprintsService.board(sprintId as string),
    enabled: Boolean(projectId && sprintId),
  });
}
