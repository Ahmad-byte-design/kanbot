export function FullPageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="grid min-h-svh place-items-center bg-background px-6" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4 text-center">
        <img src="/kanbot-icon.svg" alt="" className="size-12 rounded-2xl shadow-lg shadow-primary/20" />
        <span
          className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent"
          aria-hidden="true"
        />
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
