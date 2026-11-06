import { useMutation } from '@tanstack/react-query';
import { aiService } from '../../../services/ai';
import type { GenerateTodosRequest, GenerateTodosResponse } from '../../../types/api';

/** AI-2: drafts only — nothing is persisted until the bulk save. */
export function useGenerateTodos(projectId: string) {
  return useMutation<GenerateTodosResponse, unknown, GenerateTodosRequest>({
    mutationFn: (input) => aiService.generateTodos(projectId, input),
  });
}
