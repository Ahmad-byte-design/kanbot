import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router';
import { useAuthSession, useLogout } from '../../auth';
import { PROJECT_ROUTES } from '../constants/projects.constants';
import { accountInitials } from '../lib/project-tone';
import type { ProjectListItem } from '../types/projects.types';
import { BacklogIcon, BoardIcon, LogoutIcon, SprintIcon } from '../../../assets/icons';
import { AssistantHost } from '../../ai/components/assistant-host';
import { ProjectSwitcher } from './project-switcher';

interface ProjectShellProps {
  project: ProjectListItem;
  children: ReactNode;
}

/**
 * The persistent workspace frame: dark rail with the project switcher and the
 * project navigation, plus the page content. The current project always comes
 * from the URL, never from component state.
 */
export function ProjectShell({ project, children }: ProjectShellProps) {
  const { user } = useAuthSession();
  const logout = useLogout();

  return (
    <div className="min-h-svh bg-background lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
      <aside className="bg-sidebar text-sidebar-foreground lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col">
        <div className="flex items-center justify-between px-4 pt-4 pb-3 lg:px-5">
          <Link
            to={PROJECT_ROUTES.list}
            className="inline-flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            <img src="/kanbot-icon.svg" alt="" className="size-8 rounded-xl shadow-md shadow-black/25" />
            <span className="font-display text-lg font-semibold tracking-tight">Kanbot</span>
          </Link>
          <div className="flex items-center gap-1 lg:hidden">
            <Link
              to={PROJECT_ROUTES.list}
              className="rounded-lg px-2 py-1 text-xs text-sidebar-muted outline-none transition-colors hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-white/40"
            >
              All projects
            </Link>
            <button
              type="button"
              onClick={logout}
              aria-label="Sign out"
              title="Sign out"
              className="grid size-8 place-items-center rounded-md text-sidebar-muted outline-none transition-colors hover:bg-sidebar-hover hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <LogoutIcon width={16} height={16} />
            </button>
          </div>
        </div>

        <div className="px-3 lg:px-4">
          <ProjectSwitcher current={project} />
        </div>

        <nav aria-label="Project navigation" className="flex gap-1 overflow-x-auto px-3 pt-4 pb-3 lg:flex-1 lg:flex-col lg:px-3">
          <NavLink
            to={PROJECT_ROUTES.backlog(project.id)}
            className={({ isActive }) =>
              [
                'flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/40',
                isActive
                  ? 'bg-sidebar-active font-medium text-sidebar-foreground'
                  : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground',
              ].join(' ')
            }
          >
            <BacklogIcon width={16} height={16} />
            Backlog
          </NavLink>

          <NavLink
            to={PROJECT_ROUTES.board(project.id)}
            className={({ isActive }) =>
              [
                'flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/40',
                isActive
                  ? 'bg-sidebar-active font-medium text-sidebar-foreground'
                  : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground',
              ].join(' ')
            }
          >
            <BoardIcon width={16} height={16} />
            Board
          </NavLink>

          <NavLink
            to={PROJECT_ROUTES.sprints(project.id)}
            className={({ isActive }) =>
              [
                'flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/40',
                isActive
                  ? 'bg-sidebar-active font-medium text-sidebar-foreground'
                  : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground',
              ].join(' ')
            }
          >
            <SprintIcon width={16} height={16} />
            Sprints
          </NavLink>
        </nav>

        <div className="mt-3 hidden border-t border-sidebar-border p-3 lg:block lg:p-4">
          <div className="flex items-center gap-2.5 rounded-xl px-1 py-1">
            <span
              aria-hidden="true"
              className="grid size-8 shrink-0 place-items-center rounded-full bg-white/10 text-[11px] font-semibold text-sidebar-foreground"
            >
              {accountInitials(user?.name, user?.email)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {user?.name ?? 'Signed in'}
              </p>
              <p className="truncate text-[11px] text-sidebar-muted">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              aria-label="Sign out"
              title="Sign out"
              className="grid size-8 shrink-0 place-items-center rounded-md text-sidebar-muted outline-none transition-colors hover:bg-sidebar-hover hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <LogoutIcon width={16} height={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0">{children}</div>

      <AssistantHost projectId={project.id} />
    </div>
  );
}
