import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';

const FOCUSABLE =
  'a[href], button:not([disabled]):not([tabindex="-1"]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Accessible modal: portalled, Escape to close, backdrop click to close,
 * focus moved inside on open and restored on close, body scroll locked.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const reducedMotion = useReducedMotion();
  // Skip exit animations in tests so a closed dialog leaves the DOM immediately.
  const animateExit = !reducedMotion && import.meta.env.MODE !== 'test';

  // Keep the latest close handler in a ref: passing an inline callback must not
  // re-run the focus/scroll effect on every parent render (e.g. each keystroke).
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
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-5">
          <motion.button
            type="button"
            tabIndex={-1}
            aria-label="Close dialog"
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
            className={[
              'relative flex max-h-[92svh] w-full flex-col overflow-hidden rounded-t-xl border border-border bg-card text-card-foreground shadow-2xl sm:rounded-xl',
              size === 'sm'
                ? 'sm:max-w-sm'
                : size === 'lg'
                  ? 'sm:max-w-xl'
                  : 'sm:max-w-md',
            ].join(' ')}
            initial={reducedMotion ? false : { opacity: 0, y: 14, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={animateExit ? { opacity: 0, y: 10, scale: 0.99 } : undefined}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
              <div className="min-w-0">
                <h2 id={titleId} className="font-display text-base font-semibold tracking-tight text-foreground">
                  {title}
                </h2>
                {description ? (
                  <p id={descriptionId} className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
                onClick={onClose}
                aria-label="Close"
              >
                <X size={15} strokeWidth={2.2} aria-hidden="true" />
              </button>
            </header>

            <div className="overflow-y-auto px-4 py-4">{children}</div>

            {footer ? (
              <footer className="flex flex-col-reverse gap-2 border-t border-border bg-muted/40 px-4 py-3 sm:flex-row sm:justify-end">
                {footer}
              </footer>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
