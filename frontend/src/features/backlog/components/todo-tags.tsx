import type { Todo } from '../../../types/api';
import { useProjectStatuses } from '../../projects/context/project-statuses-context';
import {
  LEGACY_STATUS_LABELS,
  statusById,
  statusSoftClass,
} from '../../projects/lib/status-meta';
import {
  TODO_PRIORITY_LABELS,
  TODO_PRIORITY_STYLES,
  TODO_TYPE_ICON_STYLES,
  TODO_TYPE_LABELS,
  TODO_TYPE_STYLES,
} from '../constants/backlog.constants';
import { BookIcon, BugIcon, TaskIcon } from '../../../assets/icons';

const TAG_BASE =
  'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.05em] uppercase';

const TYPE_ICONS = {
  task: TaskIcon,
  story: BookIcon,
  bug: BugIcon,
} as const;

/** The type glyph, tinted with the same token as the type badge. */
export function TypeIcon({ type, size = 14 }: { type: Todo['type']; size?: number }) {
  const Icon = TYPE_ICONS[type];

  return (
    <span
      className={[
        'grid shrink-0 place-items-center rounded p-0.5',
        TODO_TYPE_ICON_STYLES[type],
      ].join(' ')}
      title={TODO_TYPE_LABELS[type]}
    >
      <Icon width={size} height={size} aria-hidden="true" />
    </span>
  );
}

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
  const statuses = useProjectStatuses();
  const match = statusById(statuses, status);

  return (
    <span className={[TAG_BASE, statusSoftClass(statuses, status)].join(' ')}>
      {match?.name ?? LEGACY_STATUS_LABELS[status] ?? status}
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
