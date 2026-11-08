import { useState, type FormEvent } from 'react';
import { useParams } from 'react-router';
import { Alert, Button, Modal, TextField } from '../../../components/ui';
import { errorMessage } from '../../../services/client';
import { useTranslation, type TranslationKey } from '../../../i18n';
import type { ProjectStatus, StatusColor } from '../../../types/api';
import { ProjectErrorState } from '../components/project-error-state';
import { ProjectFormDialog } from '../components/project-form-dialog';
import { ProjectShell } from '../components/project-shell';
import { ProjectWorkspaceHeader } from '../components/project-workspace-header';
import { ProjectWorkspaceSkeleton } from '../components/projects-skeleton';
import { projectToneClass } from '../lib/project-tone';
import { useProject } from '../hooks/use-project';
import { PlusIcon, PencilIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon } from '../../../assets/icons';
import { PROJECT_ROUTES } from '../constants/projects.constants';
import {
  useCreateStatus,
  useDeleteStatus,
  useUpdateStatus,
} from '../hooks/use-project-statuses';
import {
  STATUS_COLORS,
  STATUS_DOT_CLASS,
  normalizeProjectStatuses,
} from '../lib/status-meta';

const COLOR_LABEL_KEYS: Record<StatusColor, TranslationKey> = {
  slate: 'statuses.colorSlate',
  blue: 'statuses.colorBlue',
  violet: 'statuses.colorViolet',
  green: 'statuses.colorGreen',
  amber: 'statuses.colorAmber',
  rose: 'statuses.colorRose',
  teal: 'statuses.colorTeal',
  indigo: 'statuses.colorIndigo',
};

interface StatusFormDialogProps {
  projectId: string;
  status?: ProjectStatus;
  onClose: () => void;
}

function StatusFormDialog({ projectId, status, onClose }: StatusFormDialogProps) {
  const { t } = useTranslation();
  const createStatus = useCreateStatus(projectId);
  const updateStatus = useUpdateStatus(projectId);
  const [name, setName] = useState(status?.name ?? '');
  const [color, setColor] = useState<StatusColor>(status?.color ?? 'slate');
  const [done, setDone] = useState(status?.done ?? false);
  const [error, setError] = useState<string | null>(null);
  const pending = createStatus.isPending || updateStatus.isPending;
  const isEdit = Boolean(status);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError(t('statuses.nameRequired'));
      return;
    }

    try {
      if (status) {
        await updateStatus.mutateAsync({
          statusId: status.id,
          changes: { name: name.trim(), color, done },
        });
      } else {
        await createStatus.mutateAsync({ name: name.trim(), color, done });
      }
      onClose();
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  return (
    <Modal
      open
      onClose={() => {
        if (!pending) onClose();
      }}
      title={isEdit ? t('statuses.editTitle') : t('statuses.addTitle')}
      description={t('statuses.description')}
      size="sm"
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="status-form" loading={pending}>
            {isEdit ? t('common.save') : t('statuses.add')}
          </Button>
        </>
      }
    >
      <form id="status-form" className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        {error ? <Alert variant="error" message={error} /> : null}

        <TextField
          label={t('statuses.name')}
          value={name}
          onChange={setName}
          placeholder={t('statuses.namePlaceholder')}
          maxLength={40}
          disabled={pending}
          data-autofocus
          autoComplete="off"
        />

        <fieldset className="flex flex-col gap-2" disabled={pending}>
          <legend className="text-[13px] font-medium text-foreground">{t('statuses.color')}</legend>
          <div role="radiogroup" aria-label={t('statuses.color')} className="flex flex-wrap gap-2">
            {STATUS_COLORS.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={color === option}
                aria-label={t(COLOR_LABEL_KEYS[option])}
                title={t(COLOR_LABEL_KEYS[option])}
                onClick={() => setColor(option)}
                className={[
                  'size-8 rounded-full outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring',
                  STATUS_DOT_CLASS[option],
                  color === option ? 'ring-2 ring-foreground ring-offset-2 ring-offset-card' : '',
                ].join(' ')}
              />
            ))}
          </div>
        </fieldset>

        <label className="flex items-start gap-2.5 rounded-lg border border-border p-3 text-sm">
          <input
            type="checkbox"
            checked={done}
            onChange={(event) => setDone(event.target.checked)}
            disabled={pending}
            className="mt-0.5 size-4 accent-primary"
          />
          <span>
            <span className="block font-medium text-foreground">{t('statuses.done')}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {t('statuses.doneHint')}
            </span>
          </span>
        </label>
      </form>
    </Modal>
  );
}

