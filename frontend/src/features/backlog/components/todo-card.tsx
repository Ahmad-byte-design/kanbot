import type { DragEvent } from 'react';
import type { Sprint, Todo, TodoStatus } from '../../../types/api';
import { useProjectStatuses } from '../../projects/context/project-statuses-context';
import { statusById } from '../../projects/lib/status-meta';
import { formatDueDate, isOverdue } from '../lib/todo-meta';
import { CalendarIcon, GripIcon } from '../../../assets/icons';
import { TodoCardMenu } from './todo-card-menu';
import { LabelChip, PointsBadge, PriorityTag, TypeIcon, TypeTag } from './todo-tags';

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

/**
 * BL-1 / BL-5: one compact backlog row. The whole row is a list item and the
 * grip is the drag affordance; the type icon and coloured badges carry the
 * metadata that used to need a full card.
 */
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
  const statuses = useProjectStatuses();
  const done = statusById(statuses, todo.status)?.done ?? false;
  const overdue = todo.dueDate ? isOverdue(todo.dueDate) : false;
  const visibleLabels = todo.labels.slice(0, 2);
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
        'group relative flex items-center gap-2 rounded-md border bg-card px-1.5 py-1.5 shadow-[0_1px_1px_rgba(9,30,66,0.08)] transition-[border-color,box-shadow,opacity] duration-150',
        dragging ? 'opacity-40' : '',
        dropTarget
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-border hover:border-ring/50 hover:shadow-[0_3px_10px_-6px_rgba(9,30,66,0.35)]',
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
          'grid size-6 shrink-0 place-items-center rounded text-muted-foreground/60 outline-none transition-colors',
          canReorder
            ? 'cursor-grab hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing'
            : 'cursor-not-allowed opacity-40',
        ].join(' ')}
      >
        <GripIcon width={14} height={14} />
      </button>

      <TypeIcon type={todo.type} size={13} />

      <span className="hidden shrink-0 font-mono text-[11px] font-semibold tracking-[0.04em] text-muted-foreground sm:inline">
        {todo.key}
      </span>

      <span className="hidden shrink-0 md:inline">
        <TypeTag type={todo.type} />
      </span>
      <span className="hidden shrink-0 md:inline">
        <PriorityTag priority={todo.priority} />
      </span>

      <button
        type="button"
        onClick={() => onOpen(todo)}
        className="min-w-0 flex-1 rounded-sm px-1 py-0.5 text-start outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span
          className={[
            'block truncate text-[13px] font-medium text-foreground',
            done ? 'text-muted-foreground line-through' : '',
          ].join(' ')}
        >
          {todo.title}
        </span>
      </button>

      {visibleLabels.length > 0 ? (
        <span className="hidden shrink-0 items-center gap-1 lg:flex">
          {visibleLabels.map((label) => (
            <LabelChip key={label} label={label} />
          ))}
          {extraLabels > 0 ? (
            <span className="text-[11px] text-muted-foreground">+{extraLabels}</span>
          ) : null}
        </span>
      ) : null}

      {todo.dueDate ? (
        <span
          className={[
            'hidden shrink-0 items-center gap-1 text-[11px] sm:inline-flex',
            overdue ? 'font-medium text-destructive' : 'text-muted-foreground',
          ].join(' ')}
          title={overdue ? 'Overdue' : 'Due date'}
        >
          <CalendarIcon width={12} height={12} />
          {formatDueDate(todo.dueDate)}
        </span>
      ) : null}

      <span className="shrink-0">
        <PointsBadge points={todo.storyPoints} />
      </span>

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
    </li>
  );
}
