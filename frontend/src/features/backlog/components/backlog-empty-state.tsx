import { Button } from '../../../components/ui';
import { TODO_MESSAGES } from '../constants/backlog.constants';
import { BacklogIcon, SearchIcon, SparklesIcon } from '../../../assets/icons';

interface BacklogEmptyStateProps {
  filtered: boolean;
  onCreate: () => void;
  onClearFilters: () => void;
  /** AI-2: opens the generate-todos dialog from the empty backlog. */
  onGenerate: () => void;
}

/** BL-1/BL-6 empty states, with the AI-2 entry point on a truly empty backlog. */
export function BacklogEmptyState({
  filtered,
  onCreate,
  onClearFilters,
  onGenerate,
}: BacklogEmptyStateProps) {
  return (
    <div className="dot-grid px-5 py-10 text-center sm:px-8">
      <div className="mx-auto flex max-w-md flex-col items-center">
        <span className="grid size-10 place-items-center rounded-lg bg-secondary text-secondary-foreground">
          {filtered ? <SearchIcon width={19} height={19} /> : <BacklogIcon width={19} height={19} />}
        </span>

        <h3 className="mt-4 font-display text-lg font-semibold tracking-tight text-foreground">
          {filtered ? TODO_MESSAGES.filteredEmptyTitle : TODO_MESSAGES.emptyTitle}
        </h3>
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
          {filtered ? TODO_MESSAGES.filteredEmptyDescription : TODO_MESSAGES.emptyDescription}
        </p>

        <div className="mt-5 flex flex-col items-center gap-2 sm:flex-row">
          {filtered ? (
            <Button type="button" onClick={onClearFilters}>
              Clear filters
            </Button>
          ) : (
            <Button type="button" onClick={onCreate}>
              Create a todo
            </Button>
          )}

          {filtered ? null : (
            <Button type="button" variant="outline" onClick={onGenerate}>
              <SparklesIcon width={14} height={14} />
              Generate with AI
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
