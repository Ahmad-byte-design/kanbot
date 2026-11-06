import type { Todo } from '../../../types/api';
import {
  TODO_PRIORITY_LABELS,
  TODO_PRIORITY_STYLES,
  TODO_STATUS_LABELS,
  TODO_STATUS_STYLES,
  TODO_TYPE_LABELS,
  TODO_TYPE_STYLES,
} from '../constants/backlog.constants';

const TAG_BASE =
  'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.05em] uppercase';

export function TypeTag({ type }: { type: Todo['type'] }) {
  return <span className={[TAG_BASE, TODO_TYPE_STYLES[type]].join(' ')}>{TODO_TYPE_LABELS[type]}</span>;
}

export function PriorityTag({ priority }: { priority: Todo['priority'] }) {
  return (
    <span className={[TAG_BASE, TODO_PRIORITY_STYLES[priority]].join(' ')}>
      {TODO_PRIORITY_LABELS[priority]}
    </span>
  );
}

export function StatusTag({ status }: { status: Todo['status'] }) {
  return (
    <span className={[TAG_BASE, TODO_STATUS_STYLES[status]].join(' ')}>
      {TODO_STATUS_LABELS[status]}
    </span>
  );
}

export function PointsBadge({ points }: { points: number | null }) {
  if (points === null) return null;

  return (
    <span
      className="inline-flex min-w-6 items-center justify-center rounded-md border border-border bg-background px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground"
      aria-label={`${points} story points`}
      title={`${points} story points`}
    >
      {points}
    </span>
  );
}

export function LabelChip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
      {label}
    </span>
  );
}
