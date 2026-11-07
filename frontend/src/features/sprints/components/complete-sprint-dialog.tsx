import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Alert, Button, Modal, SelectField } from '../../../components/ui';
import { errorMessage } from '../../../services/client';
import type { Sprint } from '../../../types/api';
import { PROJECT_ROUTES } from '../../projects';
import { SPRINT_MESSAGES } from '../constants/sprints.constants';
import { useCompleteSprint } from '../hooks/use-complete-sprint';
import { SparklesIcon } from '../../../assets/icons';
import { AI_MESSAGES } from '../../ai/constants/ai.constants';
import { useSummarizeSprint } from '../../ai/hooks/use-summarize-sprint';

interface CompleteSprintDialogProps {
  projectId: string;
  sprint: Sprint;
  plannedSprints: Sprint[];
  onClose: () => void;
}

/** SPR-6: close the active sprint and choose where unfinished work goes. */
export function CompleteSprintDialog({
  projectId,
  sprint,
  plannedSprints,
  onClose,
}: CompleteSprintDialogProps) {
  const navigate = useNavigate();
  const completeSprint = useCompleteSprint(projectId);
  const summarizeSprint = useSummarizeSprint(projectId);

  const [destination, setDestination] = useState('backlog');
  const [withSummary, setWithSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pending = completeSprint.isPending;
  const done = sprint.stats.doneTodos;
  const notDone = sprint.stats.totalTodos - done;
  const hasUnfinished = notDone > 0;

  const options = [
    { value: 'backlog', label: 'Backlog (no sprint)' },
    ...plannedSprints.map((planned) => ({ value: planned.id, label: planned.name })),
  ];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      await completeSprint.mutateAsync({
        sprintId: sprint.id,
        moveUnfinishedTo: destination,
      });
    } catch (caught) {
      setError(errorMessage(caught));
      return;
    }

    if (withSummary) {
      // AI-4 runs after the sprint closes. The report page shows the saved
      // summary as soon as it lands; a failure there offers its own retry.
      void summarizeSprint.mutateAsync(sprint.id).catch(() => {});
    }

    onClose();
    navigate(PROJECT_ROUTES.sprint(projectId, sprint.id));
  }

  return (
    <Modal
      open
      onClose={pending ? () => {} : onClose}
      title={SPRINT_MESSAGES.completeTitle}
      description={`${sprint.name} — ${SPRINT_MESSAGES.completeDescription}`}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form="complete-sprint-form" loading={pending}>
            {SPRINT_MESSAGES.complete}
          </Button>
        </>
      }
    >
      <form
        id="complete-sprint-form"
        className="flex flex-col gap-5"
        onSubmit={handleSubmit}
        noValidate
      >
        {error ? <Alert variant="error" message={error} /> : null}

        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-status-done/30 bg-status-done-soft/50 px-4 py-3">
            <dt className="text-xs font-medium text-status-done">Done</dt>
            <dd className="mt-0.5 font-display text-xl font-semibold tabular-nums text-foreground">
              {done}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                {done === 1 ? 'todo' : 'todos'}
              </span>
            </dd>
          </div>
          <div className="rounded-xl border border-border bg-muted/50 px-4 py-3">
            <dt className="text-xs font-medium text-muted-foreground">Not done</dt>
            <dd className="mt-0.5 font-display text-xl font-semibold tabular-nums text-foreground">
              {notDone}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                {notDone === 1 ? 'todo' : 'todos'}
              </span>
            </dd>
          </div>
        </dl>

        <SelectField
          label="Where should unfinished todos go?"
          value={destination}
          onChange={setDestination}
          options={options}
          disabled={pending || !hasUnfinished}
          helperText={
            hasUnfinished
              ? 'Done todos stay in the completed sprint as history.'
              : SPRINT_MESSAGES.boardDone
          }
        />

        <label
          className={[
            'flex items-start gap-3 rounded-xl border border-border bg-muted/20 p-3',
            pending ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-muted/35',
          ].join(' ')}
        >
          <input
            type="checkbox"
            checked={withSummary}
            onChange={(event) => setWithSummary(event.target.checked)}
            disabled={pending}
            className="mt-0.5 size-4 accent-primary"
          />
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
              <SparklesIcon width={15} height={15} className="text-tone" />
              {AI_MESSAGES.completeSummaryLabel}
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
              {AI_MESSAGES.completeSummaryHint}
            </span>
          </span>
        </label>
      </form>
    </Modal>
  );
}
