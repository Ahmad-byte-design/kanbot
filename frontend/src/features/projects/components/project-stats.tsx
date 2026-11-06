import type { ProjectListItem } from '../types/projects.types';

interface ProjectStatsProps {
  stats: ProjectListItem['stats'];
}

/** The three live counters shown at the top of a project workspace. */
export function ProjectStats({ stats }: ProjectStatsProps) {
  return (
    <dl className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border border-border bg-card px-5 py-4">
        <dt className="text-xs text-muted-foreground">In backlog</dt>
        <dd className="mt-1 font-display text-3xl font-semibold tabular-nums text-foreground">
          {stats.backlogCount}
        </dd>
      </div>

      <div className="rounded-xl border border-border bg-card px-5 py-4">
        <dt className="text-xs text-muted-foreground">Todos in total</dt>
        <dd className="mt-1 font-display text-3xl font-semibold tabular-nums text-foreground">
          {stats.totalTodos}
        </dd>
      </div>

      <div className="rounded-xl border border-border bg-card px-5 py-4">
        <dt className="text-xs text-muted-foreground">Active sprint</dt>
        {stats.activeSprint ? (
          <dd className="mt-2 flex items-center gap-2 text-sm font-medium text-foreground">
            <span className="size-2 shrink-0 rounded-full bg-success" aria-hidden="true" />
            <span className="truncate">{stats.activeSprint.name}</span>
          </dd>
        ) : (
          <dd className="mt-2 text-sm text-muted-foreground">None running</dd>
        )}
      </div>
    </dl>
  );
}
