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
    <div className="min-h-svh bg-background lg:grid lg:grid-cols-[236px_minmax(0,1fr)]">
      <aside className="bg-sidebar text-sidebar-foreground lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col">
        <div className="flex items-center justify-between px-3 pt-3 pb-2 lg:px-3.5">
          <Link
            to={PROJECT_ROUTES.list}
            className="inline-flex items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            <img src="/kanbot-icon.svg" alt="" className="size-7 rounded-lg shadow-md shadow-black/25" />
            <span className="font-display text-base font-semibold tracking-tight">Kanbot</span>
          </Link>
          <div className="flex items-center gap-1 lg:hidden">
            <Link
              to={PROJECT_ROUTES.list}
              className="rounded-md px-2 py-1 text-[11px] text-sidebar-muted outline-none transition-colors hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-white/40"
            >
              All projects
            </Link>
            <button
              type="button"
              onClick={logout}
              aria-label="Sign out"
              title="Sign out"
              className="grid size-7 place-items-center rounded-md text-sidebar-muted outline-none transition-colors hover:bg-sidebar-hover hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <LogoutIcon width={16} height={16} />
            </button>
          </div>
        </div>

        <div className="px-2 lg:px-2.5">
          <ProjectSwitcher current={project} />
        </div>

        <nav aria-label="Project navigation" className="flex gap-1 overflow-x-auto px-2 pt-3 pb-2 lg:flex-1 lg:flex-col lg:px-2">
          <NavLink
            to={PROJECT_ROUTES.backlog(project.id)}
            className={({ isActive }) =>
              [
                'flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md px-2.5 py-1.5 text-[13px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/40',
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
                'flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md px-2.5 py-1.5 text-[13px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/40',
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
                'flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md px-2.5 py-1.5 text-[13px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/40',
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

        <div className="mt-2 hidden border-t border-sidebar-border p-2.5 lg:block">
          <div className="flex items-center gap-2 rounded-lg px-1 py-1">
            <span
              aria-hidden="true"
              className="grid size-7 shrink-0 place-items-center rounded-full bg-white/10 text-[10px] font-semibold text-sidebar-foreground"
            >
              {accountInitials(user?.name, user?.email)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-sidebar-foreground">
                {user?.name ?? 'Signed in'}
              </p>
              <p className="truncate text-[10px] text-sidebar-muted">{user?.email}</p>
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
