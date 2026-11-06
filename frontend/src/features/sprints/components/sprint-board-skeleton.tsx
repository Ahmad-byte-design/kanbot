import { TODO_STATUS_OPTIONS } from '../../backlog/constants/backlog.constants';

/** Loading placeholders shaped like the sprint header and its four columns. */
export function SprintBoardSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse">
      <div className="h-44 rounded-2xl border border-border bg-card" />

      <div className="mt-4 grid grid-flow-col auto-cols-[minmax(16rem,1fr)] gap-3 overflow-x-auto pb-1 lg:grid-flow-row lg:auto-cols-auto lg:grid-cols-4 lg:overflow-visible">
        {TODO_STATUS_OPTIONS.map(({ value }) => (
          <div key={value} className="rounded-xl border border-border bg-card p-2">
            <div className="h-8 rounded-lg bg-muted" />
            <div className="mt-2 space-y-2">
              <div className="h-24 rounded-lg bg-muted/70" />
              <div className="h-20 rounded-lg bg-muted/50" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
