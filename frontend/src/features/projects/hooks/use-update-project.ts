import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsService } from '../../../services/projects';
import { projectKeys } from '../query-keys';
import type { ProjectListItem, UpdateProjectInput } from '../types/projects.types';

/** PRJ-3: edit name, key or description without touching existing todo keys. */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation<ProjectListItem, unknown, UpdateProjectInput>({
    mutationFn: async ({ projectId, changes }) =>
      (await projectsService.update(projectId, changes)).project,
    onSuccess: (project) => {
      queryClient.setQueryData(projectKeys.detail(project.id), project);
      return queryClient.invalidateQueries({ queryKey: projectKeys.list() });
    },
  });
}
