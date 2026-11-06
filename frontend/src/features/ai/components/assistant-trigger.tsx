import { Button } from '../../../components/ui';
import { SparklesIcon } from '../../../assets/icons';
import { AI_MESSAGES } from '../constants/ai.constants';
import { useAssistantStore } from '../store/assistant.store';

/**
 * AI-1: the "Ask AI" entry point in the workspace header. It only opens the
 * panel; the panel owns the conversation and the quick actions.
 */
export function AssistantTrigger() {
  const openPanel = useAssistantStore((state) => state.openPanel);

  return (
    <Button type="button" variant="outline" size="sm" onClick={openPanel}>
      <SparklesIcon width={14} height={14} />
      {AI_MESSAGES.trigger}
    </Button>
  );
}
