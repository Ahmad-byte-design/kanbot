import { useQuery } from '@tanstack/react-query';
import { todosService } from '../../../services/todos';
import { todoKeys } from '../../backlog/query-keys';

/**
 * All todos of a project. The backlog page groups them client-side for the
 * planned sprint sections instead of issuing one request per sprint.
 */
export function useProjectTodos(projectId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: todoKeys.project(projectId ?? ''),
    queryFn: async () => (await todosService.listProject(projectId as string)).todos,
    enabled: Boolean(projectId) && enabled,
  });
}
