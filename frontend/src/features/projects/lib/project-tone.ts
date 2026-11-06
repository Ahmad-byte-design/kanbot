/**
 * Per-project accents.
 *
 * A project's id is hashed to one of four tones, so each project keeps the same
 * accent on the list, the switcher and the workspace header. The actual colours
 * live in `index.css` as `.project-tone-*` classes that override `--tone`.
 */
export const PROJECT_TONES = ['indigo', 'teal', 'amber', 'rose'] as const;

export type ProjectTone = (typeof PROJECT_TONES)[number];

export function projectTone(seed: string): ProjectTone {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return PROJECT_TONES[hash % PROJECT_TONES.length];
}

export function projectToneClass(seed: string): string {
  return `project-tone-${projectTone(seed)}`;
}

/** "Mobile App Redesign" → "MAR", "Kanbot" → "KAN". Mirrors the server rule. */
export function suggestProjectKey(name: string): string {
  const words = name
    .toUpperCase()
    .replace(/[^A-Z ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const key =
    words.length > 1
      ? words
          .map((word) => word[0])
          .join('')
          .slice(0, 4)
      : (words[0] ?? '').slice(0, 3);

  return key.length >= 2 ? key : 'PRJ';
}

/** Initials for the account chip in the workspace top bar. */
export function accountInitials(name: string | undefined, email: string | undefined): string {
  const source = name?.trim() || email || '?';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}
