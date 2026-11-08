/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { ProjectStatus } from '../../../types/api';
import { normalizeProjectStatuses } from '../lib/status-meta';
import type { ProjectListItem } from '../types/projects.types';

const ProjectStatusesContext = createContext<ProjectStatus[]>(normalizeProjectStatuses(null));

/**
 * Shares one project's status list with every nested screen (backlog board,
 * todo form, card menus, sprint board) without prop-drilling it everywhere.
 */
export function ProjectStatusesProvider({
  project,
  children,
}: {
  project: ProjectListItem;
  children: ReactNode;
}) {
  const statuses = useMemo(() => normalizeProjectStatuses(project), [project]);

  return (
    <ProjectStatusesContext.Provider value={statuses}>{children}</ProjectStatusesContext.Provider>
  );
}

export function useProjectStatuses(): ProjectStatus[] {
  return useContext(ProjectStatusesContext);
}
