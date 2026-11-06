import { Link } from 'react-router';
import type { ProjectListItem } from '../types/projects.types';
import { projectToneClass } from '../lib/project-tone';
import { PROJECT_ROUTES } from '../constants/projects.constants';
import { ArrowRightIcon, PencilIcon, TrashIcon } from '../../../assets/icons';
import { ProjectMark } from './project-mark';

interface ProjectCardProps {
  project: ProjectListItem;
  onEdit: (project: ProjectListItem) => void;
  onDelete: (project: ProjectListItem) => void;
}

/**
 * PRJ-1: one project as a grid card. The whole card is the backlog link; edit
 * and delete sit above that overlay so they stay independently clickable.
 */
export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const { stats } = project;

  return (
    <li
      className={[
        'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm',
        'transition-[box-shadow,border-color] duration-200 hover:border-tone hover:shadow-lg',
        projectToneClass(project.id),
      ].join(' ')}
    >
      <span aria-hidden="true" className="h-1 shrink-0 bg-tone" />

      <Link
        to={PROJECT_ROUTES.backlog(project.id)}
        aria-label={`Open ${project.name} backlog`}
        className="absolute inset-0 z-0 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      />

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <ProjectMark projectId={project.id} projectKey={project.key} />
            <div className="min-w-0">
              <span className="inline-flex rounded bg-tone-soft px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.1em] text-tone">
                {project.key}
              </span>
              <h3 className="mt-1.5 truncate font-display text-lg font-semibold tracking-tight text-foreground">
                {project.name}
              </h3>
            </div>
          </div>

          <div className="relative z-10 flex shrink-0 items-center gap-0.5 opacity-70 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <button
              type="button"
              onClick={() => onEdit(project)}
              aria-label={`Edit ${project.name}`}
              className="grid size-8 place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <PencilIcon width={15} height={15} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(project)}
              aria-label={`Delete ${project.name}`}
              className="grid size-8 place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring"
            >
              <TrashIcon width={15} height={15} />
            </button>
          </div>
        </div>

        <p className="mt-4 line-clamp-2 min-h-[2.6rem] text-sm leading-relaxed text-muted-foreground">
          {project.description || 'No description yet.'}
        </p>

        <dl className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-border bg-background/70 p-3">
          <div>
            <dt className="text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
              Backlog
            </dt>
            <dd className="mt-0.5 font-display text-xl font-semibold tabular-nums text-foreground">
              {stats.backlogCount}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
              Todos
            </dt>
            <dd className="mt-0.5 font-display text-xl font-semibold tabular-nums text-foreground">
              {stats.totalTodos}
            </dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          {stats.activeSprint ? (
            <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
              <span className="size-1.5 shrink-0 rounded-full bg-success" aria-hidden="true" />
              <span className="truncate">{stats.activeSprint.name}</span>
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">No active sprint</span>
          )}

          <span
            aria-hidden="true"
            className="inline-flex items-center gap-1 text-xs font-semibold text-tone"
          >
            Open backlog
            <ArrowRightIcon
              width={14}
              height={14}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </span>
        </div>
      </div>
    </li>
  );
}
