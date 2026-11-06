import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsService } from '../../../services/projects';
import { projectKeys } from '../query-keys';
import type { CreateProjectInput, ProjectListItem } from '../types/projects.types';

/** PRJ-2: create a project, then refresh the list counters. */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation<ProjectListItem, unknown, CreateProjectInput>({
    mutationFn: async (input) => (await projectsService.create(input)).project,
    onSuccess: (project) => {
      queryClient.setQueryData(projectKeys.detail(project.id), project);
      return queryClient.invalidateQueries({ queryKey: projectKeys.list() });
    },
  });
}
