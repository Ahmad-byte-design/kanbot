import { useMutation } from '@tanstack/react-query';
import { aiService } from '../../../services/ai';
import type { PlanSprintRequest, PlanSprintResponse } from '../../../types/api';

/** AI-3: ask for a capacity-aware suggestion. Creating the sprint is separate. */
export function usePlanSprint(projectId: string) {
  return useMutation<PlanSprintResponse, unknown, PlanSprintRequest>({
    mutationFn: (input) => aiService.planSprint(projectId, input),
  });
}
