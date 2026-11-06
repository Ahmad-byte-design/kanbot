import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { Alert, Button } from '../../../components/ui';
import { ApiError, errorMessage } from '../../../services/client';
import type { Todo } from '../../../types/api';
import {
  PROJECT_ROUTES,
  ProjectErrorState,
  ProjectShell,
  ProjectWorkspaceHeader,
  ProjectWorkspaceSkeleton,
  projectToneClass,
  useProject,
} from '../../projects';
import { TodoFormDialog } from '../../backlog/components/todo-form-dialog';
import { SummarizeSprintDialog } from '../../ai/components/summarize-sprint-dialog';
import { SPRINT_MESSAGES } from '../constants/sprints.constants';
import { useSprintBoard } from '../hooks/use-sprint-board';
import { useSprints } from '../hooks/use-sprints';
import { findActiveSprint, plannedSprints } from '../lib/sprint-meta';
import { CompleteSprintDialog } from '../components/complete-sprint-dialog';
import { SprintBoard } from '../components/sprint-board';
import { SprintBoardEmptyState } from '../components/sprint-board-empty-state';
import { SprintBoardHeader } from '../components/sprint-board-header';
import { SprintBoardSkeleton } from '../components/sprint-board-skeleton';

/**
 * SPR-4 / SPR-5 / SPR-6: the active sprint board.
 *
 * The active sprint comes from the project's sprint list (the server puts it
 * first). Header numbers read from the board response, so an optimistic move
 * updates the progress bar before the request finishes.
 */
export function ProjectBoardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project, isPending, error, refetch } = useProject(projectId);
  const sprints = useSprints(projectId);

  const activeSprint = findActiveSprint(sprints.data ?? []);
  const board = useSprintBoard(projectId, activeSprint?.id);
  const planned = plannedSprints(sprints.data ?? []);

  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

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

  const sprint = board.data?.sprint ?? activeSprint;
  const boardFailed = Boolean(board.error);

  return (
    <ProjectShell project={project}>
      <div className={projectToneClass(project.id)}>
        <ProjectWorkspaceHeader project={project} />

        <main className="px-5 py-8 sm:px-8">
          {sprints.isPending ? (
            <SprintBoardSkeleton />
          ) : sprints.error ? (
            <div className="rounded-2xl border border-border bg-card px-6 py-10 text-center">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Could not load the sprint
              </h2>
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
          ) : !sprint ? (
            <SprintBoardEmptyState projectId={project.id} plannedCount={planned.length} />
          ) : board.isPending && !board.data ? (
            <SprintBoardSkeleton />
          ) : boardFailed || !board.data ? (
            <div className="rounded-2xl border border-border bg-card px-6 py-10 text-center">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Could not load the board
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                {errorMessage(board.error, 'The sprint board could not be loaded.')}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Button type="button" variant="outline" onClick={() => void board.refetch()}>
                  Try again
                </Button>
                <Link
                  to={PROJECT_ROUTES.sprints(project.id)}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {SPRINT_MESSAGES.pageTitle}
                </Link>
              </div>
            </div>
          ) : (
            <>
              {board.error ? (
                <div className="mb-3">
                  <Alert
                    variant="error"
                    message={`Could not refresh the board. ${errorMessage(board.error)}`}
                    onClose={() => void board.refetch()}
                  />
                </div>
              ) : null}

              <SprintBoardHeader
                projectId={project.id}
                sprint={board.data.sprint}
                onComplete={() => setCompleteOpen(true)}
                onSummarize={() => setSummaryOpen(true)}
              />
              <SprintBoard
                projectId={project.id}
                sprintId={board.data.sprint.id}
                board={board.data}
                onOpen={setEditingTodo}
              />
            </>
          )}
        </main>
      </div>

      {completeOpen && board.data ? (
        <CompleteSprintDialog
          projectId={project.id}
          sprint={board.data.sprint}
          plannedSprints={planned}
          onClose={() => setCompleteOpen(false)}
        />
      ) : null}

      {summaryOpen && board.data ? (
        <SummarizeSprintDialog
          projectId={project.id}
          initialSprintId={board.data.sprint.id}
          onClose={() => setSummaryOpen(false)}
        />
      ) : null}

      {editingTodo ? (
        <TodoFormDialog
          key={editingTodo.id}
          projectId={project.id}
          todo={editingTodo}
          sprints={sprints.data ?? []}
          sprintsPending={sprints.isPending}
          onClose={() => setEditingTodo(null)}
        />
      ) : null}
    </ProjectShell>
  );
}
