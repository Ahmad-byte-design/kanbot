import type { DragEvent } from 'react';
import type { Todo, TodoStatus } from '../../../types/api';
import { CalendarIcon, GripIcon } from '../../../assets/icons';
import { formatDueDate, isOverdue } from '../../backlog/lib/todo-meta';
import { LabelChip, PointsBadge, PriorityTag, TypeTag } from '../../backlog/components/todo-tags';
import { SprintBoardCardMenu } from './sprint-board-card-menu';

interface SprintBoardCardProps {
  todo: Todo;
  isFirst: boolean;
  isLast: boolean;
  dragging: boolean;
  dropTarget: boolean;
  onOpen: (todo: Todo) => void;
  onMoveTop: (todo: Todo) => void;
  onMoveBottom: (todo: Todo) => void;
  onMoveToStatus: (todo: Todo, status: TodoStatus) => void;
  onDragStart: (todo: Todo) => void;
  onDragEnd: () => void;
  onDragOver: (todo: Todo) => void;
  onDragLeave: (todo: Todo) => void;
  onDrop: (todo: Todo) => void;
}

/**
 * SPR-4 / SPR-5: one card on the active sprint board. The whole card is
 * draggable; the menu offers the same moves without a pointer.
 */
export function SprintBoardCard({
  todo,
  isFirst,
  isLast,
  dragging,
  dropTarget,
  onOpen,
  onMoveTop,
  onMoveBottom,
  onMoveToStatus,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: SprintBoardCardProps) {
  const overdue = todo.dueDate ? isOverdue(todo.dueDate) : false;
  const visibleLabels = todo.labels.slice(0, 2);
  const extraLabels = todo.labels.length - visibleLabels.length;

  function handleDragStart(event: DragEvent<HTMLLIElement>) {
    event.dataTransfer?.setData('text/plain', todo.id);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
    onDragStart(todo);
  }

  return (
    <li
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onDragOver={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onDragOver(todo);
      }}
      onDragLeave={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        onDragLeave(todo);
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onDrop(todo);
      }}
      className={[
        'group relative cursor-grab rounded-xl border bg-card p-3 shadow-sm transition-[border-color,box-shadow,opacity] duration-150 active:cursor-grabbing',
        dragging ? 'opacity-40' : '',
        dropTarget
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-border hover:border-ring/40 hover:shadow-md',
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

        <div className="-mt-1 -mr-1 flex shrink-0 items-center gap-0.5">
          <span
            aria-hidden="true"
            className="grid size-7 place-items-center text-muted-foreground/50 transition-colors group-hover:text-muted-foreground"
          >
            <GripIcon width={14} height={14} />
          </span>
          <SprintBoardCardMenu
            todo={todo}
            isFirst={isFirst}
            isLast={isLast}
            onOpen={onOpen}
            onMoveTop={onMoveTop}
            onMoveBottom={onMoveBottom}
            onMoveToStatus={onMoveToStatus}
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
            'text-sm font-medium leading-snug text-foreground',
            todo.status === 'done' ? 'text-muted-foreground line-through' : '',
          ].join(' ')}
        >
          {todo.title}
        </span>
      </button>

      {todo.labels.length > 0 ? (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {visibleLabels.map((label) => (
            <LabelChip key={label} label={label} />
          ))}
          {extraLabels > 0 ? (
            <span className="text-[11px] text-muted-foreground">+{extraLabels}</span>
          ) : null}
        </div>
      ) : null}

      <div className="mt-2.5 flex items-center justify-between gap-2">
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
        ) : (
          <span />
        )}

        <PointsBadge points={todo.storyPoints} />
      </div>
    </li>
  );
}
