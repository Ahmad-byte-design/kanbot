import { projectToneClass } from '../lib/project-tone';

interface ProjectMarkProps {
  projectId: string;
  projectKey: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'size-8 rounded-lg text-[11px]',
  md: 'size-11 rounded-xl text-xs',
  lg: 'size-14 rounded-2xl text-sm',
} as const;

/** A project's monogram, tinted with its deterministic accent. */
export function ProjectMark({
  projectId,
  projectKey,
  size = 'md',
  className,
}: ProjectMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={[
        projectToneClass(projectId),
        sizeClasses[size],
        'grid shrink-0 place-items-center bg-tone-soft font-display font-bold tracking-[0.08em] text-tone',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {projectKey.slice(0, 3)}
    </span>
  );
}
