import type { Todo, TodoStatus } from '../../../types/api';

/** The values controlled by the create/edit sprint dialog. */
export interface SprintFormValues {
  name: string;
  goal: string;
  /** '' = no date, otherwise YYYY-MM-DD. */
  startDate: string;
  /** '' = no date, otherwise YYYY-MM-DD. */
  endDate: string;
}

export type SprintFormMode = 'create' | 'edit';

export interface UpdateSprintInput {
  sprintId: string;
  changes: {
    name?: string;
    goal?: string;
    startDate?: string | null;
    endDate?: string | null;
  };
}

export interface StartSprintInput {
  sprintId: string;
  changes: {
    startDate?: string;
    endDate?: string;
  };
}

export interface CompleteSprintInput {
  sprintId: string;
  moveUnfinishedTo: string;
}

export interface MoveBoardTodoInput {
  todoId: string;
  status: TodoStatus;
  position: number;
}

export type SprintColumns = Record<TodoStatus, Todo[]>;
