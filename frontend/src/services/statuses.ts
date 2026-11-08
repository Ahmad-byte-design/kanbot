import type {
  CreateProjectStatusRequest,
  ProjectWithStats,
  UpdateProjectStatusRequest,
} from '../types/api';
import { request } from './client';

interface ProjectResponse {
  project: ProjectWithStats;
}

/** Status (board column) CRUD, scoped to one project. */
export const statusesService = {
  create(projectId: string, input: CreateProjectStatusRequest): Promise<ProjectResponse> {
    return request<ProjectResponse>('POST', `/projects/${projectId}/statuses`, input);
  },

  update(
    projectId: string,
    statusId: string,
    input: UpdateProjectStatusRequest,
  ): Promise<ProjectResponse> {
    return request<ProjectResponse>('PATCH', `/projects/${projectId}/statuses/${statusId}`, input);
  },

  remove(projectId: string, statusId: string): Promise<ProjectResponse> {
    return request<ProjectResponse>('DELETE', `/projects/${projectId}/statuses/${statusId}`);
  },
};
