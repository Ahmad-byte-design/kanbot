import { LanguagesIcon } from '../assets/icons';
import { useTranslation } from '../i18n';

interface LocaleSwitcherProps {
  compact?: boolean;
  className?: string;
}

/** Toggles between English and Arabic and flips the document direction. */
export function LocaleSwitcher({ compact = false, className }: LocaleSwitcherProps) {
  const { locale, toggleLocale, t } = useTranslation();
  const label = t('locale.switch');

  return (
    <button
      type="button"
      onClick={toggleLocale}
      aria-label={label}
      title={`${label}: ${locale === 'ar' ? t('locale.english') : t('locale.arabic')}`}
      className={[
        'inline-flex shrink-0 items-center gap-1.5 rounded-md text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
        compact ? 'size-8 justify-center' : 'px-2.5 py-1.5',
        className ?? 'text-muted-foreground hover:bg-accent hover:text-foreground',
      ].join(' ')}
    >
      <LanguagesIcon width={16} height={16} />
      {compact ? null : (
        <span className="text-[11px] font-semibold tracking-wide">
          {locale === 'ar' ? 'ع' : 'EN'}
        </span>
      )}
    </button>
  );
}
