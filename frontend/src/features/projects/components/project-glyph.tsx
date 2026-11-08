import type { ProjectIcon } from '../../../types/api';
import { PROJECT_ICON_GLYPHS } from '../lib/status-meta';

interface ProjectGlyphProps {
  icon: ProjectIcon;
  size?: number;
  className?: string;
}

/** Renders the chosen project icon as a Lucide glyph. */
export function ProjectGlyph({ icon, size = 18, className }: ProjectGlyphProps) {
  const Glyph = PROJECT_ICON_GLYPHS[icon];
  return <Glyph size={size} strokeWidth={1.9} aria-hidden="true" className={className} />;
}
