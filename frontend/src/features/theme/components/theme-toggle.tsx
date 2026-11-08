import { MoonIcon, SunIcon } from '../../../assets/icons';
import { useTranslation } from '../../../i18n';
import { useThemeStore } from '../store/theme.store';

interface ThemeToggleProps {
  /** Compact icon-only button, used in dense toolbars. */
  compact?: boolean;
  className?: string;
}

/** Switches between the light and dark token sets, persisted in localStorage. */
export function ThemeToggle({ compact = false, className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useThemeStore();
  const { t } = useTranslation();
  const next = theme === 'dark' ? t('theme.toLight') : t('theme.toDark');
  const label = theme === 'dark' ? t('theme.light') : t('theme.dark');

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={next}
      title={next}
      className={[
        'inline-flex shrink-0 items-center gap-2 rounded-md text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
        compact ? 'size-8 justify-center' : 'px-2.5 py-1.5',
        className ?? 'text-muted-foreground hover:bg-accent hover:text-foreground',
      ].join(' ')}
    >
      {theme === 'dark' ? <SunIcon width={16} height={16} /> : <MoonIcon width={16} height={16} />}
      {compact ? null : <span>{label}</span>}
    </button>
  );
}
