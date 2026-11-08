import { useCallback } from 'react';
import { en, type TranslationKey } from './locales/en';
import { ar } from './locales/ar';
import { useLocaleStore, type Locale } from './locale.store';

export type { Locale, TranslationKey };
export { initializeLocale, useLocaleStore } from './locale.store';

const dictionaries: Record<Locale, Record<TranslationKey, string>> = { en, ar };

export type TranslateVars = Record<string, string | number>;

function interpolate(template: string, vars?: TranslateVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

/** Translate outside React (services, tests, non-component helpers). */
export function translate(locale: Locale, key: TranslationKey, vars?: TranslateVars): string {
  return interpolate(dictionaries[locale][key] ?? en[key] ?? key, vars);
}

/**
 * Frontend-only localization. The locale lives in a persisted store and the
 * hook resolves the dictionary once per render; no network round-trip.
 */
export function useTranslation() {
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);
  const toggleLocale = useLocaleStore((state) => state.toggleLocale);

  const t = useCallback(
    (key: TranslationKey, vars?: TranslateVars) => translate(locale, key, vars),
    [locale],
  );

  return {
    t,
    locale,
    setLocale,
    toggleLocale,
    dir: locale === 'ar' ? 'rtl' : 'ltr',
    isRtl: locale === 'ar',
  };
}
