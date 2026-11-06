import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sprintsService } from '../../../services/sprints';
import type { Sprint } from '../../../types/api';
import { invalidateSprintDependents } from '../lib/sprint-cache';
import type { StartSprintInput } from '../types/sprints.types';

/** SPR-3: start a planned sprint; the server enforces one active sprint. */
export function useStartSprint(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation<Sprint, unknown, StartSprintInput>({
    mutationFn: async ({ sprintId, changes }) =>
      (await sprintsService.start(sprintId, changes)).sprint,
    onSuccess: () => invalidateSprintDependents(queryClient, projectId),
  });
}
