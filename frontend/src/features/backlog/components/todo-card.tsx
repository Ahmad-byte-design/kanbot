import type { DragEvent } from 'react';
import type { Sprint, Todo, TodoStatus } from '../../../types/api';
import { formatDueDate, isOverdue } from '../lib/todo-meta';
import { CalendarIcon, GripIcon } from '../../../assets/icons';
import { TodoCardMenu } from './todo-card-menu';
import { LabelChip, PointsBadge, PriorityTag, TypeTag } from './todo-tags';

interface TodoCardProps {
  todo: Todo;
  sprints: Sprint[];
  canReorder: boolean;
  reorderHint: string;
  isFirst: boolean;
  isLast: boolean;
  dragging: boolean;
  dropTarget: boolean;
  onOpen: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
  onMoveTop: (todo: Todo) => void;
  onMoveBottom: (todo: Todo) => void;
  onMoveToStatus: (todo: Todo, status: TodoStatus) => void;
  onMoveToSprint: (todo: Todo, sprintId: string) => void;
  onDragStart: (todo: Todo) => void;
  onDragEnd: () => void;
  onDragOver: (todo: Todo) => void;
  onDragLeave: (todo: Todo) => void;
  onDrop: (todo: Todo) => void;
}

/** BL-1 / BL-5: one backlog card on the status board; the grip is the drag affordance. */
export function TodoCard({
  todo,
  sprints,
  canReorder,
  reorderHint,
  isFirst,
  isLast,
  dragging,
  dropTarget,
  onOpen,
  onDelete,
  onMoveTop,
  onMoveBottom,
  onMoveToStatus,
  onMoveToSprint,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: TodoCardProps) {
  const overdue = todo.dueDate ? isOverdue(todo.dueDate) : false;
  const visibleLabels = todo.labels.slice(0, 3);
  const extraLabels = todo.labels.length - visibleLabels.length;

  function handleDrop(event: DragEvent<HTMLLIElement>) {
    if (!canReorder) return;
    event.preventDefault();
    event.stopPropagation();
    onDrop(todo);
  }

  return (
    <li
      onDragOver={(event) => {
        if (!canReorder) return;
        event.preventDefault();
        event.stopPropagation();
        onDragOver(todo);
      }}
      onDragLeave={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        onDragLeave(todo);
      }}
      onDrop={handleDrop}
      className={[
        'group relative cursor-default rounded-md border bg-card p-2.5 shadow-[0_1px_1px_rgba(9,30,66,0.1)] transition-[border-color,box-shadow,opacity] duration-150',
        dragging ? 'opacity-40' : '',
        dropTarget
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-border hover:border-ring/50 hover:shadow-[0_4px_12px_-6px_rgba(9,30,66,0.35)]',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {dropTarget ? (
        <span
          className="pointer-events-none absolute inset-x-2 -top-px h-0.5 rounded-full bg-primary"
          aria-hidden="true"
        />
      ) : null}

      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span className="font-mono text-[11px] font-semibold tracking-[0.04em] text-muted-foreground">
            {todo.key}
          </span>
          <TypeTag type={todo.type} />
          <PriorityTag priority={todo.priority} />
        </div>

        <div className="-mt-1 -mr-1 flex shrink-0 items-center">
          <button
            type="button"
            draggable={canReorder}
            disabled={!canReorder}
            aria-label={canReorder ? `Reorder ${todo.key}` : `${todo.key} cannot be reordered right now`}
            title={canReorder ? 'Drag to reorder' : reorderHint}
            onDragStart={(event) => {
              if (!canReorder) return;
              event.dataTransfer?.setData('text/plain', todo.id);
              if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
              onDragStart(todo);
            }}
            onDragEnd={onDragEnd}
            className={[
              'grid size-6 cursor-grab place-items-center rounded text-muted-foreground/70 outline-none transition-colors',
              canReorder
                ? 'cursor-grab hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing'
                : 'cursor-not-allowed opacity-40',
            ].join(' ')}
          >
            <GripIcon width={15} height={15} />
          </button>

          <TodoCardMenu
            todo={todo}
            sprints={sprints}
            canReorder={canReorder}
            reorderHint={reorderHint}
            isFirst={isFirst}
            isLast={isLast}
            onOpen={onOpen}
            onMoveTop={onMoveTop}
            onMoveBottom={onMoveBottom}
            onMoveToStatus={onMoveToStatus}
            onMoveToSprint={onMoveToSprint}
            onDelete={onDelete}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => onOpen(todo)}
        className="mt-1.5 block w-full rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span
          className={[
            'text-[13px] font-medium leading-snug text-foreground',
            todo.status === 'done' ? 'text-muted-foreground line-through' : '',
          ].join(' ')}
        >
          {todo.title}
        </span>
      </button>

      {todo.description ? (
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {todo.description}
        </p>
      ) : null}

      {todo.labels.length > 0 ? (
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          {visibleLabels.map((label) => (
            <LabelChip key={label} label={label} />
          ))}
          {extraLabels > 0 ? (
            <span className="text-[11px] text-muted-foreground">+{extraLabels}</span>
          ) : null}
        </div>
      ) : null}

      <div className="mt-2 flex items-center justify-between gap-2">
        {todo.dueDate ? (
          <span
            className={[
              'inline-flex items-center gap-1 text-[11px]',
              overdue ? 'font-medium text-destructive' : 'text-muted-foreground',
            ].join(' ')}
            title={overdue ? 'Overdue' : 'Due date'}
          >
            <CalendarIcon width={12} height={12} />
            {formatDueDate(todo.dueDate)}
          </span>
        ) : null}

        <span className="ml-auto">
          <PointsBadge points={todo.storyPoints} />
        </span>
      </div>
    </li>
  );
}
