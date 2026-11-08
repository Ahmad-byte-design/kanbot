export { PROJECT_LIMITS, PROJECT_MESSAGES, PROJECT_ROUTES, PROJECT_ROUTE_PATTERNS } from './constants/projects.constants';
export { projectKeys } from './query-keys';

export { ProjectIndexPage } from './pages/project-index-page';
export { ProjectsPage } from './pages/projects-page';
export { ProjectStatusesPage } from './pages/project-statuses-page';

export { DeleteProjectDialog } from './components/delete-project-dialog';
export { ProjectGlyph } from './components/project-glyph';
export { ProjectCard } from './components/project-card';
export { ProjectEmptyState } from './components/project-empty-state';
export { ProjectErrorState } from './components/project-error-state';
export { ProjectFormDialog } from './components/project-form-dialog';
export { ProjectMark } from './components/project-mark';
export { ProjectShell } from './components/project-shell';
export { ProjectStats } from './components/project-stats';
export { ProjectSwitcher } from './components/project-switcher';
export { ProjectWorkspaceHeader } from './components/project-workspace-header';
export { ProjectsSkeleton, ProjectWorkspaceSkeleton } from './components/projects-skeleton';

export { useBackgroundUrl, useBackgrounds } from './hooks/use-backgrounds';
export { useCreateProject } from './hooks/use-create-project';
export { useDeleteProject } from './hooks/use-delete-project';
export { useProject } from './hooks/use-project';
export { useProjectStatuses } from './context/project-statuses-context';
export { useCreateStatus, useDeleteStatus, useUpdateStatus } from './hooks/use-project-statuses';
export { useProjects } from './hooks/use-projects';
export { useUpdateProject } from './hooks/use-update-project';

export { createProjectSchema, projectKeySchema, updateProjectSchema } from './schema/project.schema';
export { projectTone, projectToneClass, suggestProjectKey } from './lib/project-tone';
export {
  LEGACY_STATUS_LABELS,
  PROJECT_ICON_GLYPHS,
  STATUS_COLORS,
  STATUS_DOT_CLASS,
  STATUS_SOFT_CLASS,
  STATUS_SWATCH_CLASS,
  normalizeProjectStatuses,
  projectBackground,
  projectIcon,
  statusById,
  statusDotClass,
  statusLabel,
  statusOptions,
  statusSoftClass,
} from './lib/status-meta';

export type {
  CreateProjectInput,
  ProjectFormMode,
  ProjectFormValues,
  ProjectListItem,
  UpdateProjectInput,
} from './types/projects.types';
