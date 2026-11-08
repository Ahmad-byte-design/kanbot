import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import type { DragEvent } from 'react';
import { Alert } from '../../../components/ui';
import { errorMessage } from '../../../services/client';
import type { Sprint, Todo, TodoStatus } from '../../../types/api';
import { TODO_MESSAGES } from '../constants/backlog.constants';
import { useProjectStatuses } from '../../projects/context/project-statuses-context';
import { STATUS_DOT_CLASS } from '../../projects/lib/status-meta';
import { useMoveTodo } from '../hooks/use-move-todo';
import { columnEdgePosition, dropPosition, groupByStatus } from '../lib/todo-meta';
import { TodoCard } from './todo-card';

interface BacklogBoardProps {
  projectId: string;
  todos: Todo[];
  sprints: Sprint[];
  canReorder: boolean;
  reorderHint: string;
  onOpen: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
  onMoveToStatus: (todo: Todo, status: TodoStatus) => void;
  onMoveToSprint: (todo: Todo, sprintId: string) => void;
}

/**
 * BL-1 / BL-5 / BL-7: the backlog as a status-grouped list.
 *
 * The backlog is a single ordered list on the server, so status sections are a
 * filtered view of that order. Dropping inside a section posts a new global
 * position; dropping into another section only changes status.
 */
export function BacklogBoard({
  projectId,
  todos,
  sprints,
  canReorder,
  reorderHint,
  onOpen,
  onDelete,
  onMoveToStatus,
  onMoveToSprint,
}: BacklogBoardProps) {
  const statuses = useProjectStatuses();
  const moveTodo = useMoveTodo(projectId);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<TodoStatus | null>(null);

  const columns = useMemo(
    () => groupByStatus(todos, statuses.map((status) => status.id)),
    [todos, statuses],
  );
  const draggingTodo = draggingId ? todos.find((todo) => todo.id === draggingId) : undefined;

  function clearDrag() {
    setDraggingId(null);
    setOverId(null);
    setOverColumn(null);
  }

  function moveTo(todoId: string, position: number) {
    moveTodo.mutate({ todoId, position });
  }

  function changeStatus(todo: Todo, status: TodoStatus) {
    if (todo.status === status) return;
    onMoveToStatus(todo, status);
  }

  function handleCardDrop(target: Todo) {
    if (!canReorder || !draggingTodo) {
      clearDrag();
      return;
    }
    if (draggingTodo.id === target.id) {
      clearDrag();
      return;
    }

    if (draggingTodo.status === target.status) {
      moveTo(draggingTodo.id, dropPosition(todos, draggingTodo.id, target.id));
    } else {
      changeStatus(draggingTodo, target.status);
    }

    clearDrag();
  }

  function handleColumnDrop(event: DragEvent<HTMLUListElement>, status: TodoStatus) {
    event.preventDefault();
    if (!canReorder || !draggingTodo) {
      clearDrag();
      return;
    }

    if (draggingTodo.status === status) {
      moveTo(draggingTodo.id, columnEdgePosition(todos, draggingTodo.id, 'bottom'));
    } else {
      changeStatus(draggingTodo, status);
    }

    clearDrag();
  }

  return (
    <div>
      {moveTodo.error ? (
        <div className="border-b border-border px-3 py-3 sm:px-5">
          <Alert
            variant="error"
            message={`Could not reorder the backlog. ${errorMessage(moveTodo.error)}`}
            onClose={() => moveTodo.reset()}
          />
        </div>
      ) : null}

      <div className="border-t border-border bg-board p-2 sm:p-3">
        <div
          role="region"
          aria-label={TODO_MESSAGES.boardLabel}
          className="mx-auto flex max-w-5xl flex-col gap-2.5"
        >
          {statuses.map((status, index) => {
            const columnTodos = columns[status.id] ?? [];
            const points = columnTodos.reduce((sum, todo) => sum + (todo.storyPoints ?? 0), 0);
            const isDropColumn = Boolean(draggingTodo) && overColumn === status.id;
            const dot = STATUS_DOT_CLASS[status.color];

            return (
              <motion.section
                key={status.id}
                aria-label={`${status.name} column`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: index * 0.035, ease: [0.22, 1, 0.36, 1] }}
                className={[
                  'relative overflow-hidden rounded-lg border bg-card/60 transition-colors',
                  isDropColumn ? 'border-primary/50 bg-primary/[0.03]' : 'border-border',
                ].join(' ')}
              >
                <header className="flex items-center justify-between gap-2 border-b border-border/80 bg-card/70 px-2.5 py-1.5">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span aria-hidden="true" className={['size-2 shrink-0 rounded-full', dot].join(' ')} />
                    <h3 className="truncate text-[11px] font-semibold tracking-[0.1em] text-foreground uppercase">
                      {status.name}
                    </h3>
                    {status.done ? (
                      <span className="rounded-full bg-success/10 px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.08em] text-success uppercase">
                        Done
                      </span>
                    ) : null}
                    <span className="ms-0.5 rounded-full bg-background px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground ring-1 ring-border">
                      {columnTodos.length}
                    </span>
                  </div>

                  <span
                    className="shrink-0 text-[11px] font-medium tabular-nums text-muted-foreground"
                    title={`${points} story points`}
                  >
                    {points} pts
                  </span>
                </header>

                <ul
                  aria-label={`${status.name} todos`}
                  onDragOver={(event) => {
                    if (!canReorder || !draggingId) return;
                    event.preventDefault();
                    setOverColumn(status.id);
                  }}
                  onDragLeave={(event) => {
                    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
                    setOverColumn((current) => (current === status.id ? null : current));
                  }}
                  onDrop={(event) => handleColumnDrop(event, status.id)}
                  className="flex flex-col gap-1 p-1.5"
                >
                  {columnTodos.map((todo, todoIndex) => (
                    <TodoCard
                      key={todo.id}
                      todo={todo}
                      sprints={sprints}
                      canReorder={canReorder}
                      reorderHint={reorderHint}
                      isFirst={todoIndex === 0}
                      isLast={todoIndex === columnTodos.length - 1}
                      dragging={draggingId === todo.id}
                      dropTarget={overId === todo.id && draggingId !== todo.id}
                      onOpen={onOpen}
                      onDelete={onDelete}
                      onMoveTop={(item) => moveTo(item.id, columnEdgePosition(todos, item.id, 'top'))}
                      onMoveBottom={(item) =>
                        moveTo(item.id, columnEdgePosition(todos, item.id, 'bottom'))
                      }
                      onMoveToStatus={onMoveToStatus}
                      onMoveToSprint={onMoveToSprint}
                      onDragStart={(item) => {
                        moveTodo.reset();
                        setDraggingId(item.id);
                      }}
                      onDragEnd={clearDrag}
                      onDragOver={(item) => {
                        if (!draggingId || draggingId === item.id) return;
                        setOverId(item.id);
                        setOverColumn(status.id);
                      }}
                      onDragLeave={(item) => {
                        setOverId((current) => (current === item.id ? null : current));
                      }}
                      onDrop={handleCardDrop}
                    />
                  ))}

                  {columnTodos.length === 0 ? (
                    <li className="grid min-h-11 place-items-center rounded-md border border-dashed border-border px-3 py-3 text-center text-xs text-muted-foreground">
                      {TODO_MESSAGES.emptyColumn}
                    </li>
                  ) : null}
                </ul>
              </motion.section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
