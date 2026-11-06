import { Link } from 'react-router';
import { PROJECT_ROUTES } from '../features/projects';

export function NotFoundPage() {
  return (
    <main className="auth-canvas grid min-h-svh place-items-center px-6">
      <div className="max-w-md text-center">
        <img src="/kanbot-icon.svg" alt="" className="mx-auto size-12 rounded-2xl shadow-lg shadow-primary/20" />
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-primary">404</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground">
          This card is not on the board
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          The page you are looking for does not exist or has moved. Head back to your workspace.
        </p>
        <Link
          to={PROJECT_ROUTES.list}
          className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Back to workspace
        </Link>
      </div>
    </main>
  );
}
