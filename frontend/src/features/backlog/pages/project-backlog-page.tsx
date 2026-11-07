import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { Alert, Button } from '../../../components/ui';
import { ApiError, errorMessage } from '../../../services/client';
import type { Todo } from '../../../types/api';
import {
  DeleteProjectDialog,
  ProjectErrorState,
  ProjectFormDialog,
  ProjectShell,
  ProjectWorkspaceHeader,
  ProjectWorkspaceSkeleton,
  projectToneClass,
  useProject,
} from '../../projects';
import { PencilIcon, TrashIcon } from '../../../assets/icons';
import { BacklogBoard } from '../components/backlog-board';
import { BacklogEmptyState } from '../components/backlog-empty-state';
import { BacklogFilters } from '../components/backlog-filters';
import { BacklogQuickCreate } from '../components/backlog-quick-create';
import { BacklogSkeleton } from '../components/backlog-skeleton';
import { BacklogSummary } from '../components/backlog-summary';
import { DeleteTodoDialog } from '../components/delete-todo-dialog';
import { TodoFormDialog } from '../components/todo-form-dialog';
import {
  EMPTY_TODO_FILTERS,
  QUICK_CREATE_INPUT_ID,
  TODO_MESSAGES,
} from '../constants/backlog.constants';
import { useBacklog } from '../hooks/use-backlog';
import { useSprintOptions } from '../hooks/use-sprint-options';
import { useUpdateTodo } from '../hooks/use-update-todo';
import {
  hasActiveFilters,
  selectableSprints,
  todoMatches,
  totalPoints,
} from '../lib/todo-meta';
import type { TodoFilters } from '../types/todo.types';
import { PlannedSprints } from '../../sprints/components/planned-sprints';
import { useProjectTodos } from '../../sprints/hooks/use-project-todos';
import { findActiveSprint } from '../../sprints/lib/sprint-meta';
import { useAssistantStore } from '../../ai/store/assistant.store';

const EMPTY_TODOS: Todo[] = [];

/**
 * BL-1…BL-7: the project backlog.
 *
 * Search and filters run locally for instant feedback; everything that changes
 * the server (create, edit, move, reorder, delete) goes through a mutation that
 * keeps the backlog and the project counters in step.
 */
