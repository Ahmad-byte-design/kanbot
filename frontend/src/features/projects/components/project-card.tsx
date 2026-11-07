import { Link } from 'react-router';
import { motion, useReducedMotion } from 'framer-motion';
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
 * PRJ-1: one project as a dense Trello-style tile. The whole card is the
 * backlog link; edit and delete sit above that overlay so they stay clickable.
 */
export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const { stats } = project;
  const reducedMotion = useReducedMotion();

  return (
    <motion.li
      layout
      whileHover={reducedMotion ? undefined : { y: -2 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className={[
        'group relative flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_1px_rgba(9,30,66,0.08)]',
        'transition-[box-shadow,border-color] duration-150 hover:border-tone/60 hover:shadow-[0_8px_24px_-14px_rgba(9,30,66,0.45)]',
        projectToneClass(project.id),
      ].join(' ')}
    >
      <span aria-hidden="true" className="h-1 shrink-0 bg-tone" />

      <Link
        to={PROJECT_ROUTES.backlog(project.id)}
        aria-label={`Open ${project.name} backlog`}
        className="absolute inset-0 z-0 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      />

      <div className="flex flex-1 flex-col p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <ProjectMark projectId={project.id} projectKey={project.key} size="sm" />
            <div className="min-w-0">
              <h3 className="truncate font-display text-[15px] font-semibold tracking-tight text-foreground">
                {project.name}
              </h3>
              <span className="mt-0.5 inline-flex text-[10px] font-semibold tracking-[0.1em] text-muted-foreground">
                {project.key}
              </span>
            </div>
          </div>

          <div className="relative z-10 flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <button
              type="button"
              onClick={() => onEdit(project)}
              aria-label={`Edit ${project.name}`}
              className="grid size-7 cursor-pointer place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <PencilIcon width={14} height={14} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(project)}
              aria-label={`Delete ${project.name}`}
              className="grid size-7 cursor-pointer place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring"
            >
              <TrashIcon width={14} height={14} />
            </button>
          </div>
        </div>

        <p className="mt-2.5 line-clamp-2 min-h-[2.3rem] text-xs leading-relaxed text-muted-foreground">
          {project.description || 'No description yet.'}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            Backlog <strong className="font-semibold tabular-nums text-foreground">{stats.backlogCount}</strong>
          </span>
          <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            Todos <strong className="font-semibold tabular-nums text-foreground">{stats.totalTodos}</strong>
          </span>
          {stats.activeSprint ? (
            <span className="inline-flex min-w-0 items-center gap-1 rounded bg-success/10 px-1.5 py-0.5 text-[10px] font-medium text-success">
              <span className="size-1.5 shrink-0 rounded-full bg-success" aria-hidden="true" />
              <span className="truncate">{stats.activeSprint.name}</span>
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground">No active sprint</span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-2.5">
          <span className="text-[10px] font-medium text-muted-foreground">
            {stats.totalTodos === 0 ? 'Empty board' : `${stats.totalTodos - stats.backlogCount} in sprints`}
          </span>
          <span aria-hidden="true" className="inline-flex items-center gap-1 text-[11px] font-semibold text-tone">
            Open
            <ArrowRightIcon width={12} height={12} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </motion.li>
  );
}
