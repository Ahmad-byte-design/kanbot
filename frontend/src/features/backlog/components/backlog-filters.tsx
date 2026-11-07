import { SelectField } from '../../../components/ui';
import {
  TODO_MESSAGES,
  TODO_PRIORITY_OPTIONS,
  TODO_TYPE_OPTIONS,
} from '../constants/backlog.constants';
import { hasActiveFilters } from '../lib/todo-meta';
import type { TodoFilters } from '../types/todo.types';
import { CloseIcon, InfoIcon, SearchIcon } from '../../../assets/icons';

interface BacklogFiltersProps {
  filters: TodoFilters;
  onChange: (patch: Partial<TodoFilters>) => void;
  onClear: () => void;
  resultCount: number;
  totalCount: number;
}

const PRIORITY_FILTER_OPTIONS = [
  { value: '', label: 'All priorities' },
  ...TODO_PRIORITY_OPTIONS,
];

const TYPE_FILTER_OPTIONS = [{ value: '', label: 'All types' }, ...TODO_TYPE_OPTIONS];

/** BL-6: instant client-side search across key, title, description and labels. */
export function BacklogFilters({
  filters,
  onChange,
  onClear,
  resultCount,
  totalCount,
}: BacklogFiltersProps) {
  const active = hasActiveFilters(filters);

  return (
    <div className="border-b border-border">
      <div className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:px-4">
        <div className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-muted-foreground">
            <SearchIcon width={15} height={15} />
          </span>
          <input
            type="search"
            value={filters.search}
            onChange={(event) => onChange({ search: event.target.value })}
            onKeyDown={(event) => {
              if (event.key === 'Escape' && filters.search) {
                event.preventDefault();
                onChange({ search: '' });
              }
            }}
            placeholder="Search key, title, description or label…"
            aria-label="Search backlog"
            className="h-9 w-full rounded-md border border-input bg-background pr-8 pl-8 text-[13px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 [&::-webkit-search-cancel-button]:appearance-none"
          />
          {filters.search ? (
            <button
              type="button"
              onClick={() => onChange({ search: '' })}
              aria-label="Clear search"
              className="absolute inset-y-0 right-2 my-auto grid size-6 place-items-center rounded text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <CloseIcon width={13} height={13} />
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <SelectField
            aria-label="Filter by priority"
            value={filters.priority}
            onChange={(value) => onChange({ priority: value as TodoFilters['priority'] })}
            options={PRIORITY_FILTER_OPTIONS}
            className="w-[9.5rem]"
          />
          <SelectField
            aria-label="Filter by type"
            value={filters.type}
            onChange={(value) => onChange({ type: value as TodoFilters['type'] })}
            options={TYPE_FILTER_OPTIONS}
            className="w-[8.5rem]"
          />
          {active ? (
            <button
              type="button"
              onClick={onClear}
              className="h-9 shrink-0 rounded-md px-2.5 text-xs font-medium text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      {active ? (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border bg-muted/40 px-3 py-1.5 text-[11px] text-muted-foreground sm:px-4">
          <InfoIcon width={13} height={13} className="shrink-0" />
          <span>{TODO_MESSAGES.dragDisabled}</span>
          <span className="ml-auto tabular-nums" aria-live="polite">
            Showing {resultCount} of {totalCount}
          </span>
        </div>
      ) : null}
    </div>
  );
}
