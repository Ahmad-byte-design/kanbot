import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { Button, Drawer } from '../../../components/ui';
import { RefreshIcon, SendIcon, SparklesIcon } from '../../../assets/icons';
import type { ChatMessage } from '../../../types/api';
import { AI_LIMITS, AI_MESSAGES } from '../constants/ai.constants';
import { useAiStatus } from '../hooks/use-ai-status';
import { useAiChat } from '../hooks/use-ai-chat';
import { useAssistantStore } from '../store/assistant.store';
import type { ChatEntry } from '../types/ai.types';
import { AiDisclaimer, AiErrorAlert, SourceBadge } from './ai-bits';
import { Markdown } from './markdown';

interface AssistantPanelProps {
  projectId: string;
}

/** One quick action tile in the empty state. */
function QuickAction({
  icon,
  label,
  hint,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-start gap-2.5 rounded-lg border border-border bg-background px-3 py-2 text-left outline-none transition-colors hover:border-tone/40 hover:bg-tone-soft/20 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-tone-soft text-tone transition-colors group-hover:bg-tone group-hover:text-primary-foreground">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-medium text-foreground">{label}</span>
        <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">
          {hint}
        </span>
      </span>
    </button>
  );
}

/**
 * AI-1: the assistant drawer. The conversation lives in the store, so closing
 * the panel keeps it; switching projects (or New chat) starts over. Every send
 * posts the whole conversation because the chat endpoint is stateless.
 */
