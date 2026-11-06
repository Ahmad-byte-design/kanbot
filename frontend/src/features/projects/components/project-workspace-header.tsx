import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ArrowLeftIcon } from '../../../assets/icons';
import { PROJECT_ROUTES } from '../constants/projects.constants';
import { projectToneClass } from '../lib/project-tone';
import type { ProjectListItem } from '../types/projects.types';
import { ProjectMark } from './project-mark';
import { AssistantTrigger } from '../../ai/components/assistant-trigger';

interface ProjectWorkspaceHeaderProps {
  project: ProjectListItem;
  /** Extra actions rendered next to the "All projects" link. */
  actions?: ReactNode;
}

/**
 * The workspace header shared by the backlog, board and sprint screens: back
 * link, project monogram, name/key and description, plus optional actions.
 */
export function ProjectWorkspaceHeader({ project, actions }: ProjectWorkspaceHeaderProps) {
  return (
    <header className={['border-b border-border bg-card/70', projectToneClass(project.id)].join(' ')}>
      <div className="px-5 py-5 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to={PROJECT_ROUTES.list}
            className="inline-flex items-center gap-1.5 rounded-md text-xs text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeftIcon width={14} height={14} />
            All projects
          </Link>

          <div className="flex items-center gap-2">
            <AssistantTrigger />
            {actions}
          </div>
        </div>

        <div className="mt-4 flex items-start gap-4">
          <ProjectMark projectId={project.id} projectKey={project.key} size="lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {project.name}
              </h1>
              <span className="rounded bg-tone-soft px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.08em] text-tone">
                {project.key}
              </span>
            </div>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {project.description || 'No description yet. Edit the project to add one.'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
