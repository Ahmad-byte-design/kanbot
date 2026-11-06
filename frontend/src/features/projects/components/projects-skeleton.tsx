/** Loading placeholders shaped like the real project card grid. */
export function ProjectsSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse">
      <div className="mt-8 grid grid-cols-3 divide-x divide-border overflow-hidden rounded-xl border border-border bg-card">
        {[0, 1, 2].map((cell) => (
          <div key={cell} className="px-4 py-3">
            <div className="h-2.5 w-16 rounded bg-muted" />
            <div className="mt-2 h-5 w-10 rounded bg-muted" />
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-baseline justify-between">
        <div className="h-3 w-24 rounded bg-muted" />
        <div className="h-2.5 w-28 rounded bg-muted" />
      </div>

      <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((card) => (
          <div
            key={card}
            className="flex h-56 flex-col overflow-hidden rounded-2xl border border-border bg-card"
          >
            <div className="h-1 bg-muted" />
            <div className="flex flex-1 flex-col p-5">
              <div className="flex items-center gap-3">
                <div className="size-11 shrink-0 rounded-xl bg-muted" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-2.5 w-10 rounded bg-muted" />
                  <div className="h-4 w-36 rounded bg-muted" />
                </div>
              </div>
              <div className="mt-4 h-3 w-full rounded bg-muted" />
              <div className="mt-2 h-3 w-4/5 rounded bg-muted" />
              <div className="mt-4 h-16 rounded-xl bg-muted/70" />
              <div className="mt-auto flex items-center justify-between pt-4">
                <div className="h-5 w-24 rounded-full bg-muted" />
                <div className="h-3 w-20 rounded bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Loading shell for a project workspace: dark sidebar rail + content blocks. */
export function ProjectWorkspaceSkeleton() {
  return (
    <div aria-hidden="true" className="min-h-svh animate-pulse bg-background lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
      <div className="bg-sidebar p-4">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="size-9 rounded-xl bg-white/10" />
          <div className="h-4 w-20 rounded bg-white/10" />
        </div>
        <div className="mt-6 h-14 rounded-xl bg-white/10" />
        <div className="mt-4 space-y-2">
          <div className="h-9 rounded-lg bg-white/10" />
          <div className="h-9 rounded-lg bg-white/5" />
        </div>
      </div>

      <div>
        <div className="border-b border-border bg-card px-5 py-5 sm:px-8">
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="mt-4 flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-muted" />
            <div className="space-y-2">
              <div className="h-6 w-48 rounded bg-muted" />
              <div className="h-3 w-64 rounded bg-muted" />
            </div>
          </div>
        </div>
        <div className="space-y-6 px-5 py-8 sm:px-8">
          <div className="grid gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((cell) => (
              <div key={cell} className="h-24 rounded-xl border border-border bg-card" />
            ))}
          </div>
          <div className="h-64 rounded-2xl border border-border bg-card" />
        </div>
      </div>
    </div>
  );
}
