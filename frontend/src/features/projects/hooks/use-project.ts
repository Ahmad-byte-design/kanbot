import { useQuery } from '@tanstack/react-query';
import { ApiError } from '../../../services/client';
import { projectsService } from '../../../services/projects';
import { projectKeys } from '../query-keys';
import type { ProjectListItem } from '../types/projects.types';

/**
 * The project named by the URL. A 404 means the project is gone or belongs to
 * someone else, so retrying would only delay the "not found" screen.
 */
export function useProject(projectId: string | undefined) {
  return useQuery<ProjectListItem>({
    queryKey: projectKeys.detail(projectId ?? ''),
    queryFn: async () => (await projectsService.get(projectId as string)).project,
    enabled: Boolean(projectId),
    retry: (failureCount, error) =>
      !(error instanceof ApiError && error.status === 404) && failureCount < 1,
  });
}
