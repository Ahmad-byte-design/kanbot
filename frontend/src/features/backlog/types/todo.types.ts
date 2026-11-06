import type {
  Todo,
  TodoListResponse,
  TodoPriority,
  TodoStatus,
  TodoType,
  UpdateTodoRequest,
} from '../../../types/api';

/** The values controlled by the todo details form. */
export interface TodoFormValues {
  title: string;
  description: string;
  type: TodoType;
  status: TodoStatus;
  priority: TodoPriority;
  /** '' = not estimated, otherwise "1" | "2" | "3" | "5" | "8" | "13". */
  storyPoints: string;
  /** Comma-separated, as typed by the user. */
  labels: string;
  /** '' = no due date, otherwise YYYY-MM-DD. */
  dueDate: string;
  /** '' = the backlog, otherwise a sprint id. */
  sprintId: string;
}

/** Client-side search and filters (BL-6). */
export interface TodoFilters {
  search: string;
  priority: TodoPriority | '';
  type: TodoType | '';
}

export type TodoList = Todo[];
export type BacklogResponse = TodoListResponse;

export interface UpdateTodoInput {
  todoId: string;
  changes: UpdateTodoRequest;
}

export interface MoveTodoInput {
  todoId: string;
  position: number;
}
