import { TODO_MESSAGES } from '../constants/backlog.constants';
import { BacklogIcon } from '../../../assets/icons';

interface BacklogSummaryProps {
  totalCount: number;
  totalPoints: number;
  visibleCount: number;
  visiblePoints: number;
  filtered: boolean;
}

/** The ledger's title block: what the backlog is, and how much of it is in view. */
export function BacklogSummary({
  totalCount,
  totalPoints,
  visibleCount,
  visiblePoints,
  filtered,
}: BacklogSummaryProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-border px-4 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
      <div className="flex min-w-0 gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-tone-soft text-tone">
          <BacklogIcon width={20} height={20} />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            {TODO_MESSAGES.heading}
          </p>
          <h2 className="mt-0.5 font-display text-lg font-semibold tracking-tight text-foreground">
            {TODO_MESSAGES.summaryTitle}
          </h2>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {TODO_MESSAGES.summaryDescription}
          </p>
        </div>
      </div>

      <dl className="flex shrink-0 gap-2">
        <div className="min-w-[5.25rem] rounded-lg border border-border bg-background px-3 py-2">
          <dt className="text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
            {filtered ? 'Showing' : 'Todos'}
          </dt>
          <dd className="mt-0.5 font-display text-xl font-semibold tabular-nums text-foreground" aria-live="polite">
            {visibleCount}
            {filtered ? (
              <span className="ml-1 text-xs font-normal text-muted-foreground">/ {totalCount}</span>
            ) : null}
          </dd>
        </div>
        <div className="min-w-[5.25rem] rounded-lg border border-border bg-background px-3 py-2">
          <dt className="text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
            {filtered ? 'Points in view' : 'Points'}
          </dt>
          <dd className="mt-0.5 font-display text-xl font-semibold tabular-nums text-foreground" aria-live="polite">
            {visiblePoints}
            {filtered && visiblePoints !== totalPoints ? (
              <span className="ml-1 text-xs font-normal text-muted-foreground">/ {totalPoints}</span>
            ) : null}
          </dd>
        </div>
      </dl>
    </header>
  );
}
