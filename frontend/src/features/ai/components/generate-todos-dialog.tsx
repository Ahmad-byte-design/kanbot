import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Alert, Button, Modal, SelectField, TextField } from '../../../components/ui';
import { errorMessage } from '../../../services/client';
import type { CreateTodoRequest } from '../../../types/api';
import { PROJECT_ROUTES } from '../../projects/constants/projects.constants';
import { TrashIcon } from '../../../assets/icons';
import { zodFieldErrors } from '../../../lib/zod-field-errors';
import { AI_LIMITS, AI_MESSAGES } from '../constants/ai.constants';
import { useBulkCreateTodos } from '../hooks/use-bulk-create-todos';
import { useGenerateTodos } from '../hooks/use-generate-todos';
import {
  checkedDrafts,
  draftRows,
  draftsTotalPoints,
  parsePoints,
  STORY_POINT_CHOICES,
  TODO_PRIORITY_CHOICES,
  TODO_TYPE_CHOICES,
} from '../lib/ai-meta';
import { generateTodosRequest, generateTodosSchema } from '../schema/ai.schema';
import type { DraftTodoRow } from '../types/ai.types';
import { AiDisclaimer, AiErrorAlert, SourceBadge } from './ai-bits';

interface GenerateTodosDialogProps {
  projectId: string;
  onClose: () => void;
}

/**
 * AI-2: draft todos from a prompt, edit them in place, then save the checked
 * ones through the bulk endpoint. Nothing reaches the server before that save.
 */
