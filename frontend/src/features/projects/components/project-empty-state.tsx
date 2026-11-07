import { Button } from '../../../components/ui';
import { PROJECT_MESSAGES } from '../constants/projects.constants';
import { LayersIcon } from '../../../assets/icons';

interface ProjectEmptyStateProps {
  onCreate: () => void;
}

/** PRJ-1: the empty screen is an invitation, not a dead end. */
export function ProjectEmptyState({ onCreate }: ProjectEmptyStateProps) {
  return (
    <div className="dot-grid relative overflow-hidden rounded-lg border border-border bg-card px-6 py-12 text-center sm:px-10">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-card via-card/80 to-transparent"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-md">
        <span className="mx-auto grid size-11 place-items-center rounded-lg bg-secondary text-secondary-foreground">
          <LayersIcon width={20} height={20} />
        </span>
        <h2 className="mt-4 font-display text-xl font-semibold tracking-tight text-foreground">
          {PROJECT_MESSAGES.emptyTitle}
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          {PROJECT_MESSAGES.emptyDescription}
        </p>
        <Button type="button" className="mt-5" onClick={onCreate}>
          Create your first project
        </Button>
      </div>
    </div>
  );
}
