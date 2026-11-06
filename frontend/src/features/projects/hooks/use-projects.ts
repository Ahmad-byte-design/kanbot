import { useQuery } from '@tanstack/react-query';
import { projectsService } from '../../../services/projects';
import { projectKeys } from '../query-keys';
import type { ProjectListItem } from '../types/projects.types';

/** PRJ-1 + PRJ-5: the full project list, newest activity first (server order). */
export function useProjects() {
  return useQuery<ProjectListItem[]>({
    queryKey: projectKeys.list(),
    queryFn: async () => (await projectsService.list()).projects,
  });
}
