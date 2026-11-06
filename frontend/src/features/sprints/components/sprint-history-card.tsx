import { Link } from 'react-router';
import type { Sprint } from '../../../types/api';
import { PROJECT_ROUTES } from '../../projects';
import { ArrowRightIcon, CalendarIcon } from '../../../assets/icons';
import {
  completionPercent,
  formatSprintRange,
  progressPercent,
  sprintStats,
} from '../lib/sprint-meta';
import { SprintStatusBadge } from './sprint-status-badge';

interface SprintHistoryCardProps {
  projectId: string;
  sprint: Sprint;
}

/** SPR-7: one row in the sprint archive, with its headline numbers. */
export function SprintHistoryCard({ projectId, sprint }: SprintHistoryCardProps) {
  const stats = sprintStats(sprint);
  const percent =
    sprint.status === 'completed' ? completionPercent(stats) : progressPercent(stats);
  const active = sprint.status === 'active';

  return (
    <Link
      to={PROJECT_ROUTES.sprint(projectId, sprint.id)}
      className={[
        'group grid gap-4 rounded-xl border bg-card p-4 shadow-sm outline-none transition-[border-color,box-shadow]',
        'hover:border-ring/40 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center',
        active ? 'border-tone/40 ring-1 ring-tone/15' : 'border-border',
      ].join(' ')}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-display text-base font-semibold tracking-tight text-foreground">
            {sprint.name}
          </span>
          <SprintStatusBadge status={sprint.status} withDot={active} />
          {active ? (
            <span className="rounded-full bg-tone-soft px-2 py-0.5 text-[10px] font-medium text-tone">
              On the board
            </span>
          ) : null}
        </div>

        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarIcon width={12} height={12} />
            {formatSprintRange(sprint.startDate, sprint.endDate)}
          </span>
          <span className="text-border" aria-hidden="true">
            ·
          </span>
          <span>
            {stats.totalTodos} {stats.totalTodos === 1 ? 'todo' : 'todos'}
          </span>
        </p>

        {sprint.goal ? (
          <p className="mt-2 line-clamp-1 text-xs leading-relaxed text-muted-foreground">
            {sprint.goal}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-5 sm:justify-end">
        <div className="w-36">
          <div className="flex items-baseline justify-between gap-2 text-[11px]">
            <span className="font-medium tabular-nums text-foreground">
              {stats.donePoints}/{stats.totalPoints} pts
            </span>
            <span className="tabular-nums text-muted-foreground">{percent}%</span>
          </div>
          <div
            role="progressbar"
            aria-label={`${sprint.name} points`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted ring-1 ring-inset ring-border"
          >
            <div
              className={[
                'h-full rounded-full',
                sprint.status === 'completed' ? 'bg-status-done' : 'bg-tone',
              ].join(' ')}
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-1 text-[10px] tabular-nums text-muted-foreground">
            {stats.doneTodos}/{stats.totalTodos} todos done
          </p>
        </div>

        <span className="grid size-8 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-colors group-hover:border-ring/40 group-hover:text-foreground">
          <ArrowRightIcon width={15} height={15} />
        </span>
      </div>
    </Link>
  );
}
