import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { useAuthSession, useLogout } from '../../auth';
import { PROJECT_ROUTES } from '../constants/projects.constants';
import { accountInitials } from '../lib/project-tone';
import { projectIcon } from '../lib/status-meta';
import type { ProjectListItem } from '../types/projects.types';
import {
  BacklogIcon,
  BoardIcon,
  CloseIcon,
  LogoutIcon,
  MenuIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  SprintIcon,
  StatusIcon,
} from '../../../assets/icons';
import { AssistantHost } from '../../ai/components/assistant-host';
import { ThemeToggle } from '../../theme';
import { LocaleSwitcher } from '../../../components/locale-switcher';
import { useTranslation } from '../../../i18n';
import { ProjectSwitcher } from './project-switcher';
import { ProjectMark } from './project-mark';
import { ProjectStatusesProvider } from '../context/project-statuses-context';
import { PageTransition } from '../../../components/motion/page-transition';
import { useBackgroundUrl } from '../hooks/use-backgrounds';
import { projectBackground } from '../lib/status-meta';

interface ProjectShellProps {
  project: ProjectListItem;
  children: ReactNode;
}

const SIDEBAR_STORAGE_KEY = 'kanbot-sidebar-collapsed';

function readCollapsed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

const NAV_ITEM =
  'flex items-center gap-2 whitespace-nowrap rounded-md text-[13px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/40';

interface SidebarLinkProps {
  to: string;
  icon: ReactNode;
  label: string;
  collapsed: boolean;
  onNavigate?: () => void;
}

function SidebarLink({ to, icon, label, collapsed, onNavigate }: SidebarLinkProps) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      aria-label={label}
      className={({ isActive }) =>
        [
          NAV_ITEM,
          'shrink-0',
          collapsed ? 'justify-center px-0 py-2' : 'px-2.5 py-1.5',
          isActive
            ? 'bg-sidebar-active font-medium text-sidebar-foreground'
            : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground',
        ].join(' ')
      }
    >
      {icon}
      {collapsed ? null : <span>{label}</span>}
    </NavLink>
  );
}

/**
 * The persistent workspace frame: a collapsible rail with the project switcher,
 * navigation, theme/language controls and the page content. The current project
 * always comes from the URL, never from component state.
 */
