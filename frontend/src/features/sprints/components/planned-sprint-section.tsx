import { useId, useState } from 'react';
import type { Sprint, Todo } from '../../../types/api';
import {
  ChevronDownIcon,
  PencilIcon,
  SprintIcon,
  TrashIcon,
} from '../../../assets/icons';
import {
  PointsBadge,
  PriorityTag,
  StatusTag,
  TypeTag,
} from '../../backlog/components/todo-tags';
import { SPRINT_MESSAGES } from '../constants/sprints.constants';
import { formatSprintRange, sortSprintTodos, sprintStats } from '../lib/sprint-meta';
import { SprintStatusBadge } from './sprint-status-badge';

interface PlannedSprintSectionProps {
  sprint: Sprint;
  todos: Todo[];
  todosPending: boolean;
  todosError: boolean;
  /** Name of the currently running sprint, if any; blocks starting another. */
  activeSprintName?: string;
  onOpenTodo: (todo: Todo) => void;
  onEdit: (sprint: Sprint) => void;
  onDelete: (sprint: Sprint) => void;
  onStart: (sprint: Sprint) => void;
}

/**
 * SPR-1 / SPR-2 / SPR-3: one collapsible planned sprint above the backlog.
 * The header keeps the count and point total visible while collapsed, and the
 * body lists its todos without leaving the backlog page.
 */
export function PlannedSprintSection({
  sprint,
  todos,
  todosPending,
  todosError,
  activeSprintName,
  onOpenTodo,
  onEdit,
  onDelete,
  onStart,
}: PlannedSprintSectionProps) {
  const [open, setOpen] = useState(true);
  const bodyId = useId();
  const stats = sprintStats(sprint);
  const orderedTodos = sortSprintTodos(todos);
  const startBlocked = Boolean(activeSprintName);

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-stretch gap-1 border-b border-border bg-muted/20 pr-2">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={bodyId}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-sm px-3 py-3 text-left outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-4"
        >
          <ChevronDownIcon
            width={16}
            height={16}
            className={[
              'shrink-0 text-muted-foreground transition-transform duration-200',
              open ? '' : '-rotate-90',
            ].join(' ')}
          />
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="truncate font-display text-sm font-semibold text-foreground">
                {sprint.name}
              </span>
              <SprintStatusBadge status="planned" />
            </span>
            <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
              {formatSprintRange(sprint.startDate, sprint.endDate)}
              {sprint.goal ? ` · ${sprint.goal}` : ''}
            </span>
          </span>
          <span className="hidden shrink-0 items-center gap-2 text-[11px] font-medium text-muted-foreground sm:flex">
            <span className="rounded-full bg-background px-2 py-0.5 ring-1 ring-border">
              {stats.totalTodos} {stats.totalTodos === 1 ? 'todo' : 'todos'}
            </span>
            <span className="rounded-full bg-background px-2 py-0.5 tabular-nums ring-1 ring-border">
              {stats.totalPoints} pts
            </span>
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-1 py-1.5">
          <button
            type="button"
            onClick={() => onStart(sprint)}
            disabled={startBlocked}
            title={startBlocked ? SPRINT_MESSAGES.startBlocked(activeSprintName as string) : undefined}
            className={[
              'inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium outline-none transition-colors',
              startBlocked
                ? 'cursor-not-allowed text-muted-foreground/50'
                : 'text-primary hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring',
            ].join(' ')}
          >
            <SprintIcon width={13} height={13} />
            <span className="hidden sm:inline">{SPRINT_MESSAGES.start}</span>
          </button>

          <button
            type="button"
            onClick={() => onEdit(sprint)}
            aria-label={`Edit ${sprint.name}`}
            title="Edit sprint"
            className="grid size-8 place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <PencilIcon width={15} height={15} />
          </button>

          <button
            type="button"
            onClick={() => onDelete(sprint)}
            aria-label={`Delete ${sprint.name}`}
            title="Delete sprint"
            className="grid size-8 place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring"
          >
            <TrashIcon width={15} height={15} />
          </button>
        </div>
      </div>

      {open ? (
        <div id={bodyId}>
          {startBlocked ? (
            <p className="border-b border-border bg-muted/30 px-4 py-2 text-[11px] text-muted-foreground">
              {SPRINT_MESSAGES.startBlocked(activeSprintName as string)}
            </p>
          ) : null}

          {todosError ? (
            <p className="px-4 py-5 text-center text-xs text-muted-foreground">
              Could not load this sprint&apos;s todos.
            </p>
          ) : todosPending ? (
            <div className="space-y-2 p-3" aria-hidden="true">
              <div className="h-9 animate-pulse rounded-lg bg-muted" />
              <div className="h-9 animate-pulse rounded-lg bg-muted" />
            </div>
          ) : orderedTodos.length === 0 ? (
            <p className="px-4 py-5 text-center text-xs text-muted-foreground">
              {SPRINT_MESSAGES.sprintEmptyTodos} — {SPRINT_MESSAGES.sprintEmptyTodosHint}
            </p>
          ) : (
            <ul aria-label={`${sprint.name} todos`} className="divide-y divide-border">
              {orderedTodos.map((todo) => (
                <li key={todo.id}>
                  <button
                    type="button"
                    onClick={() => onOpenTodo(todo)}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-4"
                  >
                    <span className="w-14 shrink-0 font-mono text-[11px] font-semibold tracking-[0.04em] text-muted-foreground">
                      {todo.key}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                      {todo.title}
                    </span>
                    <span className="hidden shrink-0 items-center gap-1.5 sm:flex">
                      <StatusTag status={todo.status} />
                      <TypeTag type={todo.type} />
                      <PriorityTag priority={todo.priority} />
                    </span>
                    <PointsBadge points={todo.storyPoints} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </article>
  );
}
