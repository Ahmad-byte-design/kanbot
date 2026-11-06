import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsService } from '../../../services/projects';
import { projectKeys } from '../query-keys';

/**
 * PRJ-4: delete a project; the server cascades todos and sprints.
 *
 * The detail entry is deliberately left in the cache: removing it while the
 * workspace is still mounted makes React Query refetch the project that was
 * just deleted. The detail is stale immediately, so revisiting the URL refetches
 * and shows the not-found state.
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, string>({
    mutationFn: (projectId) => projectsService.remove(projectId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.list() }),
  });
}
