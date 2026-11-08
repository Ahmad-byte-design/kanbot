import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { motion } from 'framer-motion';
import { Button } from '../../../components/ui';
import { ApiError, errorMessage } from '../../../services/client';
import {
  PROJECT_ROUTES,
  ProjectErrorState,
  ProjectShell,
  ProjectWorkspaceHeader,
  ProjectWorkspaceSkeleton,
  normalizeProjectStatuses,
  projectToneClass,
  useProject,
} from '../../projects';
import {
  PointsBadge,
  PriorityTag,
  StatusTag,
  TypeTag,
} from '../../backlog/components/todo-tags';
import { ArrowLeftIcon, CalendarIcon } from '../../../assets/icons';
import { SprintSummaryPanel } from '../../ai/components/sprint-summary-panel';
import { SPRINT_MESSAGES } from '../constants/sprints.constants';
import { useSprintBoard } from '../hooks/use-sprint-board';
import { useSprints } from '../hooks/use-sprints';
import {
  completionPercent,
  daysRemainingLabel,
  flattenColumns,
  formatSprintDate,
  formatSprintRange,
  plannedSprints,
  sortSprintTodos,
  sprintStats,
} from '../lib/sprint-meta';
import { CompleteSprintDialog } from '../components/complete-sprint-dialog';
import { SprintStatusBadge } from '../components/sprint-status-badge';

