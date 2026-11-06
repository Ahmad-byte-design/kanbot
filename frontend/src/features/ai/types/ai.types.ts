import type {
  AiSource,
  ChatMessage,
  DraftTodo,
  PlanSprintResponse,
} from '../../../types/api';

/** A draft row in AI-2: the server shape plus local review state. */
export interface DraftTodoRow extends DraftTodo {
  id: string;
  checked: boolean;
}

/** A message in the assistant drawer; keeps the source for the badge. */
export interface ChatEntry extends ChatMessage {
  id: string;
  source?: AiSource;
}

/** AI-3's reviewed plan, kept in component state until the user creates it. */
export interface SprintPlanDraft extends PlanSprintResponse {
  selectedIds: string[];
  goal: string;
}

export type AssistantDialog = 'generate-todos' | 'plan-sprint' | 'summarize' | null;

export interface GenerateTodosFormValues {
  prompt: string;
  count: string;
}

export interface PlanSprintFormValues {
  capacity: string;
  focus: string;
}
