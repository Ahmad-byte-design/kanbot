import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Alert, Button, Modal, TextField, TextareaField } from '../../../components/ui';
import { assetUrl, errorMessage, fieldErrors } from '../../../services/client';
import { PROJECT_ICONS, type ProjectIcon } from '../../../types/api';
import { useTranslation } from '../../../i18n';
import { PROJECT_LIMITS, PROJECT_ROUTES } from '../constants/projects.constants';
import { useBackgrounds } from '../hooks/use-backgrounds';
import { useCreateProject } from '../hooks/use-create-project';
import { useUpdateProject } from '../hooks/use-update-project';
import { zodFieldErrors } from '../../../lib/zod-field-errors';
import { projectIcon, projectBackground } from '../lib/status-meta';
import { suggestProjectKey } from '../lib/project-tone';
import { createProjectSchema, updateProjectSchema } from '../schema/project.schema';
import type { ProjectFormMode, ProjectListItem } from '../types/projects.types';
import { CheckIcon } from '../../../assets/icons';
import { ProjectGlyph } from './project-glyph';

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
  const { t } = useTranslation();
  const backgrounds = useBackgrounds();

  const [values, setValues] = useState({
    name: mode === 'edit' ? (project?.name ?? '') : '',
    key: mode === 'edit' ? (project?.key ?? '') : '',
    description: mode === 'edit' ? (project?.description ?? '') : '',
    background: mode === 'edit' ? projectBackground(project) : null,
    icon: mode === 'edit' ? projectIcon(project) : ('layers' as ProjectIcon),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const pending = createProject.isPending || updateProject.isPending;
  const isEdit = mode === 'edit';
  const suggestion = suggestProjectKey(values.name);

  const keyHelper = isEdit
    ? t('projectForm.keyHintEdit')
    : values.key === ''
      ? `Leave blank — Kanbot will use ${suggestion}.`
      : t('projectForm.keyHintCreate');

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
        background: parsed.data.background ?? null,
        icon: parsed.data.icon,
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
      title={isEdit ? t('projectForm.editTitle') : t('projectForm.createTitle')}
      description={
        isEdit ? t('projectForm.editDescription') : t('projectForm.createDescription')
      }
      footer={
        <>
          <Button type="button" variant="ghost" onClick={close} disabled={pending}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="project-form" loading={pending}>
            {isEdit ? t('common.save') : t('projectForm.create')}
          </Button>
        </>
      }
    >
      <form id="project-form" className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        {submitError ? <Alert variant="error" message={submitError} /> : null}

        <TextField
          label={t('projectForm.name')}
          value={values.name}
          onChange={updateField('name')}
          placeholder={t('projectForm.namePlaceholder')}
          error={errors.name}
          maxLength={PROJECT_LIMITS.nameMax}
          disabled={pending}
          data-autofocus
          autoComplete="off"
        />

        <TextField
          label={t('projectForm.key')}
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
          label={t('projectForm.description')}
          value={values.description}
          onChange={updateField('description')}
          placeholder={t('projectForm.descriptionPlaceholder')}
          error={errors.description}
          meta={`${values.description.length}/${PROJECT_LIMITS.descriptionMax}`}
          maxLength={PROJECT_LIMITS.descriptionMax}
          rows={3}
          disabled={pending}
        />

        <fieldset className="flex flex-col gap-2" disabled={pending}>
          <legend className="text-[13px] font-medium text-foreground">{t('projectForm.background')}</legend>
          <p className="text-xs text-muted-foreground">{t('projectForm.backgroundHint')}</p>
          <div role="radiogroup" aria-label={t('projectForm.background')} className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            <button
              type="button"
              role="radio"
              aria-checked={values.background === null}
              aria-label={t('projectForm.noBackground')}
              onClick={() => setValues((current) => ({ ...current, background: null }))}
              className={[
                'relative grid h-16 place-items-center rounded-lg border bg-muted/40 text-[10px] font-medium text-muted-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                values.background === null ? 'border-primary ring-2 ring-primary/25' : 'border-border hover:border-ring/60',
              ].join(' ')}
            >
              {t('projectForm.noBackground')}
              {values.background === null ? <CheckIcon width={14} height={14} className="absolute top-1 end-1 text-primary" /> : null}
            </button>
            {(backgrounds.data ?? []).map((background) => {
              const src = assetUrl(background.url);
              const active = values.background === background.id;
              return (
                <button
                  key={background.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={background.name}
                  onClick={() => setValues((current) => ({ ...current, background: background.id }))}
                  className={[
                    'relative h-16 overflow-hidden rounded-lg border bg-cover bg-center outline-none transition-[border-color,box-shadow] focus-visible:ring-2 focus-visible:ring-ring',
                    active ? 'border-primary ring-2 ring-primary/25' : 'border-border hover:border-ring/60',
                  ].join(' ')}
                  style={src ? { backgroundImage: `url(${src})` } : undefined}
                >
                  {active ? (
                    <span className="absolute top-1 end-1 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground shadow">
                      <CheckIcon width={12} height={12} />
                    </span>
                  ) : null}
                </button>
              );
            })}
            {backgrounds.isPending ? (
              <span className="grid h-16 place-items-center rounded-lg border border-dashed border-border text-[10px] text-muted-foreground">
                {t('common.loading')}
              </span>
            ) : null}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2" disabled={pending}>
          <legend className="text-[13px] font-medium text-foreground">{t('projectForm.icon')}</legend>
          <p className="text-xs text-muted-foreground">{t('projectForm.iconHint')}</p>
          <div role="radiogroup" aria-label={t('projectForm.icon')} className="flex flex-wrap gap-2">
            {PROJECT_ICONS.map((icon) => {
              const active = values.icon === icon;
              return (
                <button
                  key={icon}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={icon}
                  title={icon}
                  onClick={() => setValues((current) => ({ ...current, icon }))}
                  className={[
                    'grid size-10 place-items-center rounded-lg border outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                    active
                      ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/25'
                      : 'border-border bg-card text-muted-foreground hover:border-ring/60 hover:text-foreground',
                  ].join(' ')}
                >
                  <ProjectGlyph icon={icon} />
                </button>
              );
            })}
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}
