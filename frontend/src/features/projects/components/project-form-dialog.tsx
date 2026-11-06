import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Alert, Button, Modal, TextField, TextareaField } from '../../../components/ui';
import { errorMessage, fieldErrors } from '../../../services/client';
import { PROJECT_LIMITS, PROJECT_MESSAGES, PROJECT_ROUTES } from '../constants/projects.constants';
import { useCreateProject } from '../hooks/use-create-project';
import { useUpdateProject } from '../hooks/use-update-project';
import { zodFieldErrors } from '../../../lib/zod-field-errors';
import { suggestProjectKey } from '../lib/project-tone';
import { createProjectSchema, updateProjectSchema } from '../schema/project.schema';
import type { ProjectFormMode, ProjectListItem } from '../types/projects.types';

interface ProjectFormDialogProps {
  mode: ProjectFormMode;
  project?: ProjectListItem;
  onClose: () => void;
}

/**
 * PRJ-2 / PRJ-3.
 *
 * Mounted only while open, so the fields always start from the right values
 * without an effect resetting state after paint.
 */
export function ProjectFormDialog({ mode, project, onClose }: ProjectFormDialogProps) {
  const navigate = useNavigate();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();

  const [values, setValues] = useState({
    name: mode === 'edit' ? (project?.name ?? '') : '',
    key: mode === 'edit' ? (project?.key ?? '') : '',
    description: mode === 'edit' ? (project?.description ?? '') : '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const pending = createProject.isPending || updateProject.isPending;
  const isEdit = mode === 'edit';
  const suggestion = suggestProjectKey(values.name);

  const keyHelper = isEdit
    ? PROJECT_MESSAGES.keyHintEdit
    : values.key === ''
      ? `Leave blank — Kanbot will use ${suggestion}.`
      : PROJECT_MESSAGES.keyHintCreate;

  const close = () => {
    if (!pending) onClose();
  };

  const updateField = (field: keyof typeof values) => (value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleKeyChange = (value: string) => {
    updateField('key')(value.slice(0, PROJECT_LIMITS.keyMax));
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    try {
      if (isEdit) {
        if (!project) return;
        const parsed = updateProjectSchema.safeParse(values);
        if (!parsed.success) {
          setErrors(zodFieldErrors(parsed.error));
          return;
        }

        await updateProject.mutateAsync({ projectId: project.id, changes: parsed.data });
        onClose();
        return;
      }

      const parsed = createProjectSchema.safeParse(values);
      if (!parsed.success) {
        setErrors(zodFieldErrors(parsed.error));
        return;
      }

      const created = await createProject.mutateAsync({
        name: parsed.data.name,
        key: parsed.data.key || undefined,
        description: parsed.data.description,
      });

      onClose();
      navigate(PROJECT_ROUTES.backlog(created.id));
    } catch (error) {
      const details = fieldErrors(error);
      setErrors(details);
      if (Object.keys(details).length === 0) {
        setSubmitError(errorMessage(error));
      }
    }
  }

  return (
    <Modal
      open
      onClose={close}
      title={isEdit ? 'Edit project' : 'Create a project'}
      description={
        isEdit
          ? 'Update the name, key or description. The project keeps all of its work.'
          : 'A project holds one backlog, its sprints and todos.'
      }
      footer={
        <>
          <Button type="button" variant="ghost" onClick={close} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form="project-form" loading={pending}>
            {isEdit ? 'Save changes' : 'Create project'}
          </Button>
        </>
      }
    >
      <form id="project-form" className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        {submitError ? <Alert variant="error" message={submitError} /> : null}

        <TextField
          label="Project name"
          value={values.name}
          onChange={updateField('name')}
          placeholder="Mobile app redesign"
          error={errors.name}
          maxLength={PROJECT_LIMITS.nameMax}
          disabled={pending}
          data-autofocus
          autoComplete="off"
        />

        <TextField
          label="Key"
          value={values.key}
          onChange={handleKeyChange}
          placeholder={suggestion}
          error={errors.key}
          helperText={keyHelper}
          maxLength={PROJECT_LIMITS.keyMax}
          disabled={pending}
          autoComplete="off"
          spellCheck={false}
          style={{ textTransform: 'uppercase' }}
          className="sm:max-w-[12rem]"
        />

        <TextareaField
          label="Description"
          value={values.description}
          onChange={updateField('description')}
          placeholder="What is this project for?"
          error={errors.description}
          meta={`${values.description.length}/${PROJECT_LIMITS.descriptionMax}`}
          maxLength={PROJECT_LIMITS.descriptionMax}
          rows={3}
          disabled={pending}
        />
      </form>
    </Modal>
  );
}