export function ProjectBacklogPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project, isPending, error, refetch } = useProject(projectId);
  const backlog = useBacklog(projectId);
  const sprints = useSprintOptions(projectId);
  const projectTodos = useProjectTodos(projectId);
  const updateTodo = useUpdateTodo(projectId ?? '');
  const openAiDialog = useAssistantStore((state) => state.openDialog);

  const [filters, setFilters] = useState<TodoFilters>(EMPTY_TODO_FILTERS);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [deletingTodo, setDeletingTodo] = useState<Todo | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const todos = backlog.data ?? EMPTY_TODOS;
  const filtered = hasActiveFilters(filters);
  const visibleTodos = useMemo(
    () => (filtered ? todos.filter((todo) => todoMatches(todo, filters)) : todos),
    [todos, filters, filtered],
  );

  const visiblePoints = totalPoints(visibleTodos);
  const allPoints = totalPoints(todos);
  const sprintChoices = selectableSprints(sprints.data ?? []);
  const activeSprint = findActiveSprint(sprints.data ?? []);
  const plannedTodoGroups = useMemo(() => {
    const groups = new Map<string, Todo[]>();

    for (const todo of projectTodos.data ?? []) {
      if (!todo.sprintId) continue;
      const group = groups.get(todo.sprintId);
      if (group) group.push(todo);
      else groups.set(todo.sprintId, [todo]);
    }

    return groups;
  }, [projectTodos.data]);

  function focusQuickCreate() {
    document.getElementById(QUICK_CREATE_INPUT_ID)?.focus();
  }

  function handleCreated() {
    if (filtered) setFilters(EMPTY_TODO_FILTERS);
  }

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

  return (
    <ProjectShell project={project}>
      <div className={projectToneClass(project.id)}>
        <ProjectWorkspaceHeader
          project={project}
          showActiveSprint
          actions={
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label="Edit project"
                onClick={() => setEditOpen(true)}
              >
                <PencilIcon width={14} height={14} />
                <span className="hidden sm:inline">Edit project</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="Delete project"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <TrashIcon width={14} height={14} />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </>
          }
        />

        <motion.main
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="px-3 py-4 sm:px-5"
      >
          <PlannedSprints
            projectId={project.id}
            sprints={sprints.data ?? []}
            sprintsPending={sprints.isPending}
            sprintsError={Boolean(sprints.error)}
            onRetrySprints={() => void sprints.refetch()}
            activeSprintName={activeSprint?.name}
            todosBySprint={plannedTodoGroups}
            todosPending={projectTodos.isPending}
            todosError={Boolean(projectTodos.error)}
            onOpenTodo={(todo) => {
              updateTodo.reset();
              setEditingTodo(todo);
            }}
          />

          <section
            aria-label={TODO_MESSAGES.heading}
            className="mt-4 overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_1px_rgba(9,30,66,0.08)]"
          >
            <BacklogSummary
              totalCount={todos.length}
              totalPoints={allPoints}
              visibleCount={visibleTodos.length}
              visiblePoints={visiblePoints}
              filtered={filtered}
            />

            <BacklogQuickCreate projectId={project.id} onCreated={handleCreated} />

            <BacklogFilters
              filters={filters}
              onChange={(patch) => setFilters((current) => ({ ...current, ...patch }))}
              onClear={() => setFilters(EMPTY_TODO_FILTERS)}
              resultCount={visibleTodos.length}
              totalCount={todos.length}
            />

            {updateTodo.error && !editingTodo ? (
              <div className="border-b border-border px-3 py-3 sm:px-5">
                <Alert
                  variant="error"
                  message={`Could not move the todo. ${errorMessage(updateTodo.error)}`}
                  onClose={() => updateTodo.reset()}
                />
              </div>
            ) : null}

            {backlog.isPending ? (
              <BacklogSkeleton />
            ) : backlog.error ? (
              <div className="px-5 py-12 text-center sm:px-8">
                <h3 className="font-display text-lg font-semibold text-foreground">
                  Could not load the backlog
                </h3>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                  {errorMessage(backlog.error)}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-5"
                  onClick={() => void backlog.refetch()}
                >
                  Try again
                </Button>
              </div>
            ) : todos.length === 0 ? (
              <BacklogEmptyState
                filtered={false}
                onCreate={focusQuickCreate}
                onClearFilters={() => setFilters(EMPTY_TODO_FILTERS)}
                onGenerate={() => openAiDialog('generate-todos')}
              />
            ) : visibleTodos.length === 0 ? (
              <BacklogEmptyState
                filtered
                onCreate={focusQuickCreate}
                onClearFilters={() => setFilters(EMPTY_TODO_FILTERS)}
                onGenerate={() => openAiDialog('generate-todos')}
              />
            ) : (
              <BacklogBoard
                projectId={project.id}
                todos={visibleTodos}
                sprints={sprintChoices}
                canReorder={!filtered}
                reorderHint={TODO_MESSAGES.dragDisabled}
                onOpen={(todo) => {
                  updateTodo.reset();
                  setEditingTodo(todo);
                }}
                onDelete={setDeletingTodo}
                onMoveToStatus={(todo, status) =>
                  updateTodo.mutate({ todoId: todo.id, changes: { status } })
                }
                onMoveToSprint={(todo, sprintId) =>
                  updateTodo.mutate({ todoId: todo.id, changes: { sprintId } })
                }
              />
            )}
          </section>
        </motion.main>
      </div>

      {editOpen ? (
        <ProjectFormDialog mode="edit" project={project} onClose={() => setEditOpen(false)} />
      ) : null}

      {deleteOpen ? (
        <DeleteProjectDialog project={project} onClose={() => setDeleteOpen(false)} />
      ) : null}

      {editingTodo ? (
        <TodoFormDialog
          key={editingTodo.id}
          projectId={project.id}
          todo={editingTodo}
          sprints={sprintChoices}
          sprintsPending={sprints.isPending}
          onClose={() => {
            updateTodo.reset();
            setEditingTodo(null);
          }}
        />
      ) : null}

      {deletingTodo ? (
        <DeleteTodoDialog
          projectId={project.id}
          todo={deletingTodo}
          onClose={() => setDeletingTodo(null)}
        />
      ) : null}
    </ProjectShell>
  );
}
