import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Todo, TodoStatus } from '../../../types/api';
import { useProjectStatuses } from '../../projects/context/project-statuses-context';
import { STATUS_DOT_CLASS } from '../../projects/lib/status-meta';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  MoreIcon,
} from '../../../assets/icons';

interface SprintBoardCardMenuProps {
  todo: Todo;
  isFirst: boolean;
  isLast: boolean;
  onOpen: (todo: Todo) => void;
  onMoveTop: (todo: Todo) => void;
  onMoveBottom: (todo: Todo) => void;
  onMoveToStatus: (todo: Todo, status: TodoStatus) => void;
}

const ITEM =
  'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-start text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground disabled:pointer-events-none disabled:opacity-40';

const HEADING =
  'px-2.5 pt-2 pb-1 text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground';

const MENU_WIDTH = 240;
const MENU_MAX_HEIGHT = 380;

interface MenuPosition {
  top: number;
  left: number;
  width: number;
  openUp: boolean;
}

/**
 * SPR-5's keyboard-friendly alternative to dragging: change status or move a
 * card to the top/bottom of its current column. Portalled so board scrolling
 * never clips it.
 */
export function SprintBoardCardMenu({
  todo,
  isFirst,
  isLast,
  onOpen,
  onMoveTop,
  onMoveBottom,
  onMoveToStatus,
}: SprintBoardCardMenuProps) {
  const statuses = useProjectStatuses();
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
    const openUp = spaceBelow < 320 && rect.top > spaceBelow;

    setPosition({ top: openUp ? rect.top - 6 : rect.bottom + 6, left, width, openUp });
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
      id={`board-menu-${todo.id}`}
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
      {statuses.map((status) => {
        const current = todo.status === status.id;

        return (
          <button
            key={status.id}
            type="button"
            role="menuitemradio"
            aria-checked={current}
            className={ITEM}
            onClick={() =>
              run(() => {
                if (!current) onMoveToStatus(todo, status.id);
              }, true)
            }
          >
            <span
              aria-hidden="true"
              className={['size-2 shrink-0 rounded-full', STATUS_DOT_CLASS[status.color]].join(' ')}
            />
            <span className="flex-1 truncate">{status.name}</span>
            {current ? <CheckIcon width={14} height={14} className="text-tone" /> : null}
          </button>
        );
      })}

      <div className="my-1 border-t border-border" role="separator" />

      <p className={HEADING}>Order in column</p>
      <button
        type="button"
        role="menuitem"
        className={ITEM}
        disabled={isFirst}
        onClick={() => run(() => onMoveTop(todo), true)}
      >
        <ArrowUpIcon width={15} height={15} />
        Move to top
      </button>
      <button
        type="button"
        role="menuitem"
        className={ITEM}
        disabled={isLast}
        onClick={() => run(() => onMoveBottom(todo), true)}
      >
        <ArrowDownIcon width={15} height={15} />
        Move to bottom
      </button>
    </div>
  ) : null;

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        aria-label={`Actions for ${todo.key}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={`board-menu-${todo.id}`}
        className="grid size-7 place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <MoreIcon width={16} height={16} />
      </button>

      {menu ? createPortal(menu, document.body) : null}
    </div>
  );
}
