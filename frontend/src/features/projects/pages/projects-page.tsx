import { useState } from 'react';
import { Link } from 'react-router';
import { Alert, Button } from '../../../components/ui';
import { useAuthSession, useLogout } from '../../auth';
import { errorMessage } from '../../../services/client';
import { PROJECT_MESSAGES, PROJECT_ROUTES } from '../constants/projects.constants';
import { useProjects } from '../hooks/use-projects';
import { accountInitials } from '../lib/project-tone';
import type { ProjectListItem } from '../types/projects.types';
import { DeleteProjectDialog } from '../components/delete-project-dialog';
import { PlusIcon } from '../../../assets/icons';
import { ProjectCard } from '../components/project-card';
import { ProjectEmptyState } from '../components/project-empty-state';
import { ProjectFormDialog } from '../components/project-form-dialog';
import { ProjectsSkeleton } from '../components/projects-skeleton';

function SummaryCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-4 py-3 sm:px-5">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-display text-xl font-semibold tabular-nums text-foreground">
        {value}
      </dd>
    </div>
  );
}

/** PRJ-1 / PRJ-2 / PRJ-3 / PRJ-4: the workspace index. */
export function ProjectsPage() {
  const { user } = useAuthSession();
  const logout = useLogout();
  const { data: projects, isPending, error, refetch } = useProjects();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectListItem | null>(null);
  const [deleting, setDeleting] = useState<ProjectListItem | null>(null);

  const list = projects ?? [];
  const backlogTotal = list.reduce((total, project) => total + project.stats.backlogCount, 0);
  const activeSprints = list.filter((project) => project.stats.activeSprint !== null).length;

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b border-border bg-card/75 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link
            to={PROJECT_ROUTES.list}
            className="inline-flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <img src="/kanbot-icon.svg" alt="" className="size-9 rounded-xl shadow-md shadow-primary/15" />
            <span className="font-display text-xl font-semibold tracking-tight text-foreground">
              Kanbot
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm leading-tight font-medium text-foreground">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <span
              aria-hidden="true"
              className="grid size-9 place-items-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground"
            >
              {accountInitials(user?.name, user?.email)}
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={logout}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-12">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {PROJECT_MESSAGES.listTitle}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {PROJECT_MESSAGES.listDescription}
            </p>
          </div>
          <Button
            type="button"
            size="lg"
            className="self-start sm:self-auto"
            onClick={() => setCreateOpen(true)}
          >
            <PlusIcon width={17} height={17} />
            New project
          </Button>
        </div>

        {isPending ? (
          <ProjectsSkeleton />
        ) : error ? (
          <div className="mt-8 max-w-xl">
            <Alert variant="error" message={errorMessage(error)} />
            <Button type="button" variant="outline" className="mt-4" onClick={() => void refetch()}>
              Try again
            </Button>
          </div>
        ) : list.length === 0 ? (
          <div className="mt-8">
            <ProjectEmptyState onCreate={() => setCreateOpen(true)} />
          </div>
        ) : (
          <>
            <dl className="mt-8 grid grid-cols-3 divide-x divide-border overflow-hidden rounded-xl border border-border bg-card">
              <SummaryCell label="Projects" value={list.length} />
              <SummaryCell label="Backlog items" value={backlogTotal} />
              <SummaryCell label="Active sprints" value={activeSprints} />
            </dl>

            <section aria-label="All projects" className="mt-8">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-display text-sm font-semibold text-foreground">All projects</h2>
                <p className="text-xs text-muted-foreground">Last updated first</p>
              </div>

              <ul className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {list.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onEdit={setEditing}
                    onDelete={setDeleting}
                  />
                ))}
              </ul>
            </section>
          </>
        )}
      </main>

      {createOpen ? (
        <ProjectFormDialog mode="create" onClose={() => setCreateOpen(false)} />
      ) : null}

      {editing ? (
        <ProjectFormDialog mode="edit" project={editing} onClose={() => setEditing(null)} />
      ) : null}

      {deleting ? (
        <DeleteProjectDialog project={deleting} onClose={() => setDeleting(null)} />
      ) : null}
    </div>
  );
}
