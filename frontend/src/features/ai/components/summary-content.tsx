import { Button } from '../../../components/ui';
import type { SprintSummary } from '../../../types/api';
import { RefreshIcon, SparklesIcon } from '../../../assets/icons';
import { AI_MESSAGES } from '../constants/ai.constants';
import { formatGeneratedAt } from '../lib/ai-cache';
import { Markdown } from './markdown';
import { AiDisclaimer, SourceBadge } from './ai-bits';

interface SummaryContentProps {
  summary: SprintSummary;
  regenerating: boolean;
  onRegenerate: () => void;
}

/** The rendered Markdown plus its provenance, shared by the dialog and report. */
export function SummaryContent({ summary, regenerating, onRegenerate }: SummaryContentProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SourceBadge source={summary.source} />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRegenerate}
          loading={regenerating}
        >
          <RefreshIcon width={13} height={13} />
          {AI_MESSAGES.summaryRegenerate}
        </Button>
      </div>

      <div className="rounded-xl border border-tone/25 bg-tone-soft/25 px-4 py-3.5">
        <Markdown content={summary.content} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground">
          {AI_MESSAGES.summaryGenerated(formatGeneratedAt(summary.generatedAt))} ·{' '}
          {AI_MESSAGES.summarySaved}
        </p>
        <AiDisclaimer />
      </div>
    </div>
  );
}

export function SummaryHeader() {
  return (
    <span className="flex items-center gap-2">
      <SparklesIcon width={15} height={15} className="text-tone" />
      {AI_MESSAGES.summaryTitle}
    </span>
  );
}
