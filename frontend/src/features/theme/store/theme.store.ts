import { create } from 'zustand';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'kanbot-theme';

function prefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function readInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // Private mode may deny localStorage; fall back to the OS preference.
  }
  return prefersDark() ? 'dark' : 'light';
}

/** Applies the theme to <html> so the `.dark` token block takes over. */
export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
}

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: readInitialTheme(),
  setTheme: (theme) => {
    applyTheme(theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Persisting is best-effort.
    }
    set({ theme });
  },
  toggleTheme: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),
}));

/** Call once before the first render to avoid a flash of the wrong theme. */
export function initializeTheme() {
  applyTheme(useThemeStore.getState().theme);
}
