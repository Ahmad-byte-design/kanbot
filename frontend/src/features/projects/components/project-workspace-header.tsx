import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowLeftIcon } from '../../../assets/icons';
import { PROJECT_ROUTES } from '../constants/projects.constants';
import { projectToneClass } from '../lib/project-tone';
import { projectIcon } from '../lib/status-meta';
import type { ProjectListItem } from '../types/projects.types';
import { ProjectMark } from './project-mark';
import { AssistantTrigger } from '../../ai/components/assistant-trigger';

interface ProjectWorkspaceHeaderProps {
  project: ProjectListItem;
  /** Extra actions rendered next to the "All projects" link. */
  actions?: ReactNode;
  /**
   * Show the active sprint chip. Off by default so pages that already list
   * sprints (the sprint archive, the board header) don't repeat the name.
   */
  showActiveSprint?: boolean;
}

/**
 * The compact workspace toolbar shared by backlog, board and sprint screens:
 * one dense row (back, project identity, actions) so the board keeps the page.
 */
export function ProjectWorkspaceHeader({
  project,
  actions,
  showActiveSprint = false,
}: ProjectWorkspaceHeaderProps) {
  return (
    <header
      className={[
        'sticky top-0 z-20 overflow-hidden border-b border-border/70 bg-card/75 backdrop-blur-xl',
        projectToneClass(project.id),
      ].join(' ')}
    >
      <div className="relative flex min-h-12 flex-wrap items-center gap-2 px-3 py-1.5 sm:px-5">
        <Link
          to={PROJECT_ROUTES.list}
          aria-label="All projects"
          title="All projects"
          className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeftIcon width={15} height={15} className="rtl:rotate-180" />
        </Link>

        <span className="h-5 w-px shrink-0 bg-border" aria-hidden="true" />

        <ProjectMark
          projectId={project.id}
          projectKey={project.key}
          icon={projectIcon(project)}
          size="sm"
        />

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <motion.h1
            layout
            className="truncate font-display text-sm font-semibold tracking-tight text-foreground"
            title={project.name}
          >
            {project.name}
          </motion.h1>
          <span className="hidden shrink-0 rounded bg-tone-soft px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.08em] text-tone sm:inline">
            {project.key}
          </span>
          {showActiveSprint && project.stats.activeSprint ? (
            <span className="hidden shrink-0 items-center gap-1 rounded bg-success/10 px-1.5 py-0.5 text-[10px] font-medium text-success md:inline-flex">
              <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
              {project.stats.activeSprint.name}
            </span>
          ) : null}
          {project.description ? (
            <span className="hidden truncate text-xs text-muted-foreground xl:inline">
              {project.description}
            </span>
          ) : null}
        </div>

        <div className="ms-auto flex shrink-0 items-center gap-1.5">
          <AssistantTrigger />
          {actions}
        </div>
      </div>
    </header>
  );
}
