import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import type { DragEvent } from 'react';
import { Alert } from '../../../components/ui';
import { errorMessage } from '../../../services/client';
import type { SprintBoardResponse, Todo, TodoStatus } from '../../../types/api';
import { TODO_MESSAGES } from '../../backlog/constants/backlog.constants';
import { useProjectStatuses } from '../../projects/context/project-statuses-context';
import { STATUS_DOT_CLASS } from '../../projects/lib/status-meta';
import { useMoveBoardTodo } from '../hooks/use-move-board-todo';
import { boardDropPosition } from '../lib/sprint-meta';
import { SprintBoardCard } from './sprint-board-card';

interface SprintBoardProps {
  projectId: string;
  sprintId: string;
  board: SprintBoardResponse;
  onOpen: (todo: Todo) => void;
}

/**
 * SPR-4 / SPR-5: four status columns for the active sprint.
 *
 * Unlike the backlog, each column has its own `order`, so every move posts both
 * the target `status` and a position inside that column. The optimistic update
 * lives in `useMoveBoardTodo`; this component only decides the target index.
 */
export function SprintBoard({ projectId, sprintId, board, onOpen }: SprintBoardProps) {
  const statuses = useProjectStatuses();
  const moveTodo = useMoveBoardTodo(projectId, sprintId);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<TodoStatus | null>(null);

  const dragging = useMemo(() => {
    if (!draggingId) return undefined;
    for (const status of statuses) {
      const found = (board.columns[status.id] ?? []).find((todo) => todo.id === draggingId);
      if (found) return found;
    }
    return undefined;
  }, [board.columns, draggingId, statuses]);

  function clearDrag() {
    setDraggingId(null);
    setOverId(null);
    setOverColumn(null);
  }

  function move(todo: Todo, status: TodoStatus, position: number) {
    moveTodo.mutate({ todoId: todo.id, status, position });
    clearDrag();
  }

  function handleCardDrop(target: Todo) {
    if (!dragging || dragging.id === target.id) {
      clearDrag();
      return;
    }

    move(
      dragging,
      target.status,
      boardDropPosition(board.columns, dragging.id, target.status, target.id),
    );
  }

  function handleColumnDrop(event: DragEvent<HTMLUListElement>, status: TodoStatus) {
    event.preventDefault();
    if (!dragging) {
      clearDrag();
      return;
    }

    move(dragging, status, boardDropPosition(board.columns, dragging.id, status));
  }

  function changeStatus(todo: Todo, status: TodoStatus) {
    if (todo.status === status) return;
    move(todo, status, (board.columns[status] ?? []).length);
  }

  return (
    <div className="mt-4">
      {moveTodo.error ? (
        <div className="mb-3">
          <Alert
            variant="error"
            message={`Could not move the card. ${errorMessage(moveTodo.error)}`}
            onClose={() => moveTodo.reset()}
          />
        </div>
      ) : null}

      <div
        role="region"
        aria-label="Sprint board"
        className="grid grid-flow-col auto-cols-[minmax(15rem,1fr)] gap-2.5 overflow-x-auto pb-2 lg:grid-flow-row lg:auto-cols-auto lg:grid-cols-4 lg:overflow-visible"
      >
        {statuses.map((status, index) => {
          const columnTodos = board.columns[status.id] ?? [];
          const points = columnTodos.reduce((sum, todo) => sum + (todo.storyPoints ?? 0), 0);
          const isDropColumn = Boolean(dragging) && overColumn === status.id;
          const dot = STATUS_DOT_CLASS[status.color];

          return (
            <motion.section
              key={status.id}
              aria-label={`${status.name} column`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: index * 0.035, ease: [0.22, 1, 0.36, 1] }}
              className={[
                'relative flex min-h-[15rem] flex-col overflow-hidden rounded-lg border bg-muted/30 transition-colors',
                isDropColumn ? 'border-primary/50 bg-primary/[0.03]' : 'border-border',
              ].join(' ')}
            >
              <span
                aria-hidden="true"
                className={['absolute inset-x-0 top-0 h-0.5', dot].join(' ')}
              />

              <header className="flex items-center justify-between gap-2 border-b border-border/80 bg-card/70 px-2.5 py-1.5">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className={['size-2 shrink-0 rounded-full', dot].join(' ')}
                  />
                  <h3 className="truncate text-[11px] font-semibold tracking-[0.1em] text-foreground uppercase">
                    {status.name}
                  </h3>
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
                  if (!draggingId) return;
                  event.preventDefault();
                  setOverColumn(status.id);
                }}
                onDragLeave={(event) => {
                  if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
                  setOverColumn((current) => (current === status.id ? null : current));
                }}
                onDrop={(event) => handleColumnDrop(event, status.id)}
                className="flex flex-1 flex-col gap-1.5 p-1.5"
              >
                {columnTodos.map((todo, index) => (
                  <SprintBoardCard
                    key={todo.id}
                    todo={todo}
                    isFirst={index === 0}
                    isLast={index === columnTodos.length - 1}
                    dragging={draggingId === todo.id}
                    dropTarget={overId === todo.id && draggingId !== todo.id}
                    onOpen={onOpen}
                    onMoveTop={(item) => move(item, status.id, 0)}
                    onMoveBottom={(item) => move(item, status.id, columnTodos.length - 1)}
                    onMoveToStatus={changeStatus}
                    onDragStart={(item) => {
                      moveTodo.reset();
                      setDraggingId(item.id);
                      setOverId(null);
                      setOverColumn(status.id);
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
                  <li className="grid min-h-28 flex-1 place-items-center rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                    {TODO_MESSAGES.emptyColumn}
                  </li>
                ) : null}
              </ul>
            </motion.section>
          );
        })}
      </div>
    </div>
  );
}
