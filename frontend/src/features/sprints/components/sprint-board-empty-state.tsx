import { Link } from 'react-router';
import { PROJECT_ROUTES } from '../../projects';
import { BoardIcon, SprintIcon } from '../../../assets/icons';
import { SPRINT_MESSAGES } from '../constants/sprints.constants';

interface SprintBoardEmptyStateProps {
  projectId: string;
  plannedCount: number;
}

/**
 * SPR-4: without a running sprint the board is not an error — it is the pause
 * between sprints. Point people at the backlog, and at the history if there is
 * already something to read.
 */
export function SprintBoardEmptyState({ projectId, plannedCount }: SprintBoardEmptyStateProps) {
  return (
    <section className="dot-grid overflow-hidden rounded-lg border border-border bg-card px-6 py-10 text-center shadow-[0_1px_1px_rgba(9,30,66,0.08)]">
      <span className="mx-auto grid size-11 place-items-center rounded-lg border border-border bg-background text-muted-foreground">
        <BoardIcon width={20} height={20} />
      </span>

      <h2 className="mt-4 font-display text-lg font-semibold tracking-tight text-foreground">
        {SPRINT_MESSAGES.boardEmptyTitle}
      </h2>
      <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-relaxed text-muted-foreground">
        {SPRINT_MESSAGES.boardEmptyDescription}
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <Link
          to={PROJECT_ROUTES.backlog(projectId)}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3.5 text-[13px] font-medium text-primary-foreground outline-none transition-colors hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <SprintIcon width={15} height={15} />
          {SPRINT_MESSAGES.boardGoToBacklog}
        </Link>
        <Link
          to={PROJECT_ROUTES.sprints(projectId)}
          className="inline-flex h-9 items-center justify-center rounded-md border border-border px-3.5 text-[13px] font-medium text-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          Sprint history
        </Link>
      </div>

      <p className="mt-4 text-[11px] text-muted-foreground">
        {plannedCount > 0
          ? `${plannedCount} planned ${plannedCount === 1 ? 'sprint is' : 'sprints are'} ready to start.`
          : 'No sprint is planned yet. Create one from the backlog to get started.'}
      </p>
    </section>
  );
}
