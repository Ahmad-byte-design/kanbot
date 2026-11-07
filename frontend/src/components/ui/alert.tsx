import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export type AlertVariant = 'error' | 'success' | 'info';

interface AlertProps {
  variant: AlertVariant;
  message: string;
  title?: string;
  onClose?: () => void;
}

const variantClasses: Record<AlertVariant, string> = {
  error: 'border-destructive/25 bg-destructive/10 text-foreground',
  success: 'border-success/25 bg-success/10 text-foreground',
  info: 'border-info/25 bg-info/10 text-foreground',
};

const iconClasses: Record<AlertVariant, string> = {
  error: 'text-destructive',
  success: 'text-success',
  info: 'text-info',
};

export function Alert({ variant, message, title, onClose }: AlertProps) {
  const Icon = variant === 'error' ? AlertCircle : variant === 'success' ? CheckCircle2 : Info;

  return (
    <div
      className={[
        'flex items-start gap-2 rounded-md border p-3 text-[13px]',
        variantClasses[variant],
      ].join(' ')}
      role="alert"
    >
      <Icon size={16} strokeWidth={2} className={['mt-px shrink-0', iconClasses[variant]].join(' ')} aria-hidden="true" />
      <div className="flex min-w-0 flex-col gap-0.5">
        {title ? <p className="font-semibold">{title}</p> : null}
        <p className="leading-snug">{message}</p>
      </div>
      {onClose ? (
        <button
          type="button"
          className="ml-auto shrink-0 rounded p-0.5 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          onClick={onClose}
          aria-label="Dismiss"
        >
          <X size={14} strokeWidth={2.2} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
