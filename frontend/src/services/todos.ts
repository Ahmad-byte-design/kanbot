import type {
  BulkCreateTodosRequest,
  BulkCreateTodosResponse,
  CreateTodoRequest,
  MoveTodoRequest,
  Todo,
  TodoListResponse,
  UpdateTodoRequest,
} from '../types/api';
import { request } from './client';

interface TodoResponse {
  todo: Todo;
}

export const todosService = {
  /** GET /projects/:id/todos?sprintId=backlog — ordered by `order`. */
  listBacklog(projectId: string): Promise<TodoListResponse> {
    return request<TodoListResponse>('GET', `/projects/${projectId}/todos?sprintId=backlog`);
  },

  /**
   * GET /projects/:id/todos — every todo in the project, ordered by sprint
   * then status/order. The backlog page groups it for the planned sections.
   */
  listProject(projectId: string): Promise<TodoListResponse> {
    return request<TodoListResponse>('GET', `/projects/${projectId}/todos`);
  },

  create(projectId: string, input: CreateTodoRequest): Promise<TodoResponse> {
    return request<TodoResponse>('POST', `/projects/${projectId}/todos`, input);
  },

  /** AI-2: save a reviewed batch of drafts in one request. */
  bulkCreate(
    projectId: string,
    input: BulkCreateTodosRequest,
  ): Promise<BulkCreateTodosResponse> {
    return request<BulkCreateTodosResponse>('POST', `/projects/${projectId}/todos/bulk`, input);
  },

  update(todoId: string, input: UpdateTodoRequest): Promise<TodoResponse> {
    return request<TodoResponse>('PATCH', `/todos/${todoId}`, input);
  },

  move(todoId: string, input: MoveTodoRequest): Promise<TodoResponse> {
    return request<TodoResponse>('POST', `/todos/${todoId}/move`, input);
  },

  remove(todoId: string): Promise<void> {
    return request<void>('DELETE', `/todos/${todoId}`);
  },
};
