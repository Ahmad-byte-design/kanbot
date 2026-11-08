import {
  BookOpen,
  Box,
  Briefcase,
  Bug,
  Code2,
  Layers,
  Palette,
  Rocket,
  Sparkles,
  Target,
  type LucideIcon,
} from 'lucide-react';
import {
  DEFAULT_PROJECT_STATUSES,
  type ProjectIcon,
  type ProjectStatus,
  type StatusColor,
} from '../../../types/api';
import type { ProjectListItem } from '../types/projects.types';

/** The icons a project can choose, matching `PROJECT_ICONS` on the server. */
export const PROJECT_ICON_GLYPHS: Record<ProjectIcon, LucideIcon> = {
  layers: Layers,
  rocket: Rocket,
  target: Target,
  palette: Palette,
  code: Code2,
  book: BookOpen,
  bug: Bug,
  briefcase: Briefcase,
  sparkles: Sparkles,
  box: Box,
};

export const STATUS_COLORS: StatusColor[] = [
  'slate',
  'blue',
  'violet',
  'green',
  'amber',
  'rose',
  'teal',
  'indigo',
];

/** Solid dot / strip colour per status colour. */
export const STATUS_DOT_CLASS: Record<StatusColor, string> = {
  slate: 'bg-slate-400',
  blue: 'bg-blue-500',
  violet: 'bg-violet-500',
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  teal: 'bg-teal-500',
  indigo: 'bg-indigo-500',
};

/** Soft badge colours per status colour, readable in both themes. */
export const STATUS_SOFT_CLASS: Record<StatusColor, string> = {
  slate: 'bg-slate-500/12 text-slate-600 dark:text-slate-300',
  blue: 'bg-blue-500/12 text-blue-700 dark:text-blue-300',
  violet: 'bg-violet-500/12 text-violet-700 dark:text-violet-300',
  green: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
  amber: 'bg-amber-500/12 text-amber-700 dark:text-amber-300',
  rose: 'bg-rose-500/12 text-rose-700 dark:text-rose-300',
  teal: 'bg-teal-500/12 text-teal-700 dark:text-teal-300',
  indigo: 'bg-indigo-500/12 text-indigo-700 dark:text-indigo-300',
};

export const STATUS_SWATCH_CLASS: Record<StatusColor, string> = STATUS_DOT_CLASS;

export function projectIcon(project?: Partial<ProjectListItem>): ProjectIcon {
  const icon = project?.icon;
  return icon && icon in PROJECT_ICON_GLYPHS ? icon : 'layers';
}

export function projectBackground(project?: Partial<ProjectListItem>): string | null {
  return project?.background ?? null;
}

/** Projects created before configurable statuses fall back to the four defaults. */
export function normalizeProjectStatuses(
  project?: Pick<ProjectListItem, 'statuses'> | null,
): ProjectStatus[] {
  const source =
    project?.statuses && project.statuses.length > 0 ? project.statuses : DEFAULT_PROJECT_STATUSES;
  return [...source].sort((a, b) => a.order - b.order);
}

export function statusById(
  statuses: ProjectStatus[],
  id: string | undefined,
): ProjectStatus | undefined {
  return statuses.find((status) => status.id === id);
}

export function statusLabel(statuses: ProjectStatus[], id: string, fallback?: string): string {
  return statusById(statuses, id)?.name ?? fallback ?? id;
}

export function statusDotClass(statuses: ProjectStatus[], id: string): string {
  const color = statusById(statuses, id)?.color;
  return color ? STATUS_DOT_CLASS[color] : 'bg-muted-foreground';
}

export function statusSoftClass(statuses: ProjectStatus[], id: string): string {
  const color = statusById(statuses, id)?.color;
  return color ? STATUS_SOFT_CLASS[color] : 'bg-muted text-muted-foreground';
}

export function statusOptions(statuses: ProjectStatus[]): { value: string; label: string }[] {
  return statuses.map((status) => ({ value: status.id, label: status.name }));
}

/** The legacy default labels, used when a todo points at a removed status. */
export const LEGACY_STATUS_LABELS: Record<string, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  in_review: 'In review',
  done: 'Done',
};