/** `/projects/:projectId/statuses` — add, rename, recolour, reorder and remove board columns. */
export function ProjectStatusesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { t } = useTranslation();
  const { data: project, isPending, error, refetch } = useProject(projectId);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectStatus | null>(null);
  const [deleting, setDeleting] = useState<ProjectStatus | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [projectEditOpen, setProjectEditOpen] = useState(false);

  const updateStatus = useUpdateStatus(projectId ?? '');
  const deleteStatus = useDeleteStatus(projectId ?? '');

  if (isPending) return <ProjectWorkspaceSkeleton />;

  if (!project) {
    return (
      <ProjectErrorState
        notFound={false}
        message={errorMessage(error, 'The project could not be loaded.')}
        onRetry={() => void refetch()}
      />
    );
  }

  const statuses = normalizeProjectStatuses(project);

  async function move(status: ProjectStatus, direction: -1 | 1) {
    const index = statuses.findIndex((item) => item.id === status.id);
    const target = index + direction;
    if (target < 0 || target >= statuses.length) return;
    setActionError(null);

    try {
      await updateStatus.mutateAsync({
        statusId: status.id,
        changes: { order: target },
      });
    } catch (caught) {
      setActionError(errorMessage(caught));
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setActionError(null);
    try {
      await deleteStatus.mutateAsync(deleting.id);
      setDeleting(null);
    } catch (caught) {
      setActionError(errorMessage(caught));
    }
  }

  return (
    <ProjectShell project={project}>
      <div className={projectToneClass(project.id)}>
        <ProjectWorkspaceHeader
          project={project}
          actions={
            <Button type="button" size="sm" onClick={() => setFormOpen(true)}>
              <PlusIcon width={15} height={15} />
              {t('statuses.add')}
            </Button>
          }
        />

        <main className="mx-auto max-w-3xl px-3 py-6 sm:px-5">
          <header className="max-w-2xl">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-primary uppercase">
              {PROJECT_ROUTES.statuses(project.id)}
            </p>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground">
              {t('statuses.title')}
            </h1>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
              {t('statuses.description')}
            </p>
          </header>

          {actionError ? (
            <div className="mt-4">
              <Alert variant="error" message={actionError} onClose={() => setActionError(null)} />
            </div>
          ) : null}

          <ul className="mt-5 flex flex-col gap-2">
            {statuses.map((status, index) => (
              <li
                key={status.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 shadow-[0_1px_1px_rgba(9,30,66,0.06)]"
              >
                <span
                  aria-hidden="true"
                  className={['size-2.5 shrink-0 rounded-full', STATUS_DOT_CLASS[status.color]].join(' ')}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{status.name}</p>
                  <p className="text-[11px] text-muted-foreground">{status.id}</p>
                </div>
                {status.done ? (
                  <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
                    {t('statuses.doneBadge')}
                  </span>
                ) : null}

                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    aria-label={`${t('statuses.moveUp')}: ${status.name}`}
                    title={t('statuses.moveUp')}
                    disabled={index === 0 || updateStatus.isPending}
                    onClick={() => void move(status, -1)}
                    className="grid size-7 place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-30"
                  >
                    <ArrowUpIcon width={14} height={14} />
                  </button>
                  <button
                    type="button"
                    aria-label={`${t('statuses.moveDown')}: ${status.name}`}
                    title={t('statuses.moveDown')}
                    disabled={index === statuses.length - 1 || updateStatus.isPending}
                    onClick={() => void move(status, 1)}
                    className="grid size-7 place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-30"
                  >
                    <ArrowDownIcon width={14} height={14} />
                  </button>
                  <button
                    type="button"
                    aria-label={`${t('statuses.editTitle')}: ${status.name}`}
                    title={t('statuses.editTitle')}
                    onClick={() => setEditing(status)}
                    className="grid size-7 place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <PencilIcon width={14} height={14} />
                  </button>
                  <button
                    type="button"
                    aria-label={`${t('statuses.delete')}: ${status.name}`}
                    title={t('statuses.delete')}
                    disabled={statuses.length <= 1}
                    onClick={() => {
                      setActionError(null);
                      setDeleting(status);
                    }}
                    className="grid size-7 place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-30"
                  >
                    <TrashIcon width={14} height={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {statuses.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">{t('statuses.empty')}</p>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" size="sm" onClick={() => setProjectEditOpen(true)}>
              {t('projectForm.editTitle')}
            </Button>
          </div>
        </main>
      </div>

      {formOpen ? (
        <StatusFormDialog projectId={project.id} onClose={() => setFormOpen(false)} />
      ) : null}

      {editing ? (
        <StatusFormDialog
          key={editing.id}
          projectId={project.id}
          status={editing}
          onClose={() => setEditing(null)}
        />
      ) : null}

      {deleting ? (
        <Modal
          open
          onClose={() => setDeleting(null)}
          title={t('statuses.deleteTitle', { name: deleting.name })}
          description={t('statuses.deleteWarning')}
          size="sm"
          footer={
            <>
              <Button type="button" variant="ghost" onClick={() => setDeleting(null)}>
                {t('common.cancel')}
              </Button>
              <Button
                type="button"
                variant="destructive"
                loading={deleteStatus.isPending}
                onClick={() => void confirmDelete()}
              >
                {t('statuses.delete')}
              </Button>
            </>
          }
        >
          {actionError ? <Alert variant="error" message={actionError} /> : null}
        </Modal>
      ) : null}

      {projectEditOpen ? (
        <ProjectFormDialog mode="edit" project={project} onClose={() => setProjectEditOpen(false)} />
      ) : null}
    </ProjectShell>
  );
}
