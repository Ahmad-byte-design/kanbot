import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslation } from '../../i18n';

const FOCUSABLE =
  'a[href], button:not([disabled]):not([tabindex="-1"]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** Rendered at the right of the title row (e.g. a New chat button). */
  headerAction?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Accessible side panel: portalled, Escape and backdrop close, focus moved
 * inside and restored on close, body scroll locked while open.
 */
export function Drawer({
  open,
  onClose,
  title,
  description,
  headerAction,
  children,
  footer,
}: DrawerProps) {
  const { isRtl } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const reducedMotion = useReducedMotion();
  const slideFrom = isRtl ? -32 : 32;
  const slideTo = isRtl ? -28 : 28;
  // Skip exit animations in tests so a closed dialog leaves the DOM immediately.
  const animateExit = !reducedMotion && import.meta.env.MODE !== 'test';

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const panel = panelRef.current;
    const initial =
      panel?.querySelector<HTMLElement>('[data-autofocus]') ??
      panel?.querySelector<HTMLElement>(FOCUSABLE);
    initial?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab' || !panel) return;

      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) {
        event.preventDefault();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus();
    };
  }, [open]);

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-40 flex justify-end">
          <motion.button
            type="button"
            tabIndex={-1}
            aria-label="Close assistant"
            className="absolute inset-0 cursor-default bg-overlay backdrop-blur-[2px]"
            onClick={onClose}
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={animateExit ? { opacity: 0 } : undefined}
            transition={{ duration: 0.15 }}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            className="relative flex h-full w-full max-w-md flex-col border-s border-border bg-card text-card-foreground shadow-2xl"
            initial={reducedMotion ? false : { x: slideFrom, opacity: 0.6 }}
            animate={{ x: 0, opacity: 1 }}
            exit={animateExit ? { x: slideTo, opacity: 0.6 } : undefined}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
              <div className="min-w-0">
                <h2
                  id={titleId}
                  className="flex items-center gap-2 font-display text-base font-semibold tracking-tight text-foreground"
                >
                  {title}
                </h2>
                {description ? (
                  <p id={descriptionId} className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {headerAction}
                <button
                  type="button"
                  className="grid size-7 cursor-pointer place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={onClose}
                  aria-label="Close"
                >
                  <X size={15} strokeWidth={2.2} aria-hidden="true" />
                </button>
              </div>
            </header>

            <div className="flex min-h-0 flex-1 flex-col">{children}</div>

            {footer ? <footer className="border-t border-border">{footer}</footer> : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
