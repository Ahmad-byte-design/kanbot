import { useState } from 'react';
import { Button } from '../../../components/ui';
import type { Sprint, Todo } from '../../../types/api';
import { PlusIcon } from '../../../assets/icons';
import { SPRINT_MESSAGES } from '../constants/sprints.constants';
import { plannedSprints } from '../lib/sprint-meta';
import { DeleteSprintDialog } from './delete-sprint-dialog';
import { PlannedSprintSection } from './planned-sprint-section';
import { SprintFormDialog } from './sprint-form-dialog';
import { StartSprintDialog } from './start-sprint-dialog';

interface PlannedSprintsProps {
  projectId: string;
  sprints: Sprint[];
  sprintsPending: boolean;
  sprintsError: boolean;
  onRetrySprints: () => void;
  /** Name of the running sprint, if any; blocks starting a second one. */
  activeSprintName?: string;
  todosBySprint: Map<string, Todo[]>;
  todosPending: boolean;
  todosError: boolean;
  onOpenTodo: (todo: Todo) => void;
}

type DialogState =
  | { kind: 'create' }
  | { kind: 'edit'; sprint: Sprint }
  | { kind: 'delete'; sprint: Sprint }
  | { kind: 'start'; sprint: Sprint }
  | null;

/**
 * SPR-1 / SPR-2 / SPR-3: the planned sprint shelf above the backlog.
 *
 * All planned sprints share one `GET /projects/:id/todos` request; the page
 * groups those todos by `sprintId` and hands each section its own slice. The
 * dialogs are mounted on demand so they always start from fresh values.
 */
export function PlannedSprints({
  projectId,
  sprints,
  sprintsPending,
  sprintsError,
  onRetrySprints,
  activeSprintName,
  todosBySprint,
  todosPending,
  todosError,
  onOpenTodo,
}: PlannedSprintsProps) {
  const [dialog, setDialog] = useState<DialogState>(null);
  const planned = plannedSprints(sprints);

  function closeDialog() {
    setDialog(null);
  }

  return (
    <section aria-label={SPRINT_MESSAGES.plannedTitle} className="mt-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
            {SPRINT_MESSAGES.plannedTitle}
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
            {SPRINT_MESSAGES.plannedDescription}
          </p>
        </div>

        <Button type="button" size="sm" variant="outline" onClick={() => setDialog({ kind: 'create' })}>
          <PlusIcon width={15} height={15} />
          {SPRINT_MESSAGES.create}
        </Button>
      </div>

      {sprintsError ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">Could not load the planned sprints.</p>
          <Button type="button" size="sm" variant="outline" onClick={onRetrySprints}>
            Try again
          </Button>
        </div>
      ) : sprintsPending ? (
        <div className="mt-3 space-y-2" aria-hidden="true">
          <div className="h-16 animate-pulse rounded-xl border border-border bg-card" />
          <div className="h-16 animate-pulse rounded-xl border border-border bg-card" />
        </div>
      ) : planned.length === 0 ? (
        <div className="mt-3 rounded-xl border border-dashed border-border bg-card/60 px-5 py-5">
          <p className="text-sm font-medium text-foreground">{SPRINT_MESSAGES.plannedEmptyTitle}</p>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">
            {SPRINT_MESSAGES.plannedEmptyDescription}
          </p>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {planned.map((sprint) => (
            <PlannedSprintSection
              key={sprint.id}
              sprint={sprint}
              todos={todosBySprint.get(sprint.id) ?? []}
              todosPending={todosPending}
              todosError={todosError}
              activeSprintName={activeSprintName}
              onOpenTodo={onOpenTodo}
              onEdit={(item) => setDialog({ kind: 'edit', sprint: item })}
              onDelete={(item) => setDialog({ kind: 'delete', sprint: item })}
              onStart={(item) => setDialog({ kind: 'start', sprint: item })}
            />
          ))}
        </div>
      )}

      {dialog?.kind === 'create' ? (
        <SprintFormDialog
          mode="create"
          projectId={projectId}
          sprints={sprints}
          onClose={closeDialog}
        />
      ) : null}

      {dialog?.kind === 'edit' ? (
        <SprintFormDialog
          mode="edit"
          projectId={projectId}
          sprints={sprints}
          sprint={dialog.sprint}
          onClose={closeDialog}
        />
      ) : null}

      {dialog?.kind === 'delete' ? (
        <DeleteSprintDialog
          projectId={projectId}
          sprint={dialog.sprint}
          onClose={closeDialog}
        />
      ) : null}

      {dialog?.kind === 'start' ? (
        <StartSprintDialog
          projectId={projectId}
          sprint={dialog.sprint}
          onClose={closeDialog}
        />
      ) : null}
    </section>
  );
}
