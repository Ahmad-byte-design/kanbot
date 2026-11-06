import { useQuery } from '@tanstack/react-query';
import { todosService } from '../../../services/todos';
import { todoKeys } from '../query-keys';
import type { TodoList } from '../types/todo.types';

/** BL-1: the project backlog, already ordered by the server. */
export function useBacklog(projectId: string | undefined) {
  return useQuery<TodoList>({
    queryKey: todoKeys.backlog(projectId ?? ''),
    queryFn: async () => (await todosService.listBacklog(projectId as string)).todos,
    enabled: Boolean(projectId),
  });
}
