import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sprintsService } from '../../../services/sprints';
import type { Sprint } from '../../../types/api';
import { invalidateSprintAndBacklog } from '../lib/sprint-cache';
import type { CompleteSprintInput } from '../types/sprints.types';

/**
 * SPR-6: close the active sprint. Unfinished todos move to the backlog or a
 * planned sprint, so the backlog cache is refreshed as well.
 */
export function useCompleteSprint(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation<Sprint, unknown, CompleteSprintInput>({
    mutationFn: async ({ sprintId, moveUnfinishedTo }) =>
      (await sprintsService.complete(sprintId, { moveUnfinishedTo })).sprint,
    onSuccess: () => invalidateSprintAndBacklog(queryClient, projectId),
  });
}
