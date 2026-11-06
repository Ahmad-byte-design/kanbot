import { useState, type FormEvent } from 'react';
import {
  Alert,
  Button,
  Modal,
  SelectField,
  TextField,
  TextareaField,
} from '../../../components/ui';
import { zodFieldErrors } from '../../../lib/zod-field-errors';
import { errorMessage } from '../../../services/client';
import type { Sprint, Todo } from '../../../types/api';
import {
  TODO_LIMITS,
  TODO_MESSAGES,
  TODO_PRIORITY_OPTIONS,
  TODO_STATUS_OPTIONS,
  TODO_STORY_POINT_OPTIONS,
  TODO_TYPE_OPTIONS,
} from '../constants/backlog.constants';
import { useDeleteTodo } from '../hooks/use-delete-todo';
import { useUpdateTodo } from '../hooks/use-update-todo';
import { todoServerErrors } from '../lib/server-errors';
import {
  isTodoFormDirty,
  selectableSprints,
  sprintOptionLabel,
  toTodoFormValues,
} from '../lib/todo-meta';
import { todoFormSchema } from '../schema/todo.schema';
import type { TodoFormValues } from '../types/todo.types';
import { TrashIcon } from '../../../assets/icons';

interface TodoFormDialogProps {
  projectId: string;
  todo: Todo;
  sprints: Sprint[];
  sprintsPending: boolean;
  onClose: () => void;
}

/**
 * BL-3 + BL-7: edit every todo field, move it to another sprint (or back to
 * the backlog), and delete it. Destructive and discard confirmations stay
 * inline so the dialog never stacks a second modal on top of itself.
 */
