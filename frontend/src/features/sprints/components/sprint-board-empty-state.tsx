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
    <section className="dot-grid overflow-hidden rounded-2xl border border-border bg-card px-6 py-14 text-center shadow-sm">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-border bg-background text-muted-foreground shadow-sm">
        <BoardIcon width={24} height={24} />
      </span>

      <h2 className="mt-5 font-display text-xl font-semibold tracking-tight text-foreground">
        {SPRINT_MESSAGES.boardEmptyTitle}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {SPRINT_MESSAGES.boardEmptyDescription}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Link
          to={PROJECT_ROUTES.backlog(projectId)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground outline-none transition-colors hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <SprintIcon width={16} height={16} />
          {SPRINT_MESSAGES.boardGoToBacklog}
        </Link>
        <Link
          to={PROJECT_ROUTES.sprints(projectId)}
          className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          Sprint history
        </Link>
      </div>

      <p className="mt-5 text-xs text-muted-foreground">
        {plannedCount > 0
          ? `${plannedCount} planned ${plannedCount === 1 ? 'sprint is' : 'sprints are'} ready to start.`
          : 'No sprint is planned yet. Create one from the backlog to get started.'}
      </p>
    </section>
  );
}
