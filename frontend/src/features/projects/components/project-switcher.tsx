import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { PROJECT_ROUTES } from '../constants/projects.constants';
import { useProjects } from '../hooks/use-projects';
import type { ProjectListItem } from '../types/projects.types';
import { CheckIcon, ChevronDownIcon, PlusIcon } from '../../../assets/icons';
import { ProjectFormDialog } from './project-form-dialog';
import { ProjectMark } from './project-mark';

interface ProjectSwitcherProps {
  current: ProjectListItem;
}

/**
 * PRJ-5: the switcher lists every project and navigates to the selected one.
 * Navigation is a URL change, so the current project survives a reload.
 */
export function ProjectSwitcher({ current }: ProjectSwitcherProps) {
  const navigate = useNavigate();
  const { data: projects = [], isPending } = useProjects();
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  function selectProject(project: ProjectListItem) {
    setOpen(false);
    if (project.id !== current.id) navigate(PROJECT_ROUTES.backlog(project.id));
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls="project-switcher-menu"
        className="flex w-full items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-hover px-2 py-1.5 text-left outline-none transition-colors hover:bg-sidebar-active focus-visible:ring-2 focus-visible:ring-white/40"
      >
        <ProjectMark projectId={current.id} projectKey={current.key} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium text-sidebar-foreground">
            {current.name}
          </span>
          <span className="mt-0.5 block text-[10px] tracking-[0.08em] text-sidebar-muted">
            {current.key}
          </span>
        </span>
        <ChevronDownIcon
          width={16}
          height={16}
          className={[
            'shrink-0 text-sidebar-muted transition-transform duration-200',
            open ? 'rotate-180' : '',
          ].join(' ')}
        />
      </button>

      {open ? (
        <div
          id="project-switcher-menu"
          role="menu"
          aria-label="Switch project"
          className="rise-in absolute inset-x-0 top-full z-40 mt-1.5 overflow-hidden rounded-lg border border-sidebar-border bg-sidebar shadow-2xl shadow-black/40"
        >
          <p className="px-3 pt-3 pb-1.5 text-[11px] font-medium text-sidebar-muted">Switch to</p>

          <div className="max-h-64 overflow-y-auto px-1.5 pb-1.5">
            {isPending ? (
              <p className="px-2 py-3 text-xs text-sidebar-muted">Loading projects…</p>
            ) : (
              projects.map((project) => {
                const active = project.id === current.id;

                return (
                  <button
                    key={project.id}
                    type="button"
                    role="menuitem"
                    onClick={() => selectProject(project)}
                    className={[
                      'flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm outline-none transition-colors',
                      'hover:bg-sidebar-hover focus-visible:ring-2 focus-visible:ring-white/40',
                      active ? 'bg-sidebar-active text-sidebar-foreground' : 'text-sidebar-foreground/90',
                    ].join(' ')}
                  >
                    <ProjectMark projectId={project.id} projectKey={project.key} size="sm" />
                    <span className="min-w-0 flex-1 truncate">{project.name}</span>
                    <span className="text-[10px] tracking-[0.08em] text-sidebar-muted">
                      {project.key}
                    </span>
                    {active ? <CheckIcon width={14} height={14} className="text-sidebar-foreground" /> : null}
                  </button>
                );
              })
            )}
          </div>

          <div className="border-t border-sidebar-border p-1.5">
            <Link
              to={PROJECT_ROUTES.list}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-2 py-2 text-xs text-sidebar-muted outline-none transition-colors hover:bg-sidebar-hover hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-white/40"
            >
              All projects
            </Link>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setCreateOpen(true);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs text-sidebar-muted outline-none transition-colors hover:bg-sidebar-hover hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <PlusIcon width={14} height={14} />
              New project
            </button>
          </div>
        </div>
      ) : null}

      {createOpen ? (
        <ProjectFormDialog mode="create" onClose={() => setCreateOpen(false)} />
      ) : null}
    </div>
  );
}