export function TodoFormDialog({
  projectId,
  todo,
  sprints,
  sprintsPending,
  onClose,
}: TodoFormDialogProps) {
  const updateTodo = useUpdateTodo(projectId);
  const deleteTodo = useDeleteTodo(projectId);

  const [initialValues] = useState<TodoFormValues>(() => toTodoFormValues(todo));
  const [values, setValues] = useState<TodoFormValues>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const pending = updateTodo.isPending || deleteTodo.isPending;
  const dirty = isTodoFormDirty(initialValues, values);

  const sprintChoices = selectableSprints(sprints);
  const sprintOptions = [
    { value: '', label: 'Backlog (no sprint)' },
    ...sprintChoices.map((sprint) => ({ value: sprint.id, label: sprintOptionLabel(sprint) })),
  ];

  function updateField(field: keyof TodoFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function requestClose() {
    if (pending) return;

    if (confirmingDelete) {
      setConfirmingDelete(false);
      return;
    }

    if (dirty) {
      setConfirmingDiscard(true);
      return;
    }

    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    const parsed = todoFormSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }

    try {
      await updateTodo.mutateAsync({ todoId: todo.id, changes: parsed.data });
      onClose();
    } catch (caught) {
      const fields = todoServerErrors(caught);
      setErrors(fields);
      if (Object.keys(fields).length === 0) setSubmitError(errorMessage(caught));
    }
  }

  async function handleDelete() {
    setDeleteError(null);

    try {
      await deleteTodo.mutateAsync(todo.id);
      onClose();
    } catch (caught) {
      setDeleteError(errorMessage(caught));
    }
  }

  return (
    <Modal
      open
      onClose={requestClose}
      size="lg"
      title={`${todo.key} · Edit todo`}
      description="Every change saves to this project. Moving the sprint also moves the todo's list position."
      footer={
        <>
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive sm:mr-auto"
            onClick={() => {
              setConfirmingDiscard(false);
              setConfirmingDelete(true);
            }}
            disabled={pending}
          >
            <TrashIcon width={15} height={15} />
            Delete
          </Button>
          <Button type="button" variant="ghost" onClick={requestClose} disabled={pending}>
            Cancel
          </Button>
          <Button
            type="submit"
            form={`todo-form-${todo.id}`}
            loading={updateTodo.isPending}
            disabled={deleteTodo.isPending}
          >
            Save changes
          </Button>
        </>
      }
    >
      <form
        id={`todo-form-${todo.id}`}
        className="flex flex-col gap-5"
        onSubmit={handleSubmit}
        noValidate
      >
        {submitError ? <Alert variant="error" message={submitError} /> : null}

        {confirmingDiscard ? (
          <div className="rounded-lg border border-ring/40 bg-primary/5 p-3">
            <p className="text-sm font-semibold text-foreground">Discard unsaved changes?</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Your edits to {todo.key} have not been saved.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setConfirmingDiscard(false)}
              >
                Keep editing
              </Button>
              <Button type="button" size="sm" variant="destructive" onClick={onClose}>
                Discard changes
              </Button>
            </div>
          </div>
        ) : null}

        {confirmingDelete ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3">
            <p className="text-sm font-semibold text-destructive">Delete {todo.key}?</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              “{todo.title}” — {TODO_MESSAGES.deleteWarning}
            </p>
            {deleteError ? (
              <div className="mt-2">
                <Alert variant="error" message={deleteError} />
              </div>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setConfirmingDelete(false)}
                disabled={deleteTodo.isPending}
              >
                Keep todo
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                loading={deleteTodo.isPending}
                onClick={handleDelete}
              >
                Delete todo
              </Button>
            </div>
          </div>
        ) : null}

        <TextField
          label="Title"
          value={values.title}
          onChange={(value) => updateField('title', value)}
          placeholder="What needs to happen?"
          error={errors.title}
          maxLength={TODO_LIMITS.titleMax}
          disabled={pending}
          data-autofocus
          autoComplete="off"
        />

        <TextareaField
          label="Description"
          value={values.description}
          onChange={(value) => updateField('description', value)}
          placeholder="Context, acceptance notes, links…"
          error={errors.description}
          meta={`${values.description.length}/${TODO_LIMITS.descriptionMax}`}
          maxLength={TODO_LIMITS.descriptionMax}
          rows={4}
          disabled={pending}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Type"
            value={values.type}
            onChange={(value) => updateField('type', value)}
            options={TODO_TYPE_OPTIONS}
            error={errors.type}
            disabled={pending}
          />
          <SelectField
            label="Status"
            value={values.status}
            onChange={(value) => updateField('status', value)}
            options={TODO_STATUS_OPTIONS}
            error={errors.status}
            disabled={pending}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Priority"
            value={values.priority}
            onChange={(value) => updateField('priority', value)}
            options={TODO_PRIORITY_OPTIONS}
            error={errors.priority}
            disabled={pending}
          />
          <SelectField
            label="Story points"
            value={values.storyPoints}
            onChange={(value) => updateField('storyPoints', value)}
            options={TODO_STORY_POINT_OPTIONS}
            error={errors.storyPoints}
            disabled={pending}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Due date"
            type="date"
            value={values.dueDate}
            onChange={(value) => updateField('dueDate', value)}
            error={errors.dueDate}
            disabled={pending}
          />
          <SelectField
            label="Sprint"
            value={values.sprintId}
            onChange={(value) => updateField('sprintId', value)}
            options={sprintOptions}
            error={errors.sprintId}
            helperText={
              sprintsPending
                ? 'Loading sprints…'
                : sprintChoices.length === 0
                  ? 'No planned or active sprints yet.'
                  : TODO_MESSAGES.keyHintEdit
            }
            disabled={pending || sprintsPending}
          />
        </div>

        <TextField
          label="Labels"
          value={values.labels}
          onChange={(value) => updateField('labels', value)}
          placeholder="design, auth, quick-win"
          error={errors.labels}
          helperText={`Comma-separated, up to ${TODO_LIMITS.labelsMax} labels of ${TODO_LIMITS.labelMax} characters.`}
          disabled={pending}
          autoComplete="off"
        />
      </form>
    </Modal>
  );
}
