import type { SprintStatus } from '../../../types/api';
import {
  SPRINT_STATUS_DOTS,
  SPRINT_STATUS_LABELS,
  SPRINT_STATUS_STYLES,
} from '../constants/sprints.constants';

interface SprintStatusBadgeProps {
  status: SprintStatus;
  withDot?: boolean;
}

/** The planned / active / completed badge used on the backlog and history. */
export function SprintStatusBadge({ status, withDot = false }: SprintStatusBadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-[0.08em] uppercase',
        SPRINT_STATUS_STYLES[status],
      ].join(' ')}
    >
      {withDot ? (
        <span
          aria-hidden="true"
          className={['size-1.5 rounded-full', SPRINT_STATUS_DOTS[status]].join(' ')}
        />
      ) : null}
      {SPRINT_STATUS_LABELS[status]}
    </span>
  );
}
