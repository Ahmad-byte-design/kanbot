import { Link } from 'react-router';
import { Button } from '../../../components/ui';
import { ArrowLeftIcon } from '../../../assets/icons';
import { PROJECT_ROUTES } from '../constants/projects.constants';

interface ProjectErrorStateProps {
  notFound: boolean;
  message: string;
  onRetry: () => void;
}

/**
 * Shared failure screen for every project route. A 404 means the project is
 * gone (or belongs to another account), so there is nothing to retry; every
 * other failure offers another attempt and a way back to the project list.
 */
export function ProjectErrorState({ notFound, message, onRetry }: ProjectErrorStateProps) {
  return (
    <main className="grid min-h-svh place-items-center bg-background px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8">
        <p className="text-sm font-medium text-muted-foreground">
          {notFound ? 'Project not found' : 'Could not open this project'}
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-foreground">
          {notFound ? 'This project is no longer here' : 'Something got in the way'}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {notFound
            ? 'It may have been deleted, or it belongs to a different account. Head back to your projects to pick another one.'
            : message}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {notFound ? null : (
            <Button type="button" variant="outline" onClick={onRetry}>
              Try again
            </Button>
          )}
          <Link
            to={PROJECT_ROUTES.list}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <ArrowLeftIcon width={16} height={16} />
            Back to projects
          </Link>
        </div>
      </div>
    </main>
  );
}