/** A compact stat tile; the value line stays legible at every breakpoint. */
function DetailStat({
  label,
  value,
  hint,
  tone = false,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-3.5 py-3">
      <p className="text-[10px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
        {label}
      </p>
      <p
        className={[
          'mt-0.5 font-display text-xl font-semibold tabular-nums',
          tone ? 'text-tone' : 'text-foreground',
        ].join(' ')}
      >
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/**
 * SPR-7: one sprint's report. Completed sprints read their saved snapshot;
 * active and planned sprints read live numbers. The todo list and the optional
 * AI summary come from the same board response, so a refresh is one request.
 */
export function SprintDetailPage() {
  const { projectId, sprintId } = useParams<{ projectId: string; sprintId: string }>();
  const { data: project, isPending, error, refetch } = useProject(projectId);
  const board = useSprintBoard(projectId, sprintId);
  const sprints = useSprints(projectId);
  const [completeOpen, setCompleteOpen] = useState(false);

  if (isPending) return <ProjectWorkspaceSkeleton />;

  if (!project) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <ProjectErrorState
        notFound={notFound}
        message={errorMessage(error, 'The project could not be loaded.')}
        onRetry={() => void refetch()}
      />
    );
  }

  const sprintNotFound =
    board.error instanceof ApiError && board.error.status === 404;

  const sprint = board.data?.sprint;
  const stats = sprint ? sprintStats(sprint) : null;
  const completion = stats ? completionPercent(stats) : 0;
  const carriedOver = sprint?.completedStats
    ? String(sprint.completedStats.carriedOver)
    : '—';
  const statusIds = normalizeProjectStatuses(project).map((status) => status.id);
  const todos = board.data
    ? sortSprintTodos(flattenColumns(board.data.columns, statusIds), statusIds)
    : [];

  return (
    <ProjectShell project={project}>
      <div className={projectToneClass(project.id)}>
        <ProjectWorkspaceHeader project={project} />

        <motion.main
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="px-3 py-4 sm:px-5"
      >
          <Link
            to={PROJECT_ROUTES.sprints(project.id)}
            className="inline-flex items-center gap-1.5 rounded-md text-xs text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeftIcon width={14} height={14} className="rtl:rotate-180" />
            {SPRINT_MESSAGES.detailBack}
          </Link>

          {board.isPending ? (
            <div className="mt-4 space-y-3" aria-hidden="true">
              <div className="h-32 animate-pulse rounded-lg border border-border bg-card" />
              <div className="h-20 animate-pulse rounded-lg border border-border bg-card" />
              <div className="h-40 animate-pulse rounded-lg border border-border bg-card" />
            </div>
          ) : sprintNotFound || (!sprint && !board.error) ? (
            <div className="mt-4 rounded-lg border border-border bg-card px-6 py-8 text-center">
              <h2 className="font-display text-lg font-semibold text-foreground">
                {SPRINT_MESSAGES.detailNotFound}
              </h2>
              <p className="mx-auto mt-1.5 max-w-sm text-[13px] text-muted-foreground">
                It may have been deleted, or it belongs to a different project.
              </p>
              <Link
                to={PROJECT_ROUTES.sprints(project.id)}
                className="mt-4 inline-flex h-9 items-center justify-center rounded-md bg-primary px-3.5 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                {SPRINT_MESSAGES.detailBack}
              </Link>
            </div>
          ) : board.error || !sprint || !stats ? (
            <div className="mt-4 rounded-lg border border-border bg-card px-6 py-8 text-center">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Could not load this sprint
              </h2>
              <p className="mx-auto mt-1.5 max-w-sm text-[13px] text-muted-foreground">
                {errorMessage(board.error, 'The sprint could not be loaded.')}
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-5"
                onClick={() => void board.refetch()}
              >
                Try again
              </Button>
            </div>
          ) : (
            <>
              <section className="mt-4 overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_1px_rgba(9,30,66,0.08)]">
                <div className="h-1 bg-tone" aria-hidden="true" />
                <div className="flex flex-wrap items-start justify-between gap-3 px-3.5 pt-3 pb-2.5 sm:px-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
                        {sprint.name}
                      </h2>
                      <SprintStatusBadge status={sprint.status} withDot />
                    </div>

                    <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
                      {sprint.goal || 'No goal was written for this sprint.'}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="inline-flex items-center gap-1 rounded border border-border bg-background px-2 py-0.5 text-muted-foreground">
                        <CalendarIcon width={12} height={12} />
                        {formatSprintRange(sprint.startDate, sprint.endDate)}
                      </span>
                      {sprint.status === 'active' ? (
                        <span className="rounded bg-tone-soft px-2 py-0.5 font-medium text-tone">
                          {daysRemainingLabel(sprint.endDate)}
                        </span>
                      ) : null}
                      {sprint.status === 'completed' && sprint.completedAt ? (
                        <span className="rounded bg-muted px-2 py-0.5 text-muted-foreground">
                          Completed {formatSprintDate(sprint.completedAt.slice(0, 10))}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {sprint.status === 'active' ? (
                      <>
                        <Link
                          to={PROJECT_ROUTES.board(project.id)}
                          className="inline-flex h-8 items-center justify-center rounded-md border border-border px-3 text-xs font-medium text-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          Open board
                        </Link>
                        <Button type="button" size="sm" onClick={() => setCompleteOpen(true)}>
                          {SPRINT_MESSAGES.complete}
                        </Button>
                      </>
                    ) : null}
                    {sprint.status === 'planned' ? (
                      <Link
                        to={PROJECT_ROUTES.backlog(project.id)}
                        className="inline-flex h-8 items-center justify-center rounded-md border border-border px-3 text-xs font-medium text-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        Plan in the backlog
                      </Link>
                    ) : null}
                  </div>
                </div>
              </section>

              <dl className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <DetailStat
                  label="Completed todos"
                  value={`${stats.doneTodos} / ${stats.totalTodos}`}
                  hint={`${stats.totalTodos - stats.doneTodos} still open`}
                />
                <DetailStat
                  label="Points done"
                  value={`${stats.donePoints} / ${stats.totalPoints}`}
                  hint={stats.totalPoints > 0 ? 'Story points delivered' : 'Nothing estimated'}
                />
                <DetailStat
                  label="Carried over"
                  value={carriedOver}
                  hint={
                    sprint.completedStats
                      ? 'Unfinished at completion'
                      : 'Recorded when the sprint completes'
                  }
                />
                <DetailStat
                  label="Completion"
                  value={`${completion}%`}
                  hint={`${stats.doneTodos} of ${stats.totalTodos} todos`}
                  tone
                />
              </dl>

              <section
                aria-label="Sprint todos"
                className="mt-3 overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_1px_rgba(9,30,66,0.08)]"
              >
                <header className="flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-3.5 py-2 sm:px-4">
                  <h3 className="font-display text-sm font-semibold text-foreground">Todos</h3>
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    {stats.totalTodos} {stats.totalTodos === 1 ? 'todo' : 'todos'} · {stats.totalPoints} pts
                  </span>
                </header>

                {todos.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <p className="text-sm font-medium text-foreground">
                      {SPRINT_MESSAGES.sprintEmptyTodos}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {SPRINT_MESSAGES.sprintEmptyTodosHint}
                    </p>
                  </div>
                ) : (
                  <ul aria-label="Sprint todos" className="divide-y divide-border">
                    {todos.map((todo) => (
                      <li
                        key={todo.id}
                        className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3.5 py-2 sm:px-4"
                      >
                        <span className="w-16 shrink-0 font-mono text-[11px] font-semibold tracking-[0.04em] text-muted-foreground">
                          {todo.key}
                        </span>
                        <span
                          className={[
                            'min-w-0 flex-1 truncate text-[13px]',
                            todo.status === 'done'
                              ? 'text-muted-foreground line-through'
                              : 'text-foreground',
                          ].join(' ')}
                        >
                          {todo.title}
                        </span>
                        <span className="flex shrink-0 items-center gap-1.5">
                          <StatusTag status={todo.status} />
                          <TypeTag type={todo.type} />
                          <PriorityTag priority={todo.priority} />
                          <PointsBadge points={todo.storyPoints} />
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <SprintSummaryPanel projectId={project.id} sprint={sprint} />
            </>
          )}
        </motion.main>
      </div>

      {completeOpen && sprint && sprint.status === 'active' ? (
        <CompleteSprintDialog
          projectId={project.id}
          sprint={sprint}
          plannedSprints={plannedSprints(sprints.data ?? [])}
          onClose={() => setCompleteOpen(false)}
        />
      ) : null}
    </ProjectShell>
  );
}
