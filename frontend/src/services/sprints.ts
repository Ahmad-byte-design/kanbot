import type {
  CompleteSprintRequest,
  CreateSprintRequest,
  Sprint,
  SprintBoardResponse,
  SprintListResponse,
  StartSprintRequest,
  UpdateSprintRequest,
} from '../types/api';
import { request } from './client';

interface SprintResponse {
  sprint: Sprint;
}

export const sprintsService = {
  /** Active first, then planned, then completed. */
  list(projectId: string): Promise<SprintListResponse> {
    return request<SprintListResponse>('GET', `/projects/${projectId}/sprints`);
  },

  get(sprintId: string): Promise<SprintResponse> {
    return request<SprintResponse>('GET', `/sprints/${sprintId}`);
  },

  /** The sprint plus its todos grouped into the four status columns. */
  board(sprintId: string): Promise<SprintBoardResponse> {
    return request<SprintBoardResponse>('GET', `/sprints/${sprintId}/todos`);
  },

  create(projectId: string, input: CreateSprintRequest): Promise<SprintResponse> {
    return request<SprintResponse>('POST', `/projects/${projectId}/sprints`, input);
  },

  update(sprintId: string, input: UpdateSprintRequest): Promise<SprintResponse> {
    return request<SprintResponse>('PATCH', `/sprints/${sprintId}`, input);
  },

  remove(sprintId: string): Promise<void> {
    return request<void>('DELETE', `/sprints/${sprintId}`);
  },

  start(sprintId: string, input: StartSprintRequest): Promise<SprintResponse> {
    return request<SprintResponse>('POST', `/sprints/${sprintId}/start`, input);
  },

  complete(sprintId: string, input: CompleteSprintRequest): Promise<SprintResponse> {
    return request<SprintResponse>('POST', `/sprints/${sprintId}/complete`, input);
  },
};
