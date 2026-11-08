import { useMutation, useQueryClient } from '@tanstack/react-query';
import { statusesService } from '../../../services/statuses';
import type {
  CreateProjectStatusRequest,
  ProjectWithStats,
  UpdateProjectStatusRequest,
} from '../../../types/api';
import { projectKeys } from '../query-keys';

/** Keeps the project detail, lists, sprints and backlog in step after a status change. */
function useSyncProject(projectId: string) {
  const queryClient = useQueryClient();

  return (project: ProjectWithStats) => {
    queryClient.setQueryData(projectKeys.detail(project.id), project);
    void queryClient.invalidateQueries({ queryKey: projectKeys.list() });
    void queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
    void queryClient.invalidateQueries({ queryKey: ['todos'] });
  };
}

export function useCreateStatus(projectId: string) {
  const sync = useSyncProject(projectId);

  return useMutation<
    ProjectWithStats,
    unknown,
    CreateProjectStatusRequest
  >({
    mutationFn: async (input) => (await statusesService.create(projectId, input)).project,
    onSuccess: sync,
  });
}

export function useUpdateStatus(projectId: string) {
  const sync = useSyncProject(projectId);

  return useMutation<
    ProjectWithStats,
    unknown,
    { statusId: string; changes: UpdateProjectStatusRequest }
  >({
    mutationFn: async ({ statusId, changes }) =>
      (await statusesService.update(projectId, statusId, changes)).project,
    onSuccess: sync,
  });
}

export function useDeleteStatus(projectId: string) {
  const sync = useSyncProject(projectId);

  return useMutation<ProjectWithStats, unknown, string>({
    mutationFn: async (statusId) => (await statusesService.remove(projectId, statusId)).project,
    onSuccess: sync,
  });
}
