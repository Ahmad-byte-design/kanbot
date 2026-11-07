import { motion } from 'framer-motion';
import { useState } from 'react';
import { useParams } from 'react-router';
import { Button } from '../../../components/ui';
import { ApiError, errorMessage } from '../../../services/client';
import {
  ProjectErrorState,
  ProjectShell,
  ProjectWorkspaceHeader,
  ProjectWorkspaceSkeleton,
  projectToneClass,
  useProject,
} from '../../projects';
import { PlusIcon, SprintIcon } from '../../../assets/icons';
import { SPRINT_MESSAGES } from '../constants/sprints.constants';
import { useSprints } from '../hooks/use-sprints';
import { SprintFormDialog } from '../components/sprint-form-dialog';
import { SprintHistoryCard } from '../components/sprint-history-card';

/**
 * SPR-7: the sprint archive. Active first, then planned, then completed — the
 * order the server already returns, so history reads newest-first.
 */
export function ProjectSprintsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project, isPending, error, refetch } = useProject(projectId);
  const sprints = useSprints(projectId);
  const [createOpen, setCreateOpen] = useState(false);

  if (isPending) return <ProjectWorkspaceSkeleton />;

  if (!project) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <ProjectErrorState
        notFound={notFound}
        message={errorMessage(error, 'The project could not be loaded.')}
        onRetry={() => void refetch()}
      />
    );
  }

  const list = sprints.data ?? [];

  return (
    <ProjectShell project={project}>
      <div className={projectToneClass(project.id)}>
        <ProjectWorkspaceHeader project={project} />

        <motion.main
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="px-3 py-4 sm:px-5"
      >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
                {SPRINT_MESSAGES.pageTitle}
              </h2>
              <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-muted-foreground">
                {SPRINT_MESSAGES.pageDescription}
              </p>
            </div>

            <Button type="button" onClick={() => setCreateOpen(true)}>
              <PlusIcon width={16} height={16} />
              {SPRINT_MESSAGES.create}
            </Button>
          </div>

          {sprints.isPending ? (
            <div className="mt-6 space-y-3" aria-hidden="true">
              {[0, 1, 2].map((row) => (
                <div
                  key={row}
                  className="h-20 animate-pulse rounded-lg border border-border bg-card"
                />
              ))}
            </div>
          ) : sprints.error ? (
            <div className="mt-4 rounded-lg border border-border bg-card px-6 py-8 text-center">
              <h3 className="font-display text-lg font-semibold text-foreground">
                Could not load the sprints
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                {errorMessage(sprints.error)}
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-5"
                onClick={() => void sprints.refetch()}
              >
                Try again
              </Button>
            </div>
          ) : list.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-border bg-card/70 px-6 py-10 text-center">
              <span className="mx-auto grid size-10 place-items-center rounded-lg border border-border bg-background text-muted-foreground">
                <SprintIcon width={22} height={22} />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                {SPRINT_MESSAGES.historyEmptyTitle}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                {SPRINT_MESSAGES.historyEmptyDescription}
              </p>
            </div>
          ) : (
            <section aria-label="All sprints" className="mt-4">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                  All sprints
                </h3>
                <p className="text-[11px] tabular-nums text-muted-foreground">
                  {list.length} {list.length === 1 ? 'sprint' : 'sprints'}
                </p>
              </div>

              <div className="mt-2.5 space-y-2.5">
                {list.map((sprint) => (
                  <SprintHistoryCard key={sprint.id} projectId={project.id} sprint={sprint} />
                ))}
              </div>
            </section>
          )}
        </motion.main>
      </div>

      {createOpen ? (
        <SprintFormDialog
          mode="create"
          projectId={project.id}
          sprints={list}
          onClose={() => setCreateOpen(false)}
        />
      ) : null}
    </ProjectShell>
  );
}
