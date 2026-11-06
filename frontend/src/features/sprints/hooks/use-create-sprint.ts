import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sprintsService } from '../../../services/sprints';
import type { CreateSprintRequest, Sprint } from '../../../types/api';
import { invalidateSprintDependents } from '../lib/sprint-cache';

/** SPR-1: create a planned sprint. The server defaults the name if omitted. */
export function useCreateSprint(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation<Sprint, unknown, CreateSprintRequest>({
    mutationFn: async (input) => (await sprintsService.create(projectId, input)).sprint,
    onSuccess: () => invalidateSprintDependents(queryClient, projectId),
  });
}
