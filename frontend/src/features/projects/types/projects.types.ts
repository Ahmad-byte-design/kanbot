import type {
  CreateProjectRequest,
  ProjectIcon,
  ProjectWithStats,
} from '../../../types/api';

/** A project as returned by the list/detail endpoints (counters included). */
export type ProjectListItem = ProjectWithStats;

/** The values controlled by the create/edit dialog. */
export interface ProjectFormValues {
  name: string;
  key: string;
  description: string;
  background: string | null;
  icon: ProjectIcon;
}

export type ProjectFormMode = 'create' | 'edit';

/** Payload accepted by the create mutation. */
export type CreateProjectInput = CreateProjectRequest;

/** Payload accepted by the update mutation. */
export interface UpdateProjectInput {
  projectId: string;
  changes: {
    name?: string;
    key?: string;
    description?: string;
    background?: string | null;
    icon?: ProjectIcon;
  };
}
