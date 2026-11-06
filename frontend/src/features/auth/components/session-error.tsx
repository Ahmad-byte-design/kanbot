interface SessionErrorProps {
  message: string;
  onRetry: () => void;
  onSignOut: () => void;
}

export function SessionError({ message, onRetry, onSignOut }: SessionErrorProps) {
  return (
    <main className="auth-canvas grid min-h-svh place-items-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <img src="/kanbot-icon.svg" alt="" className="mx-auto size-12 rounded-2xl shadow-lg shadow-primary/20" />
        <h1 className="mt-6 font-display text-2xl font-semibold tracking-tight text-foreground">
          We couldn&apos;t reach your workspace
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{message}</p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            onClick={onRetry}
          >
            Try again
          </button>
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            onClick={onSignOut}
          >
            Sign out instead
          </button>
        </div>
      </div>
    </main>
  );
}
