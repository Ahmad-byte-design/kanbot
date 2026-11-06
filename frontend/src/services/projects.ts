import type {
  CreateProjectRequest,
  ProjectWithStats,
  UpdateProjectRequest,
} from '../types/api';
import { request } from './client';

/** Response wrapper for GET /projects and POST /projects. */
interface ProjectListResponse {
  projects: ProjectWithStats[];
}

interface ProjectResponse {
  project: ProjectWithStats;
}

export const projectsService = {
  list(): Promise<ProjectListResponse> {
    return request<ProjectListResponse>('GET', '/projects');
  },

  get(projectId: string): Promise<ProjectResponse> {
    return request<ProjectResponse>('GET', `/projects/${projectId}`);
  },

  create(input: CreateProjectRequest): Promise<ProjectResponse> {
    return request<ProjectResponse>('POST', '/projects', input);
  },

  update(projectId: string, input: UpdateProjectRequest): Promise<ProjectResponse> {
    return request<ProjectResponse>('PATCH', `/projects/${projectId}`, input);
  },

  remove(projectId: string): Promise<void> {
    return request<void>('DELETE', `/projects/${projectId}`);
  },
};
