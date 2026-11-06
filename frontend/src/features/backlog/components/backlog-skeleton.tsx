/** Loading placeholder shaped like the kanban board's four status columns. */
export function BacklogSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse border-t border-border bg-muted/25 p-3 sm:p-4">
      <div className="grid grid-flow-col auto-cols-[minmax(16rem,1fr)] gap-3 overflow-hidden lg:grid-flow-row lg:auto-cols-auto lg:grid-cols-4">
        {[0, 1, 2, 3].map((column) => (
          <div
            key={column}
            className="flex min-h-[13rem] flex-col overflow-hidden rounded-xl border border-border bg-background/70"
          >
            <div className="h-0.5 bg-muted" />
            <div className="flex items-center justify-between border-b border-border/80 bg-card/50 px-3 py-3">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-muted" />
                <div className="h-2.5 w-16 rounded bg-muted" />
                <div className="h-4 w-5 rounded-full bg-muted" />
              </div>
              <div className="h-2.5 w-8 rounded bg-muted" />
            </div>
            <div className="flex flex-1 flex-col gap-2 p-2">
              {Array.from({ length: column === 0 ? 3 : column === 1 ? 2 : 1 }).map((_, card) => (
                <div key={card} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5">
                      <div className="h-3 w-10 rounded bg-muted" />
                      <div className="h-3 w-9 rounded bg-muted" />
                    </div>
                    <div className="size-5 rounded bg-muted" />
                  </div>
                  <div className="mt-2.5 h-4 w-4/5 rounded bg-muted" />
                  <div className="mt-2 h-3 w-3/5 rounded bg-muted" />
                  <div className="mt-3 flex items-center justify-between">
                    <div className="h-3 w-16 rounded bg-muted" />
                    <div className="size-5 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
