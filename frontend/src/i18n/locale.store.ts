import { create } from 'zustand';

export type Locale = 'en' | 'ar';

const STORAGE_KEY = 'kanbot-locale';

function readInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'ar') return stored;
  } catch {
    // Ignore storage failures.
  }
  return 'en';
}

export function appliesLocale(locale: Locale) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
}

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

export const useLocaleStore = create<LocaleState>((set, get) => ({
  locale: readInitialLocale(),
  setLocale: (locale) => {
    appliesLocale(locale);
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // Persisting is best-effort.
    }
    set({ locale });
  },
  toggleLocale: () => get().setLocale(get().locale === 'ar' ? 'en' : 'ar'),
}));

export function initializeLocale() {
  appliesLocale(useLocaleStore.getState().locale);
}
