import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Sprint, Todo, TodoStatus } from '../../../types/api';
import {
  TODO_STATUS_DOTS,
  TODO_STATUS_OPTIONS,
} from '../constants/backlog.constants';
import { sprintOptionLabel } from '../lib/todo-meta';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  MoreIcon,
  MoveToSprintIcon,
} from '../../../assets/icons';

interface TodoCardMenuProps {
  todo: Todo;
  sprints: Sprint[];
  /** False while a search/filter is active: card positions are then ambiguous. */
  canReorder: boolean;
  reorderHint: string;
  isFirst: boolean;
  isLast: boolean;
  onOpen: (todo: Todo) => void;
  onMoveTop: (todo: Todo) => void;
  onMoveBottom: (todo: Todo) => void;
  onMoveToStatus: (todo: Todo, status: TodoStatus) => void;
  onMoveToSprint: (todo: Todo, sprintId: string) => void;
  onDelete: (todo: Todo) => void;
}

const ITEM =
  'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground disabled:pointer-events-none disabled:opacity-40';

const HEADING = 'px-2.5 pt-2 pb-1 text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground';

const MENU_WIDTH = 256;
const MENU_MAX_HEIGHT = 416;

interface MenuPosition {
  top: number;
  left: number;
  width: number;
  openUp: boolean;
}

/**
 * The card's action menu. Status is the primary choice on a kanban board, and
 * the order actions stay the keyboard-friendly alternative to dragging (BL-5).
 * Rendered in a portal so the board's horizontal scroll container never clips it.
 */
export function TodoCardMenu({
  todo,
  sprints,
  canReorder,
  reorderHint,
  isFirst,
  isLast,
  onOpen,
  onMoveTop,
  onMoveBottom,
  onMoveToStatus,
  onMoveToSprint,
  onDelete,
}: TodoCardMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const width = Math.min(MENU_WIDTH, window.innerWidth - 16);
    const left = Math.min(Math.max(8, rect.right - width), window.innerWidth - width - 8);
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < 340 && rect.top > spaceBelow;

    setPosition({
      top: openUp ? rect.top - 6 : rect.bottom + 6,
      left,
      width,
      openUp,
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;

    menuRef.current?.querySelector<HTMLElement>('[role^="menuitem"]:not([disabled])')?.focus();

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    const closeOnViewportChange = () => setOpen(false);
    const handleScroll = (event: Event) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', closeOnViewportChange);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', closeOnViewportChange);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [open]);

  function run(action: () => void, restoreFocus = false) {
    setOpen(false);
    action();
    if (restoreFocus) triggerRef.current?.focus();
  }

  const menu = open ? (
    <div
      ref={menuRef}
      id={`todo-menu-${todo.id}`}
      role="menu"
      aria-label={`Actions for ${todo.key}`}
      style={{
        top: position?.top ?? 0,
        left: position?.left ?? 0,
        width: position?.width ?? MENU_WIDTH,
        maxHeight: MENU_MAX_HEIGHT,
        transform: position?.openUp ? 'translateY(-100%)' : undefined,
      }}
      className="rise-in fixed z-50 overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-2xl shadow-black/10"
    >
      <button type="button" role="menuitem" className={ITEM} onClick={() => run(() => onOpen(todo))}>
        Open details
      </button>

      <div className="my-1 border-t border-border" role="separator" />

      <p className={HEADING}>Status</p>
      {TODO_STATUS_OPTIONS.map(({ value, label }) => {
        const current = todo.status === value;

        return (
          <button
            key={value}
            type="button"
            role="menuitemradio"
            aria-checked={current}
            className={ITEM}
            onClick={() =>
              run(() => {
                if (!current) onMoveToStatus(todo, value);
              }, true)
            }
          >
            <span
              aria-hidden="true"
              className={['size-2 shrink-0 rounded-full', TODO_STATUS_DOTS[value]].join(' ')}
            />
            <span className="flex-1 truncate">{label}</span>
            {current ? <CheckIcon width={14} height={14} className="text-tone" /> : null}
          </button>
        );
      })}

      <div className="my-1 border-t border-border" role="separator" />

      <p className={HEADING}>Order in column</p>
      {!canReorder ? (
        <p className="px-2.5 pb-1.5 text-[11px] leading-snug text-muted-foreground">{reorderHint}</p>
      ) : null}
      <button
        type="button"
        role="menuitem"
        className={ITEM}
        disabled={!canReorder || isFirst}
        onClick={() => run(() => onMoveTop(todo), true)}
      >
        <ArrowUpIcon width={15} height={15} />
        Move to top
      </button>
      <button
        type="button"
        role="menuitem"
        className={ITEM}
        disabled={!canReorder || isLast}
        onClick={() => run(() => onMoveBottom(todo), true)}
      >
        <ArrowDownIcon width={15} height={15} />
        Move to bottom
      </button>

      <div className="my-1 border-t border-border" role="separator" />

      <p className={HEADING}>Move to sprint</p>
      {sprints.length === 0 ? (
        <p className="px-2.5 pb-1.5 text-[11px] leading-snug text-muted-foreground">
          No planned or active sprints yet.
        </p>
      ) : (
        sprints.map((sprint) => (
          <button
            key={sprint.id}
            type="button"
            role="menuitem"
            className={ITEM}
            onClick={() => run(() => onMoveToSprint(todo, sprint.id), true)}
          >
            <MoveToSprintIcon width={15} height={15} className="shrink-0 text-muted-foreground" />
            <span className="truncate">{sprintOptionLabel(sprint)}</span>
          </button>
        ))
      )}

      <div className="my-1 border-t border-border" role="separator" />

      <button
        type="button"
        role="menuitem"
        className={[ITEM, 'text-destructive hover:bg-destructive/10 hover:text-destructive'].join(' ')}
        onClick={() => run(() => onDelete(todo))}
      >
        Delete todo
      </button>
    </div>
  ) : null;

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={`Actions for ${todo.key}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={`todo-menu-${todo.id}`}
        className="grid size-8 place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <MoreIcon width={17} height={17} />
      </button>

      {menu ? createPortal(menu, document.body) : null}
    </div>
  );
}
