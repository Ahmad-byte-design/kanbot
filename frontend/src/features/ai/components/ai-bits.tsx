import { Alert, Button } from '../../../components/ui';
import { SparklesIcon } from '../../../assets/icons';
import { errorMessage } from '../../../services/client';
import type { AiSource } from '../../../types/api';
import { AI_MESSAGES } from '../constants/ai.constants';
import { sourceLabel } from '../lib/ai-cache';
import { sourceTone } from '../lib/ai-meta';

/** "Mock AI" / "AI" chip, used wherever a response states its source. */
export function SourceBadge({ source }: { source: AiSource | null | undefined }) {
  if (!source) return null;

  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-[0.06em] uppercase',
        sourceTone(source),
      ].join(' ')}
    >
      <SparklesIcon width={11} height={11} />
      {sourceLabel(source)}
    </span>
  );
}

/** AI-5: the same short warning sits next to every action that can save. */
export function AiDisclaimer({ className }: { className?: string }) {
  return (
    <p
      className={[
        'flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground',
        className ?? '',
      ].join(' ')}
    >
      <SparklesIcon width={12} height={12} className="mt-0.5 shrink-0 text-tone" />
      {AI_MESSAGES.disclaimer}
    </p>
  );
}

/** Three shimmering lines, sized like Markdown text. */
export function AiSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" className="space-y-2">
      <span className="sr-only">{label}</span>
      <div className="h-3 w-11/12 animate-pulse rounded bg-muted" aria-hidden="true" />
      <div className="h-3 w-full animate-pulse rounded bg-muted" aria-hidden="true" />
      <div className="h-3 w-2/3 animate-pulse rounded bg-muted" aria-hidden="true" />
    </div>
  );
}

interface AiErrorAlertProps {
  error: unknown;
  onRetry: () => void;
  retrying?: boolean;
}

/** AI-5: surface the server message and offer the same action again. */
export function AiErrorAlert({ error, onRetry, retrying = false }: AiErrorAlertProps) {
  return (
    <div className="space-y-2">
      <Alert variant="error" message={errorMessage(error, AI_MESSAGES.incompleteTitle)} />
      <Button type="button" variant="outline" size="sm" onClick={onRetry} loading={retrying}>
        {AI_MESSAGES.tryAgain}
      </Button>
    </div>
  );
}
