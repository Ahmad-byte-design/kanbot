import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Alert, Button, Modal, TextField } from '../../../components/ui';
import { zodFieldErrors } from '../../../lib/zod-field-errors';
import { errorMessage } from '../../../services/client';
import type { Sprint } from '../../../types/api';
import { PROJECT_ROUTES } from '../../projects';
import { SPRINT_LIMITS, SPRINT_MESSAGES } from '../constants/sprints.constants';
import { useStartSprint } from '../hooks/use-start-sprint';
import { addDaysIso, todayIso } from '../lib/sprint-meta';
import { startSprintSchema } from '../schema/sprint.schema';

interface StartSprintDialogProps {
  projectId: string;
  sprint: Sprint;
  onClose: () => void;
}

/** SPR-3: confirm the dates, start the sprint and open its board. */
export function StartSprintDialog({ projectId, sprint, onClose }: StartSprintDialogProps) {
  const navigate = useNavigate();
  const startSprint = useStartSprint(projectId);

  const [values, setValues] = useState(() => {
    const startDate = sprint.startDate ?? todayIso();
    return {
      startDate,
      endDate: sprint.endDate ?? addDaysIso(startDate, SPRINT_LIMITS.defaultLengthDays),
    };
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const pending = startSprint.isPending;

  function updateStartDate(value: string) {
    setValues((current) => {
      const endDate =
        current.endDate === '' || current.endDate < value
          ? addDaysIso(value, SPRINT_LIMITS.defaultLengthDays)
          : current.endDate;
      return { startDate: value, endDate };
    });
    setErrors((current) => {
      if (!current.startDate && !current.endDate) return current;
      return {};
    });
  }

  function updateEndDate(value: string) {
    setValues((current) => ({ ...current, endDate: value }));
    setErrors((current) => {
      if (!current.endDate) return current;
      const next = { ...current };
      delete next.endDate;
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    const parsed = startSprintSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }

    try {
      await startSprint.mutateAsync({ sprintId: sprint.id, changes: parsed.data });
      onClose();
      navigate(PROJECT_ROUTES.board(projectId));
    } catch (caught) {
      setSubmitError(errorMessage(caught));
    }
  }

  return (
    <Modal
      open
      onClose={pending ? () => {} : onClose}
      title={SPRINT_MESSAGES.startTitle}
      description={`${sprint.name} — ${SPRINT_MESSAGES.startDescription}`}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form="start-sprint-form" loading={pending}>
            {SPRINT_MESSAGES.start}
          </Button>
        </>
      }
    >
      <form id="start-sprint-form" className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        {submitError ? <Alert variant="error" message={submitError} /> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={SPRINT_MESSAGES.startDateLabel}
            type="date"
            value={values.startDate}
            onChange={updateStartDate}
            error={errors.startDate}
            max={values.endDate || undefined}
            helperText={SPRINT_MESSAGES.startDateHelper}
            disabled={pending}
            data-autofocus
          />
          <TextField
            label={SPRINT_MESSAGES.endDateLabel}
            type="date"
            value={values.endDate}
            onChange={updateEndDate}
            error={errors.endDate}
            min={values.startDate || undefined}
            helperText={SPRINT_MESSAGES.endDateHelper}
            disabled={pending}
          />
        </div>
      </form>
    </Modal>
  );
}
