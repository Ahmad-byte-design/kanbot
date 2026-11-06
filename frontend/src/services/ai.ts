import type {
  AiStatusResponse,
  ChatRequest,
  ChatResponse,
  GenerateTodosRequest,
  GenerateTodosResponse,
  PlanSprintRequest,
  PlanSprintResponse,
  SprintSummaryResponse,
} from '../types/api';
import { request } from './client';

/**
 * Every AI endpoint. The server is stateless for chat: send the whole
 * conversation on each call. Sprint summaries are the one thing it persists.
 */
export const aiService = {
  status(): Promise<AiStatusResponse> {
    return request<AiStatusResponse>('GET', '/ai/status');
  },

  chat(projectId: string, input: ChatRequest): Promise<ChatResponse> {
    return request<ChatResponse>('POST', `/projects/${projectId}/ai/chat`, input);
  },

  generateTodos(
    projectId: string,
    input: GenerateTodosRequest,
  ): Promise<GenerateTodosResponse> {
    return request<GenerateTodosResponse>(
      'POST',
      `/projects/${projectId}/ai/generate-todos`,
      input,
    );
  },

  planSprint(projectId: string, input: PlanSprintRequest): Promise<PlanSprintResponse> {
    return request<PlanSprintResponse>('POST', `/projects/${projectId}/ai/plan-sprint`, input);
  },

  /** Works for active and completed sprints; the response is saved on the sprint. */
  summarizeSprint(sprintId: string): Promise<SprintSummaryResponse> {
    return request<SprintSummaryResponse>('POST', `/sprints/${sprintId}/ai/summary`);
  },
};
