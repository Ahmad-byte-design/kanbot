import { useState } from 'react';
import { Button, Modal, SelectField } from '../../../components/ui';
import { AI_MESSAGES } from '../constants/ai.constants';
import { useSprints } from '../../sprints/hooks/use-sprints';
import { useSummarizeSprint } from '../hooks/use-summarize-sprint';
import { AiErrorAlert, AiSkeleton } from './ai-bits';
import { SummaryContent, SummaryHeader } from './summary-content';

interface SummarizeSprintDialogProps {
  projectId: string;
  initialSprintId?: string;
  onClose: () => void;
}

/**
 * AI-4: summarize a running or finished sprint. The server saves the result,
 * so an existing summary is shown first and only a regenerate calls the model.
 */
export function SummarizeSprintDialog({
  projectId,
  initialSprintId,
  onClose,
}: SummarizeSprintDialogProps) {
  const sprints = useSprints(projectId);
  const candidates = (sprints.data ?? []).filter((sprint) => sprint.status !== 'planned');
  const fallback =
    candidates.find((sprint) => sprint.id === initialSprintId) ??
    candidates.find((sprint) => sprint.status === 'active') ??
    candidates[0];

  const [selectedId, setSelectedId] = useState(initialSprintId ?? '');
  const summarize = useSummarizeSprint(projectId);

  const selected = candidates.find((sprint) => sprint.id === selectedId) ?? fallback;
  const generated =
    summarize.data && selected && summarize.data.sprint.id === selected.id
      ? summarize.data.summary
      : null;
  const summary = generated ?? selected?.summary ?? null;
  const pending = summarize.isPending;

  function selectSprint(id: string) {
    setSelectedId(id);
    summarize.reset();
  }

  return (
    <Modal
      open
      onClose={pending ? () => {} : onClose}
      title={AI_MESSAGES.summaryTitle}
      description={AI_MESSAGES.summaryDescription}
      size="lg"
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          {selected ? (
            <Button
              type="button"
              onClick={() => summarize.mutate(selected.id)}
              loading={pending}
            >
              {summary ? AI_MESSAGES.summaryRegenerate : AI_MESSAGES.summaryGenerate}
            </Button>
          ) : null}
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <SummaryHeader />
        </div>

        {sprints.isPending ? (
          <div className="rounded-xl border border-border bg-muted/25 p-4">
            <AiSkeleton label="Loading sprints" />
          </div>
        ) : sprints.error ? (
          <AiErrorAlert error={sprints.error} onRetry={() => void sprints.refetch()} />
        ) : candidates.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            {AI_MESSAGES.summaryEmpty}
          </p>
        ) : (
          <>
            <SelectField
              label={AI_MESSAGES.summarySprintLabel}
              value={selected?.id ?? ''}
              onChange={selectSprint}
              options={candidates.map((sprint) => ({
                value: sprint.id,
                label: `${sprint.name} · ${sprint.status}`,
              }))}
              disabled={pending}
              data-autofocus
            />

            {pending ? (
              <div className="rounded-xl border border-border bg-muted/25 p-4">
                <AiSkeleton label={AI_MESSAGES.summaryGenerating} />
              </div>
            ) : summarize.error ? (
              <AiErrorAlert
                error={summarize.error}
                onRetry={() => selected && summarize.mutate(selected.id)}
                retrying={pending}
              />
            ) : summary ? (
              <SummaryContent
                summary={summary}
                regenerating={pending}
                onRegenerate={() => selected && summarize.mutate(selected.id)}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center">
                <p className="text-sm font-medium text-foreground">
                  No summary for {selected?.name ?? 'this sprint'} yet
                </p>
                <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
                  {AI_MESSAGES.summaryHint}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
