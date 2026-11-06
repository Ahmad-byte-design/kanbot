import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Modal, TextField, TextareaField } from '../../../components/ui';
import { errorMessage } from '../../../services/client';
import type { PlanSprintResponse, Todo } from '../../../types/api';
import { PROJECT_ROUTES } from '../../projects/constants/projects.constants';
import { zodFieldErrors } from '../../../lib/zod-field-errors';
import { useBacklog } from '../../backlog/hooks/use-backlog';
import { todoKeys } from '../../backlog/query-keys';
import { PointsBadge, PriorityTag } from '../../backlog/components/todo-tags';
import { AI_LIMITS, AI_MESSAGES } from '../constants/ai.constants';
import { useCreateSprint } from '../../sprints/hooks/use-create-sprint';
import { usePlanSprint } from '../hooks/use-plan-sprint';
import { planSprintRequest, planSprintSchema } from '../schema/ai.schema';
import { AiDisclaimer, AiErrorAlert, AiSkeleton, SourceBadge } from './ai-bits';

interface PlanSprintDialogProps {
  projectId: string;
  onClose: () => void;
}

/**
 * AI-3: suggest a capacity-aware sprint, let the user edit the goal and the
 * selection, then create a planned sprint from the checked backlog todos.
 */
export function PlanSprintDialog({ projectId, onClose }: PlanSprintDialogProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const backlog = useBacklog(projectId);
  const suggest = usePlanSprint(projectId);
  const createSprint = useCreateSprint(projectId);

  const [capacity, setCapacity] = useState('');
  const [focus, setFocus] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [plan, setPlan] = useState<PlanSprintResponse | null>(null);
  const [goal, setGoal] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  const suggesting = suggest.isPending;
  const creating = createSprint.isPending;
  const capacityNumber = Number(capacity) || 0;

  const backlogById = new Map<string, Todo>((backlog.data ?? []).map((todo) => [todo.id, todo]));
  const selectedTodos = selectedIds
    .map((id) => backlogById.get(id))
    .filter((todo): todo is Todo => Boolean(todo));
  const selectedPoints = selectedTodos.reduce(
    (total, todo) => total + (todo.storyPoints ?? 0),
    0,
  );
  const overCapacity = capacityNumber > 0 && selectedPoints > capacityNumber;
  const percent = capacityNumber > 0 ? Math.min(100, (selectedPoints / capacityNumber) * 100) : 0;

  function handleSuggest(event?: FormEvent) {
    event?.preventDefault();
    setErrors({});
    setSelectionError(null);

    const parsed = planSprintSchema.safeParse({ capacity, focus });
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }

    suggest.mutate(planSprintRequest(parsed.data), {
      onSuccess: (response) => {
        setPlan(response);
        setGoal(response.goal);
        setSelectedIds(response.todoIds);
      },
    });
  }

  function toggleTodo(id: string) {
    setSelectionError(null);
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function handleCreate() {
    setSelectionError(null);

    if (selectedIds.length === 0) {
      setSelectionError(AI_MESSAGES.noPlanTodos);
      return;
    }

    createSprint.mutate(
      {
        goal: goal.trim(),
        todoIds: selectedIds,
      },
      {
        onSuccess: () => {
          // Moving backlog todos into the new sprint changes both lists.
          void queryClient.invalidateQueries({ queryKey: todoKeys.backlog(projectId) });
          onClose();
          navigate(PROJECT_ROUTES.backlog(projectId));
        },
      },
    );
  }

  return (
    <Modal
      open
      onClose={creating ? () => {} : onClose}
      title={AI_MESSAGES.planTitle}
      description={AI_MESSAGES.planDescription}
      size="lg"
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose} disabled={creating || suggesting}>
            Cancel
          </Button>
          {plan ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSuggest()}
                loading={suggesting}
              >
                {AI_MESSAGES.suggest}
              </Button>
              <Button
                type="button"
                onClick={handleCreate}
                loading={creating}
                disabled={selectedIds.length === 0 || overCapacity}
              >
                {AI_MESSAGES.createSprint(selectedIds.length)}
              </Button>
            </>
          ) : (
            <Button type="submit" form="plan-sprint-form" loading={suggesting}>
              {AI_MESSAGES.suggest}
            </Button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <form id="plan-sprint-form" className="flex flex-col gap-4" onSubmit={handleSuggest} noValidate>
          <TextField
            label={AI_MESSAGES.capacityLabel}
            type="number"
            value={capacity}
            onChange={setCapacity}
            error={errors.capacity}
            helperText={AI_MESSAGES.capacityHelper}
            disabled={suggesting}
            min={AI_LIMITS.capacityMin}
            max={AI_LIMITS.capacityMax}
            step={1}
            className="sm:max-w-56"
            data-autofocus
          />

          <TextareaField
            label={AI_MESSAGES.focusLabel}
            value={focus}
            onChange={setFocus}
            placeholder={AI_MESSAGES.focusPlaceholder}
            error={errors.focus}
            disabled={suggesting}
            maxLength={AI_LIMITS.focusMax}
            rows={2}
          />
        </form>

        {suggest.error ? (
          <AiErrorAlert
            error={suggest.error}
            onRetry={() => handleSuggest()}
            retrying={suggesting}
          />
        ) : null}

        {suggesting ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4">
            <AiSkeleton label={AI_MESSAGES.suggesting} />
          </div>
        ) : null}

        {plan ? (
          <section aria-label={AI_MESSAGES.suggestedTodos} className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-foreground">{AI_MESSAGES.suggestedGoal}</h3>
              <SourceBadge source={plan.source} />
            </div>

            <TextField
              aria-label={AI_MESSAGES.suggestedGoal}
              value={goal}
              onChange={setGoal}
              error={errors.goal}
              maxLength={AI_LIMITS.goalMax}
              helperText={`${goal.length} / ${AI_LIMITS.goalMax}`}
              disabled={creating}
            />

            <div className="rounded-xl border border-border bg-muted/25 p-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-xs font-medium text-foreground">{AI_MESSAGES.runningTotal}</p>
                <p
                  className={[
                    'text-xs tabular-nums',
                    overCapacity ? 'font-semibold text-error' : 'text-muted-foreground',
                  ].join(' ')}
                >
                  <span className="font-semibold text-foreground">{selectedPoints}</span> /{' '}
                  {capacityNumber} pts
                </p>
              </div>
              <div
                role="progressbar"
                aria-label="Selected points against capacity"
                aria-valuemin={0}
                aria-valuemax={capacityNumber || 1}
                aria-valuenow={selectedPoints}
                className="mt-2 h-2 overflow-hidden rounded-full bg-muted ring-1 ring-inset ring-border"
              >
                <div
                  className={[
                    'h-full rounded-full transition-[width] duration-300',
                    overCapacity ? 'bg-error' : 'bg-tone',
                  ].join(' ')}
                  style={{ width: `${percent}%` }}
                />
              </div>
              {overCapacity ? (
                <p className="mt-1.5 text-[11px] font-medium text-error">
                  {AI_MESSAGES.overCapacity}
                </p>
              ) : null}
            </div>

            <div>
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-sm font-semibold text-foreground">
                  {AI_MESSAGES.suggestedTodos}
                </h3>
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  {selectedIds.length} of {plan.todoIds.length} selected
                </span>
              </div>

              {backlog.isPending ? (
                <div className="mt-2 rounded-xl border border-border p-4">
                  <AiSkeleton label="Loading backlog todos" />
                </div>
              ) : backlog.error ? (
                <p className="mt-2 rounded-xl border border-border px-4 py-4 text-sm text-muted-foreground">
                  {errorMessage(backlog.error)}
                </p>
              ) : plan.todoIds.length === 0 ? (
                <p className="mt-2 rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                  {AI_MESSAGES.suggestedTodosEmpty}
                </p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {plan.todoIds.map((id) => {
                    const todo = backlogById.get(id);
                    if (!todo) return null;
                    const checked = selectedIds.includes(id);
                    return (
                      <li
                        key={id}
                        className={[
                          'flex items-start gap-3 rounded-lg border px-3 py-2 transition-colors',
                          checked ? 'border-tone/35 bg-tone-soft/20' : 'border-border',
                        ].join(' ')}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleTodo(id)}
                          aria-label={`Include ${todo.key}`}
                          disabled={creating}
                          className="mt-1 size-4 shrink-0 accent-primary"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="flex flex-wrap items-baseline gap-2 text-sm text-foreground">
                            <span className="font-mono text-[11px] font-semibold tracking-[0.04em] text-muted-foreground">
                              {todo.key}
                            </span>
                            <span className="min-w-0 flex-1">{todo.title}</span>
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <PriorityTag priority={todo.priority} />
                            <PointsBadge points={todo.storyPoints} />
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {plan.reasoning ? (
              <div className="rounded-xl border border-border bg-background px-4 py-3">
                <h4 className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                  {AI_MESSAGES.reasoning}
                </h4>
                <p className="mt-1 text-sm leading-relaxed text-foreground">{plan.reasoning}</p>
              </div>
            ) : null}

            {selectionError ? <Alert variant="error" message={selectionError} /> : null}
            {createSprint.error ? (
              <Alert variant="error" message={errorMessage(createSprint.error)} />
            ) : null}
            <AiDisclaimer />
          </section>
        ) : (
          <AiDisclaimer />
        )}
      </div>
    </Modal>
  );
}