export function ProjectShell({ project, children }: ProjectShellProps) {
  const { user } = useAuthSession();
  const logout = useLogout();
  const { t, isRtl } = useTranslation();
  const location = useLocation();
  const background = useBackgroundUrl(projectBackground(project));
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the mobile drawer whenever the route changes (including back/forward).
  const [lastPath, setLastPath] = useState(location.pathname);
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname);
    setMobileOpen(false);
  }

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen]);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? '1' : '0');
      } catch {
        // Persisting is best-effort.
      }
      return next;
    });
  }

  const aside = (
    <aside
      aria-label={t('nav.projectNavigation')}
      className={[
        'bg-sidebar text-sidebar-foreground',
        'fixed inset-y-0 start-0 z-50 flex w-64 flex-col transition-transform duration-200 ease-out',
        mobileOpen ? 'translate-x-0' : isRtl ? 'translate-x-full' : '-translate-x-full',
        'lg:static lg:z-auto lg:h-svh lg:w-auto lg:translate-x-0 lg:transition-none',
      ].join(' ')}
    >
      <div
        className={[
          'flex items-center gap-2 px-3 pt-3 pb-2',
          collapsed ? 'lg:flex-col lg:px-2' : 'justify-between',
        ].join(' ')}
      >
        <Link
          to={PROJECT_ROUTES.list}
          aria-label={t('shell.allProjects')}
          title={t('shell.allProjects')}
          className="inline-flex min-w-0 items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        >
          <img src="/kanbot-icon.svg" alt="" className="size-7 shrink-0 rounded-lg shadow-md shadow-black/25" />
          {collapsed ? null : (
            <span className="font-display text-base font-semibold tracking-tight">Kanbot</span>
          )}
        </Link>

        <div className={collapsed ? 'hidden lg:flex lg:flex-col lg:items-center' : 'flex items-center gap-1'}>
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? t('shell.expandSidebar') : t('shell.collapseSidebar')}
            title={collapsed ? t('shell.expandSidebar') : t('shell.collapseSidebar')}
            className="hidden size-7 place-items-center rounded-md text-sidebar-muted outline-none transition-colors hover:bg-sidebar-hover hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-white/40 lg:grid"
          >
            {collapsed ? (
              <PanelLeftOpenIcon width={16} height={16} className="rtl:rotate-180" />
            ) : (
              <PanelLeftCloseIcon width={16} height={16} className="rtl:rotate-180" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label={t('shell.closeMenu')}
            title={t('shell.closeMenu')}
            className="grid size-7 place-items-center rounded-md text-sidebar-muted outline-none transition-colors hover:bg-sidebar-hover hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-white/40 lg:hidden"
          >
            <CloseIcon width={16} height={16} />
          </button>
        </div>
      </div>

      <div className={collapsed ? 'px-2' : 'px-2 lg:px-2.5'}>
        {collapsed ? (
          <Link
            to={PROJECT_ROUTES.backlog(project.id)}
            aria-label={project.name}
            title={project.name}
            className="mx-auto hidden w-fit lg:block"
          >
            <ProjectMark
              projectId={project.id}
              projectKey={project.key}
              icon={projectIcon(project)}
              size="sm"
            />
          </Link>
        ) : (
          <ProjectSwitcher current={project} />
        )}
      </div>

      <nav
        aria-label={t('nav.projectNavigation')}
        className={[
          'flex gap-1 overflow-x-auto px-2 pt-3 pb-2 lg:flex-1 lg:flex-col lg:overflow-visible',
          collapsed ? 'lg:items-center lg:px-2' : 'lg:px-2',
        ].join(' ')}
      >
        <SidebarLink
          to={PROJECT_ROUTES.backlog(project.id)}
          icon={<BacklogIcon width={16} height={16} />}
          label={t('nav.backlog')}
          collapsed={collapsed}
        />
        <SidebarLink
          to={PROJECT_ROUTES.board(project.id)}
          icon={<BoardIcon width={16} height={16} />}
          label={t('nav.board')}
          collapsed={collapsed}
        />
        <SidebarLink
          to={PROJECT_ROUTES.sprints(project.id)}
          icon={<SprintIcon width={16} height={16} />}
          label={t('nav.sprints')}
          collapsed={collapsed}
        />
        <SidebarLink
          to={PROJECT_ROUTES.statuses(project.id)}
          icon={<StatusIcon width={16} height={16} />}
          label={t('nav.statuses')}
          collapsed={collapsed}
        />
      </nav>

      <div className="mt-2 border-t border-sidebar-border p-2">
        <div
          className={[
            'flex items-center gap-1',
            collapsed ? 'flex-col lg:items-center' : 'justify-between',
          ].join(' ')}
        >
          <ThemeToggle
            compact
            className="text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground"
          />
          <LocaleSwitcher
            compact
            className="text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground"
          />
          <button
            type="button"
            onClick={logout}
            aria-label={t('shell.signOut')}
            title={t('shell.signOut')}
            className="grid size-8 shrink-0 place-items-center rounded-md text-sidebar-muted outline-none transition-colors hover:bg-sidebar-hover hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <LogoutIcon width={16} height={16} />
          </button>
        </div>

        {collapsed ? null : (
          <div className="mt-2 flex items-center gap-2 rounded-lg px-1 py-1">
            <span
              aria-hidden="true"
              className="grid size-7 shrink-0 place-items-center rounded-full bg-white/10 text-[10px] font-semibold text-sidebar-foreground"
            >
              {accountInitials(user?.name, user?.email)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-sidebar-foreground">
                {user?.name ?? t('shell.signedIn')}
              </p>
              <p className="truncate text-[10px] text-sidebar-muted">{user?.email}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );

  return (
    <ProjectStatusesProvider project={project}>
      <div className="min-h-svh bg-background">
        {/* Mobile app bar: the rail becomes a drawer behind the menu button. */}
        <div className="flex items-center justify-between gap-2 border-b border-sidebar-border bg-sidebar px-3 py-2 text-sidebar-foreground lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label={t('shell.openMenu')}
            title={t('shell.openMenu')}
            className="grid size-8 place-items-center rounded-md text-sidebar-muted outline-none transition-colors hover:bg-sidebar-hover hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <MenuIcon width={18} height={18} />
          </button>
          <Link to={PROJECT_ROUTES.list} className="inline-flex items-center gap-2">
            <img src="/kanbot-icon.svg" alt="" className="size-6 rounded-md shadow" />
            <span className="font-display text-sm font-semibold">Kanbot</span>
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle
              compact
              className="text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground"
            />
            <LocaleSwitcher
              compact
              className="text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground"
            />
          </div>
        </div>

        {mobileOpen ? (
          <button
            type="button"
            aria-label={t('shell.closeMenu')}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] lg:hidden"
          />
        ) : null}

        <div
          className={[
            'lg:grid',
            collapsed ? 'lg:grid-cols-[64px_minmax(0,1fr)]' : 'lg:grid-cols-[236px_minmax(0,1fr)]',
          ].join(' ')}
        >
          {aside}

          {/* The project cover fills the whole workspace viewport, not just the toolbar. */}
          <div className="relative min-h-svh min-w-0 bg-background">
            {background ? (
              <>
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat lg:bg-fixed"
                  style={{ backgroundImage: `url(${background})` }}
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/55 via-background/75 to-background/90"
                />
              </>
            ) : null}

            <div className="relative">
              <PageTransition>{children}</PageTransition>
            </div>
          </div>
        </div>

        <AssistantHost projectId={project.id} />
      </div>
    </ProjectStatusesProvider>
  );
}
