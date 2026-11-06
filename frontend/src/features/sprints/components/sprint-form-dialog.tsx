import { useState, type FormEvent } from 'react';
import { Alert, Button, Modal, TextField, TextareaField } from '../../../components/ui';
import { errorMessage, fieldErrors } from '../../../services/client';
import { zodFieldErrors } from '../../../lib/zod-field-errors';
import type { Sprint } from '../../../types/api';
import { SPRINT_LIMITS, SPRINT_MESSAGES } from '../constants/sprints.constants';
import { useCreateSprint } from '../hooks/use-create-sprint';
import { useUpdateSprint } from '../hooks/use-update-sprint';
import { nextSprintName, toSprintFormValues } from '../lib/sprint-meta';
import { sprintFormSchema, sprintRequestFromValues } from '../schema/sprint.schema';
import type { SprintFormMode, SprintFormValues } from '../types/sprints.types';

interface SprintFormDialogProps {
  mode: SprintFormMode;
  projectId: string;
  /** Used to pick the default name for a new sprint. */
  sprints: Sprint[];
  sprint?: Sprint;
  onClose: () => void;
}

const SPRINT_FIELDS = new Set(['name', 'goal', 'startDate', 'endDate']);

function serverFieldErrors(error: unknown): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const [path, message] of Object.entries(fieldErrors(error))) {
    const field = path.split('.')[0] ?? '';
    if (SPRINT_FIELDS.has(field) && !errors[field]) errors[field] = message;
  }

  return errors;
}

/** SPR-1 / SPR-2: create or edit a planned sprint. */
export function SprintFormDialog({
  mode,
  projectId,
  sprints,
  sprint,
  onClose,
}: SprintFormDialogProps) {
  const createSprint = useCreateSprint(projectId);
  const updateSprint = useUpdateSprint(projectId);
  const isEdit = mode === 'edit';

  const [values, setValues] = useState<SprintFormValues>(() =>
    isEdit
      ? toSprintFormValues(sprint)
      : { ...toSprintFormValues(), name: nextSprintName(sprints) },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const pending = createSprint.isPending || updateSprint.isPending;

  function updateField(field: keyof SprintFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function requestClose() {
    if (!pending) onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    const parsed = sprintFormSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }

    const changes = sprintRequestFromValues(parsed.data);

    try {
      if (isEdit) {
        if (!sprint) return;
        await updateSprint.mutateAsync({ sprintId: sprint.id, changes });
      } else {
        await createSprint.mutateAsync(changes);
      }
      onClose();
    } catch (caught) {
      const fields = serverFieldErrors(caught);
      setErrors(fields);
      if (Object.keys(fields).length === 0) setSubmitError(errorMessage(caught));
    }
  }

  return (
    <Modal
      open
      onClose={requestClose}
      title={isEdit ? SPRINT_MESSAGES.editTitle : SPRINT_MESSAGES.createTitle}
      description={isEdit ? SPRINT_MESSAGES.editDescription : SPRINT_MESSAGES.createDescription}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={requestClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form="sprint-form" loading={pending}>
            {isEdit ? 'Save changes' : SPRINT_MESSAGES.create}
          </Button>
        </>
      }
    >
      <form id="sprint-form" className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        {submitError ? <Alert variant="error" message={submitError} /> : null}

        <TextField
          label={SPRINT_MESSAGES.nameLabel}
          value={values.name}
          onChange={(value) => updateField('name', value)}
          placeholder="Sprint 1"
          error={errors.name}
          maxLength={SPRINT_LIMITS.nameMax}
          disabled={pending}
          data-autofocus
          autoComplete="off"
        />

        <TextareaField
          label={SPRINT_MESSAGES.goalLabel}
          value={values.goal}
          onChange={(value) => updateField('goal', value)}
          placeholder={SPRINT_MESSAGES.goalPlaceholder}
          error={errors.goal}
          meta={`${values.goal.length}/${SPRINT_LIMITS.goalMax}`}
          maxLength={SPRINT_LIMITS.goalMax}
          rows={3}
          disabled={pending}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={SPRINT_MESSAGES.startDateLabel}
            type="date"
            value={values.startDate}
            onChange={(value) => updateField('startDate', value)}
            error={errors.startDate}
            disabled={pending}
          />
          <TextField
            label={SPRINT_MESSAGES.endDateLabel}
            type="date"
            value={values.endDate}
            onChange={(value) => updateField('endDate', value)}
            error={errors.endDate}
            min={values.startDate || undefined}
            helperText={SPRINT_MESSAGES.dateHelper}
            disabled={pending}
          />
        </div>
      </form>
    </Modal>
  );
}
