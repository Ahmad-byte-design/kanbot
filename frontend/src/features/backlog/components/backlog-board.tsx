import { useMemo, useState } from 'react';
import type { DragEvent } from 'react';
import { Alert } from '../../../components/ui';
import { errorMessage } from '../../../services/client';
import type { Sprint, Todo, TodoStatus } from '../../../types/api';
import {
  TODO_MESSAGES,
  TODO_STATUS_DOTS,
  TODO_STATUS_OPTIONS,
} from '../constants/backlog.constants';
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
 * BL-1 / BL-5 / BL-7: the backlog as a kanban board.
 *
 * The backlog is a single ordered list on the server, so columns are a filtered
 * view of that order. Dropping inside a column posts a new global position;
 * dropping into another column only changes status, exactly as the API allows.
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
  const moveTodo = useMoveTodo(projectId);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<TodoStatus | null>(null);

  const columns = useMemo(() => groupByStatus(todos), [todos]);
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

      <div className="border-t border-border bg-muted/25 p-3 sm:p-4">
        <div
          role="region"
          aria-label={TODO_MESSAGES.boardLabel}
          className="grid grid-flow-col auto-cols-[minmax(16rem,1fr)] gap-3 overflow-x-auto pb-1 lg:grid-flow-row lg:auto-cols-auto lg:grid-cols-4 lg:overflow-visible"
        >
          {TODO_STATUS_OPTIONS.map(({ value: status, label }) => {
            const columnTodos = columns[status];
            const points = columnTodos.reduce((sum, todo) => sum + (todo.storyPoints ?? 0), 0);
            const isDropColumn = Boolean(draggingTodo) && overColumn === status;

            return (
              <section
                key={status}
                aria-label={`${label} column`}
                className={[
                  'relative flex min-h-[13rem] flex-col overflow-hidden rounded-xl border bg-background/70 transition-colors',
                  isDropColumn ? 'border-primary/50 bg-primary/[0.03]' : 'border-border',
                ].join(' ')}
              >
                <span
                  aria-hidden="true"
                  className={['absolute inset-x-0 top-0 h-0.5', TODO_STATUS_DOTS[status]].join(' ')}
                />

                <header className="flex items-center justify-between gap-2 border-b border-border/80 bg-card/50 px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className={['size-2 shrink-0 rounded-full', TODO_STATUS_DOTS[status]].join(' ')}
                    />
                    <h3 className="truncate text-[11px] font-semibold tracking-[0.1em] text-foreground uppercase">
                      {label}
                    </h3>
                    <span className="ml-0.5 rounded-full bg-background px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground ring-1 ring-border">
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
                  aria-label={`${label} todos`}
                  onDragOver={(event) => {
                    if (!canReorder || !draggingId) return;
                    event.preventDefault();
                    setOverColumn(status);
                  }}
                  onDragLeave={(event) => {
                    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
                    setOverColumn((current) => (current === status ? null : current));
                  }}
                  onDrop={(event) => handleColumnDrop(event, status)}
                  className="flex flex-1 flex-col gap-2 p-2"
                >
                  {columnTodos.map((todo, index) => (
                    <TodoCard
                      key={todo.id}
                      todo={todo}
                      sprints={sprints}
                      canReorder={canReorder}
                      reorderHint={reorderHint}
                      isFirst={index === 0}
                      isLast={index === columnTodos.length - 1}
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
                        setOverColumn(status);
                      }}
                      onDragLeave={(item) => {
                        setOverId((current) => (current === item.id ? null : current));
                      }}
                      onDrop={handleCardDrop}
                    />
                  ))}

                  {columnTodos.length === 0 ? (
                    <li className="grid min-h-24 flex-1 place-items-center rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                      {TODO_MESSAGES.emptyColumn}
                    </li>
                  ) : null}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