export function GenerateTodosDialog({ projectId, onClose }: GenerateTodosDialogProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const generate = useGenerateTodos(projectId);
  const bulk = useBulkCreateTodos(projectId);

  const [prompt, setPrompt] = useState('');
  const [count, setCount] = useState(String(AI_LIMITS.defaultCount));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<DraftTodoRow[] | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  const pending = generate.isPending;
  const saving = bulk.isPending;
  const selected = checkedDrafts(drafts ?? []);

  function handleGenerate(event?: FormEvent) {
    event?.preventDefault();
    setErrors({});
    setSelectionError(null);

    const parsed = generateTodosSchema.safeParse({ prompt, count });
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }

    generate.mutate(generateTodosRequest(parsed.data), {
      onSuccess: (response) => setDrafts(draftRows(response.todos)),
    });
  }

  function updateDraft(id: string, patch: Partial<DraftTodoRow>) {
    setDrafts((rows) =>
      rows ? rows.map((row) => (row.id === id ? { ...row, ...patch } : row)) : rows,
    );
  }

  function removeDraft(id: string) {
    setDrafts((rows) => (rows ? rows.filter((row) => row.id !== id) : rows));
  }

  function handleSave() {
    setSelectionError(null);
    if (selected.length === 0) {
      setSelectionError(AI_MESSAGES.noDraftsSelected);
      return;
    }

    const todos: CreateTodoRequest[] = selected.map((row) => ({
      title: row.title.trim(),
      description: row.description.trim(),
      type: row.type,
      priority: row.priority,
      storyPoints: row.storyPoints,
    }));

    bulk.mutate(todos, {
      onSuccess: () => {
        onClose();
        // The backlog is where the user expects to review what was saved.
        if (!location.pathname.endsWith('/backlog')) {
          navigate(PROJECT_ROUTES.backlog(projectId));
        }
      },
    });
  }

  return (
    <Modal
      open
      onClose={saving ? () => {} : onClose}
      title={AI_MESSAGES.generateTitle}
      description={AI_MESSAGES.generateDescription}
      size="lg"
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving || pending}>
            Cancel
          </Button>
          {drafts ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleGenerate()}
                loading={pending}
              >
                {AI_MESSAGES.regenerate}
              </Button>
              <Button type="button" onClick={handleSave} loading={saving} disabled={selected.length === 0}>
                {AI_MESSAGES.addToBacklog(selected.length)}
              </Button>
            </>
          ) : (
            <Button type="submit" form="generate-todos-form" loading={pending}>
              {AI_MESSAGES.generate}
            </Button>
          )}
        </>
      }
    >
      <form id="generate-todos-form" className="flex flex-col gap-5" onSubmit={handleGenerate} noValidate>
        <TextField
          label={AI_MESSAGES.promptLabel}
          value={prompt}
          onChange={setPrompt}
          placeholder={AI_MESSAGES.promptPlaceholder}
          error={errors.prompt}
          disabled={pending}
          maxLength={AI_LIMITS.promptMax}
          data-autofocus
        />

        <TextField
          label={AI_MESSAGES.countLabel}
          type="number"
          value={count}
          onChange={setCount}
          error={errors.count}
          helperText={AI_MESSAGES.countHint}
          disabled={pending}
          min={AI_LIMITS.countMin}
          max={AI_LIMITS.countMax}
          step={1}
          className="sm:max-w-48"
        />

        {generate.error ? (
          <AiErrorAlert
            error={generate.error}
            onRetry={() => handleGenerate()}
            retrying={pending}
          />
        ) : null}

        {pending ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-4">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <span
                className="size-4 animate-spin rounded-full border-2 border-tone border-t-transparent"
                aria-hidden="true"
              />
              {AI_MESSAGES.drafting}
            </p>
          </div>
        ) : null}

        {drafts ? (
          <section aria-label={AI_MESSAGES.draftsTitle} className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-foreground">{AI_MESSAGES.draftsTitle}</h3>
                <p className="text-xs text-muted-foreground">{AI_MESSAGES.draftsDescription}</p>
              </div>
              <div className="flex items-center gap-2 text-[11px] tabular-nums text-muted-foreground">
                <SourceBadge source={generate.data?.source} />
                <span>
                  {selected.length} selected · {draftsTotalPoints(drafts)} pts
                </span>
              </div>
            </div>

            {drafts.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                No drafts left. Regenerate to try again.
              </p>
            ) : (
              <ul className="space-y-2">
                {drafts.map((row, index) => (
                  <li
                    key={row.id}
                    className={[
                      'rounded-xl border bg-background p-3 transition-colors',
                      row.checked ? 'border-tone/35' : 'border-border opacity-70',
                    ].join(' ')}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={row.checked}
                        onChange={(event) =>
                          updateDraft(row.id, { checked: event.target.checked })
                        }
                        aria-label={`Include draft ${index + 1}`}
                        className="mt-2.5 size-4 shrink-0 accent-primary"
                      />
                      <div className="min-w-0 flex-1 space-y-2">
                        <TextField
                          aria-label={`Draft ${index + 1} title`}
                          value={row.title}
                          onChange={(title) => updateDraft(row.id, { title })}
                          maxLength={AI_LIMITS.titleMax}
                          disabled={saving}
                        />

                        {row.description ? (
                          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                            {row.description}
                          </p>
                        ) : null}

                        <div className="grid gap-2 sm:grid-cols-3">
                          <SelectField
                            aria-label={`Draft ${index + 1} type`}
                            value={row.type}
                            onChange={(value) =>
                              updateDraft(row.id, {
                                type: value as DraftTodoRow['type'],
                              })
                            }
                            options={TODO_TYPE_CHOICES}
                            disabled={saving}
                          />
                          <SelectField
                            aria-label={`Draft ${index + 1} priority`}
                            value={row.priority}
                            onChange={(value) =>
                              updateDraft(row.id, {
                                priority: value as DraftTodoRow['priority'],
                              })
                            }
                            options={TODO_PRIORITY_CHOICES}
                            disabled={saving}
                          />
                          <SelectField
                            aria-label={`Draft ${index + 1} points`}
                            value={row.storyPoints === null ? '' : String(row.storyPoints)}
                            onChange={(value) =>
                              updateDraft(row.id, { storyPoints: parsePoints(value) })
                            }
                            options={STORY_POINT_CHOICES}
                            disabled={saving}
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDraft(row.id)}
                        disabled={saving}
                        aria-label={`Remove draft ${index + 1}`}
                        className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                      >
                        <TrashIcon width={14} height={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {selectionError ? <Alert variant="error" message={selectionError} /> : null}
            {bulk.error ? <Alert variant="error" message={errorMessage(bulk.error)} /> : null}
            <AiDisclaimer />
          </section>
        ) : (
          <AiDisclaimer />
        )}
      </form>
    </Modal>
  );
}
