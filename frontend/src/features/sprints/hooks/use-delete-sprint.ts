import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sprintsService } from '../../../services/sprints';
import { invalidateSprintAndBacklog } from '../lib/sprint-cache';

/** SPR-2: deleting a planned sprint sends its todos back to the backlog. */
export function useDeleteSprint(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, string>({
    mutationFn: (sprintId) => sprintsService.remove(sprintId),
    onSuccess: () => invalidateSprintAndBacklog(queryClient, projectId),
  });
}
