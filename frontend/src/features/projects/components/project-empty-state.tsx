import { Button } from '../../../components/ui';
import { PROJECT_MESSAGES } from '../constants/projects.constants';
import { LayersIcon } from '../../../assets/icons';

interface ProjectEmptyStateProps {
  onCreate: () => void;
}

/** PRJ-1: the empty screen is an invitation, not a dead end. */
export function ProjectEmptyState({ onCreate }: ProjectEmptyStateProps) {
  return (
    <div className="dot-grid relative overflow-hidden rounded-2xl border border-border bg-card px-6 py-16 text-center sm:px-10">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-card via-card/80 to-transparent"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-md">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
          <LayersIcon width={24} height={24} />
        </span>
        <h2 className="mt-6 font-display text-2xl font-semibold tracking-tight text-foreground">
          {PROJECT_MESSAGES.emptyTitle}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {PROJECT_MESSAGES.emptyDescription}
        </p>
        <Button type="button" size="lg" className="mt-7" onClick={onCreate}>
          Create your first project
        </Button>
      </div>
    </div>
  );
}
