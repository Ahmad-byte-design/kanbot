import { Link } from 'react-router';
import type { Sprint } from '../../../types/api';
import { Button } from '../../../components/ui';
import { PROJECT_ROUTES } from '../../projects';
import { CalendarIcon, SparklesIcon } from '../../../assets/icons';
import { AI_MESSAGES } from '../../ai/constants/ai.constants';
import { SPRINT_MESSAGES, SPRINT_PROGRESS_LABEL } from '../constants/sprints.constants';
import {
  daysRemainingLabel,
  formatSprintRange,
  progressPercent,
  sprintStats,
} from '../lib/sprint-meta';

interface SprintBoardHeaderProps {
  projectId: string;
  sprint: Sprint;
  onComplete: () => void;
  /** AI-4: open the sprint summary dialog for this sprint. */
  onSummarize: () => void;
}

/**
 * SPR-4: the active sprint's vital signs. The progress bar prefers story
 * points (the planning unit) and falls back to todo count when nothing is
 * estimated, so it never sits at a misleading 0%.
 */
export function SprintBoardHeader({ projectId, sprint, onComplete, onSummarize }: SprintBoardHeaderProps) {
  const stats = sprintStats(sprint);
  const percent = progressPercent(stats);
  const allDone = stats.totalTodos > 0 && stats.doneTodos === stats.totalTodos;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="h-1 bg-tone" aria-hidden="true" />

      <div className="flex flex-wrap items-start justify-between gap-4 px-5 pt-5 pb-4 sm:px-6">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.12em] text-tone uppercase">
            <span className="relative flex size-1.5" aria-hidden="true">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-tone opacity-60" />
              <span className="relative inline-flex size-1.5 rounded-full bg-tone" />
            </span>
            Active sprint
          </p>

          <h2 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-foreground">
            {sprint.name}
          </h2>

          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {sprint.goal || 'No goal written. Add one from the sprint history to keep the finish line explicit.'}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-muted-foreground">
              <CalendarIcon width={12} height={12} />
              {formatSprintRange(sprint.startDate, sprint.endDate)}
            </span>
            <span className="inline-flex items-center rounded-full bg-tone-soft px-2.5 py-1 font-medium text-tone">
              {daysRemainingLabel(sprint.endDate)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onSummarize}>
            <SparklesIcon width={14} height={14} />
            {AI_MESSAGES.summaryOnBoard}
          </Button>
          <Link
            to={PROJECT_ROUTES.sprint(projectId, sprint.id)}
            className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-transparent px-3 text-xs font-medium text-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            Sprint details
          </Link>
          <Button type="button" size="sm" onClick={onComplete}>
            {SPRINT_MESSAGES.complete}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 border-t border-border bg-muted/25 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-xs font-medium text-foreground">{SPRINT_PROGRESS_LABEL}</p>
            <p className="text-xs tabular-nums text-muted-foreground">
              <span className="font-semibold text-foreground">{stats.donePoints}</span>
              {' / '}
              {stats.totalPoints} pts
              <span className="mx-1.5 text-border">·</span>
              <span className="font-semibold text-foreground">{stats.doneTodos}</span>
              {' / '}
              {stats.totalTodos} todos
            </p>
          </div>

          <div
            role="progressbar"
            aria-label={SPRINT_PROGRESS_LABEL}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-valuetext={`${percent}% complete`}
            className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted ring-1 ring-inset ring-border"
          >
            <div
              className={[
                'h-full rounded-full transition-[width] duration-300 ease-out',
                allDone ? 'bg-status-done' : 'bg-tone',
              ].join(' ')}
              style={{ width: `${percent}%` }}
            />
          </div>

          <p className="mt-1.5 text-[11px] text-muted-foreground">
            {allDone ? SPRINT_MESSAGES.boardDone : `${percent}% complete`}
          </p>
        </div>

        <dl className="flex items-center gap-5 sm:justify-end">
          <div>
            <dt className="text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
              Done
            </dt>
            <dd className="font-display text-xl font-semibold tabular-nums text-foreground">
              {stats.doneTodos}
            </dd>
          </div>
          <div className="h-9 w-px bg-border" aria-hidden="true" />
          <div>
            <dt className="text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
              In flight
            </dt>
            <dd className="font-display text-xl font-semibold tabular-nums text-foreground">
              {stats.totalTodos - stats.doneTodos}
            </dd>
          </div>
          <div className="h-9 w-px bg-border" aria-hidden="true" />
          <div>
            <dt className="text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
              Progress
            </dt>
            <dd className="font-display text-xl font-semibold tabular-nums text-tone">
              {percent}%
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
