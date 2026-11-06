import { Button } from '../../../components/ui';
import type { Sprint } from '../../../types/api';
import { SparklesIcon } from '../../../assets/icons';
import { AI_MESSAGES } from '../constants/ai.constants';
import { useSummarizeSprint } from '../hooks/use-summarize-sprint';
import { AiErrorAlert, AiSkeleton } from './ai-bits';
import { SummaryContent } from './summary-content';

interface SprintSummaryPanelProps {
  projectId: string;
  sprint: Sprint;
}

/**
 * AI-4 on the report page: show the saved summary when there is one, otherwise
 * offer to write it. Regenerating replaces the saved summary on the server.
 */
export function SprintSummaryPanel({ projectId, sprint }: SprintSummaryPanelProps) {
  const summarize = useSummarizeSprint(projectId);
  const generated =
    summarize.data && summarize.data.sprint.id === sprint.id
      ? summarize.data.summary
      : null;
  const summary = generated ?? sprint.summary;
  const pending = summarize.isPending;

  if (sprint.status === 'planned') return null;

  return (
    <section
      aria-label={AI_MESSAGES.summaryTitle}
      className="mt-3 overflow-hidden rounded-2xl border border-tone/30 bg-tone-soft/30 shadow-sm"
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-tone/20 px-5 py-3">
        <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-foreground">
          <SparklesIcon width={15} height={15} className="text-tone" />
          {AI_MESSAGES.summaryPanelTitle}
        </h3>
        {summary ? null : (
          <p className="text-[11px] text-muted-foreground">{AI_MESSAGES.summaryHint}</p>
        )}
      </header>

      <div className="px-5 py-4">
        {pending ? (
          <AiSkeleton label={AI_MESSAGES.summaryGenerating} />
        ) : summarize.error ? (
          <AiErrorAlert
            error={summarize.error}
            onRetry={() => summarize.mutate(sprint.id)}
            retrying={pending}
          />
        ) : summary ? (
          <SummaryContent
            summary={summary}
            regenerating={pending}
            onRegenerate={() => summarize.mutate(sprint.id)}
          />
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                Turn this sprint into a short report
              </p>
              <p className="mt-0.5 max-w-md text-xs leading-relaxed text-muted-foreground">
                {AI_MESSAGES.disclaimer}
              </p>
            </div>
            <Button type="button" size="sm" onClick={() => summarize.mutate(sprint.id)}>
              <SparklesIcon width={14} height={14} />
              {AI_MESSAGES.summaryGenerate}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
