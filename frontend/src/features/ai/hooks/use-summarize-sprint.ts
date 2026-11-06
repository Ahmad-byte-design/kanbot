import { useMutation, useQueryClient } from '@tanstack/react-query';
import { aiService } from '../../../services/ai';
import type { SprintSummaryResponse } from '../../../types/api';
import { applySprintSummary } from '../lib/ai-cache';

/** AI-4: generate and persist a sprint's Markdown summary. */
export function useSummarizeSprint(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation<SprintSummaryResponse, unknown, string>({
    mutationFn: (sprintId) => aiService.summarizeSprint(sprintId),
    onSuccess: (response) => applySprintSummary(queryClient, projectId, response),
  });
}