export function AssistantPanel({ projectId }: AssistantPanelProps) {
  const open = useAssistantStore((state) => state.open);
  const closePanel = useAssistantStore((state) => state.closePanel);
  const messages = useAssistantStore((state) => state.messages);
  const appendMessage = useAssistantStore((state) => state.appendMessage);
  const clearMessages = useAssistantStore((state) => state.clearMessages);
  const openDialog = useAssistantStore((state) => state.openDialog);

  const status = useAiStatus(open);
  const chat = useAiChat(projectId);

  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const pending = chat.isPending;
  const canSend = draft.trim().length > 0 && !pending;
  const lastMessage = messages[messages.length - 1];

  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView?.({ block: 'end' });
  }, [open, messages.length, pending]);

  function sendConversation(conversation: ChatEntry[]) {
    const payload: ChatMessage[] = conversation
      .slice(-AI_LIMITS.chatMessagesMax)
      .map(({ role, content }) => ({ role, content }));

    chat.mutate(payload, {
      onSuccess: (response) => {
        appendMessage({
          role: 'assistant',
          content: response.message.content,
          source: response.source,
        });
      },
    });
  }

  function handleSubmit(event?: FormEvent) {
    event?.preventDefault();
    const content = draft.trim();
    if (!content || pending) return;

    chat.reset();
    const userEntry: ChatEntry = {
      id: 'pending-user',
      role: 'user',
      content,
    };

    // Append to the store first so the message stays visible if the call fails.
    appendMessage({ role: 'user', content });
    setDraft('');
    sendConversation([...messages, userEntry]);
  }

  function handleRetry() {
    // The failed turn is already in the store; resend it without duplicating.
    if (lastMessage?.role === 'user') {
      chat.reset();
      sendConversation(messages);
    }
  }

  function handleNewChat() {
    chat.reset();
    clearMessages();
    setDraft('');
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  }

  const showEmpty = messages.length === 0;

  return (
    <Drawer
      open={open}
      onClose={closePanel}
      title={AI_MESSAGES.panelTitle}
      description={AI_MESSAGES.panelDescription}
      headerAction={
        <span className="flex items-center gap-1">
          {status.data?.mode === 'mock' ? (
            <span
              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold tracking-[0.06em] text-muted-foreground uppercase"
              title={AI_MESSAGES.mockBadge}
            >
              <SparklesIcon width={11} height={11} />
              {AI_MESSAGES.mockBadge}
            </span>
          ) : null}
          <button
            type="button"
            onClick={handleNewChat}
            disabled={showEmpty && !chat.error}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RefreshIcon width={12} height={12} />
            {AI_MESSAGES.newChat}
          </button>
        </span>
      }
      footer={
        <div className="space-y-2 px-3.5 py-2.5">
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <label htmlFor="assistant-composer" className="sr-only">
              {AI_MESSAGES.chatPlaceholder}
            </label>
            <textarea
              id="assistant-composer"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={AI_MESSAGES.chatPlaceholder}
              rows={2}
              maxLength={AI_LIMITS.chatMax}
              disabled={pending}
              data-autofocus
              className="min-h-[56px] w-full resize-none rounded-lg border border-border bg-background px-2.5 py-2 text-[13px] leading-relaxed text-foreground outline-none transition-shadow placeholder:text-muted-foreground/70 focus-visible:border-tone focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            />
            <Button
              type="submit"
              size="sm"
              className="h-9 shrink-0"
              disabled={!canSend}
              loading={pending}
              aria-label="Send message"
            >
              <SendIcon width={15} height={15} />
              Send
            </Button>
          </form>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] text-muted-foreground">{AI_MESSAGES.chatHint}</p>
            <AiDisclaimer />
          </div>
        </div>
      }
    >
      <div className="flex-1 overflow-y-auto px-3.5 py-3.5">
        {showEmpty ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-tone/25 bg-tone-soft/30 px-3.5 py-3">
              <p className="flex items-center gap-2 font-display text-[13px] font-semibold text-foreground">
                <SparklesIcon width={14} height={14} className="text-tone" />
                {AI_MESSAGES.emptyTitle}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {AI_MESSAGES.emptyDescription}
              </p>
            </div>

            <div className="space-y-2">
              <QuickAction
                icon={<SparklesIcon width={14} height={14} />}
                label={AI_MESSAGES.createTodos}
                hint={AI_MESSAGES.createTodosHint}
                onClick={() => openDialog('generate-todos')}
              />
              <QuickAction
                icon={<SparklesIcon width={14} height={14} />}
                label={AI_MESSAGES.planSprint}
                hint={AI_MESSAGES.planSprintHint}
                onClick={() => openDialog('plan-sprint')}
              />
              <QuickAction
                icon={<SparklesIcon width={14} height={14} />}
                label={AI_MESSAGES.summarizeSprint}
                hint={AI_MESSAGES.summarizeSprintHint}
                onClick={() => openDialog('summarize')}
              />
            </div>
          </div>
        ) : (
          <ol className="space-y-3.5" aria-label="Conversation">
            {messages.map((message) => (
              <li
                key={message.id}
                className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
              >
                <div
                  className={[
                    'max-w-[92%] rounded-xl px-3 py-2',
                    message.role === 'user'
                      ? 'rounded-br-md bg-primary text-primary-foreground'
                      : 'rounded-bl-md border border-border bg-background text-foreground',
                  ].join(' ')}
                >
                  {message.role === 'user' ? (
                    <p className="text-[13px] leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                  ) : (
                    <Markdown content={message.content} />
                  )}

                  {message.role === 'assistant' ? (
                    <div className="mt-2 flex items-center justify-between gap-2 border-t border-border/70 pt-1.5">
                      <SourceBadge source={message.source} />
                      <span className="text-[10px] text-muted-foreground">Assistant</span>
                    </div>
                  ) : null}
                </div>
              </li>
            ))}

            {pending ? (
              <li className="flex justify-start">
                <div
                  role="status"
                  aria-live="polite"
                  className="flex items-center gap-2 rounded-xl rounded-bl-md border border-border bg-background px-3 py-2.5 text-[13px] text-muted-foreground"
                >
                  <span className="flex items-center gap-1" aria-hidden="true">
                    <span className="size-1.5 animate-pulse rounded-full bg-tone [animation-delay:-0.3s]" />
                    <span className="size-1.5 animate-pulse rounded-full bg-tone [animation-delay:-0.15s]" />
                    <span className="size-1.5 animate-pulse rounded-full bg-tone" />
                  </span>
                  {AI_MESSAGES.thinking}
                </div>
              </li>
            ) : null}

            {chat.error ? (
              <li>
                <AiErrorAlert
                  error={chat.error}
                  onRetry={handleRetry}
                  retrying={pending}
                />
              </li>
            ) : null}
          </ol>
        )}

        {showEmpty && chat.error ? (
          <div className="mt-4">
            <AiErrorAlert error={chat.error} onRetry={handleRetry} retrying={pending} />
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>

    </Drawer>
  );
}
