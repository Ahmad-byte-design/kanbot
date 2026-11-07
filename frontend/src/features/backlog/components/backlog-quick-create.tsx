import { useRef, useState, type FormEvent } from 'react';
import { Alert, Button } from '../../../components/ui';
import { errorMessage } from '../../../services/client';
import {
  QUICK_CREATE_INPUT_ID,
  TODO_LIMITS,
  TODO_MESSAGES,
} from '../constants/backlog.constants';
import { useCreateTodo } from '../hooks/use-create-todo';
import { zodFieldErrors } from '../../../lib/zod-field-errors';
import { todoServerErrors } from '../lib/server-errors';
import { quickTodoSchema } from '../schema/todo.schema';
import { PlusIcon } from '../../../assets/icons';

interface BacklogQuickCreateProps {
  projectId: string;
  /** Called after a successful create, so active filters can be cleared. */
  onCreated: () => void;
}

/**
 * BL-2: one field, Enter to add. The input clears before the request so the
 * next title can be typed immediately; a failure restores the text.
 */
export function BacklogQuickCreate({ projectId, onCreated }: BacklogQuickCreateProps) {
  const createTodo = useCreateTodo(projectId);
  const inputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    const parsed = quickTodoSchema.safeParse({ title });
    if (!parsed.success) {
      setError(Object.values(zodFieldErrors(parsed.error))[0] ?? 'Enter a title first.');
      return;
    }

    const submitted = parsed.data.title;
    setError(null);
    setTitle('');

    try {
      await createTodo.mutateAsync({ title: submitted });
      onCreated();
      inputRef.current?.focus();
    } catch (caught) {
      setTitle(submitted);
      const fields = todoServerErrors(caught);
      if (fields.title) {
        setError(fields.title);
      } else {
        setSubmitError(errorMessage(caught));
      }
      inputRef.current?.focus();
    }
  }

  return (
    <div className="border-b border-border px-3 py-2.5 sm:px-4">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2">
        <div className="flex items-start gap-2">
          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-muted-foreground">
              <PlusIcon width={15} height={15} />
            </span>
            <input
              ref={inputRef}
              id={QUICK_CREATE_INPUT_ID}
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.preventDefault();
                  setTitle('');
                  setError(null);
                }
              }}
              placeholder={TODO_MESSAGES.quickCreatePlaceholder}
              aria-label="New todo title"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'quick-create-error' : 'quick-create-hint'}
              maxLength={TODO_LIMITS.titleMax}
              autoComplete="off"
              className={[
                'h-9 w-full rounded-md border bg-background pr-3 pl-8 text-[13px] text-foreground outline-none transition-colors',
                'placeholder:text-muted-foreground focus-visible:ring-2',
                error
                  ? 'border-error focus-visible:border-error focus-visible:ring-error/30'
                  : 'border-input focus-visible:border-ring focus-visible:ring-ring/30',
              ].join(' ')}
            />
          </div>
          <Button type="submit" loading={createTodo.isPending} className="shrink-0">
            Add
          </Button>
        </div>

        {error ? (
          <p id="quick-create-error" role="alert" className="text-[11px] text-error">
            {error}
          </p>
        ) : (
          <p id="quick-create-hint" className="text-[11px] text-muted-foreground">
            {TODO_MESSAGES.quickCreateHint}
          </p>
        )}

        {submitError ? <Alert variant="error" message={submitError} /> : null}
      </form>
    </div>
  );
}
