import type { QueryClient } from '@tanstack/react-query';
import type { AiSource, SprintSummaryResponse } from '../../../types/api';
import { projectKeys } from '../../projects/query-keys';
import { todoKeys } from '../../backlog/query-keys';
import { sprintKeys } from '../../sprints/query-keys';

/**
 * AI writes flow through the same caches as manual edits: bulk-created todos
 * belong in the backlog, and a generated summary updates the sprint that both
 * the board and the report read.
 */
export function invalidateCreatedTodos(queryClient: QueryClient, projectId: string) {
  void queryClient.invalidateQueries({ queryKey: todoKeys.backlog(projectId) });
  void queryClient.invalidateQueries({ queryKey: todoKeys.project(projectId) });
  void queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
  void queryClient.invalidateQueries({ queryKey: projectKeys.list() });
}

export function applySprintSummary(
  queryClient: QueryClient,
  projectId: string,
  response: SprintSummaryResponse,
) {
  const { sprint } = response;
  const boardKey = sprintKeys.board(projectId, sprint.id);

  // The board reads its sprint from the board response; update it in place so
  // the summary appears without a refetch flicker.
  queryClient.setQueryData(boardKey, (current: { sprint?: unknown } | undefined) =>
    current ? { ...current, sprint } : current,
  );

  void queryClient.invalidateQueries({ queryKey: sprintKeys.list(projectId) });
  void queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
  void queryClient.invalidateQueries({ queryKey: projectKeys.list() });
}

/** "5 Nov 2026, 14:05" in the user's locale, from an ISO timestamp. */
export function formatGeneratedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function sourceLabel(source: AiSource | null | undefined): string {
  return source === 'ai' ? 'AI' : 'Mock AI';
}
