import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sprintsService } from '../../../services/sprints';
import type { Sprint } from '../../../types/api';
import { invalidateSprintDependents } from '../lib/sprint-cache';
import type { UpdateSprintInput } from '../types/sprints.types';

/** SPR-2: edit a planned sprint's name, goal or dates. */
export function useUpdateSprint(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation<Sprint, unknown, UpdateSprintInput>({
    mutationFn: async ({ sprintId, changes }) =>
      (await sprintsService.update(sprintId, changes)).sprint,
    onSuccess: () => invalidateSprintDependents(queryClient, projectId),
  });
}
