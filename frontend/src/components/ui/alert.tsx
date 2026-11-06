import type { SVGProps } from 'react';

export type AlertVariant = 'error' | 'success' | 'info';

interface AlertProps {
  variant: AlertVariant;
  message: string;
  title?: string;
  onClose?: () => void;
}

function AlertCircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function CheckCircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function InfoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

const variantClasses: Record<AlertVariant, string> = {
  error: 'border-transparent bg-destructive text-destructive-foreground',
  success: 'border-transparent bg-success text-success-foreground',
  info: 'border-transparent bg-info text-info-foreground',
};

export function Alert({ variant, message, title, onClose }: AlertProps) {
  return (
    <div
      className={[
        'flex items-start gap-2 rounded-lg border p-4 text-sm',
        variantClasses[variant],
      ].join(' ')}
      role="alert"
    >
      <span className="mt-px inline-flex shrink-0">
        {variant === 'error' ? <AlertCircleIcon /> : variant === 'success' ? <CheckCircleIcon /> : <InfoIcon />}
      </span>
      <div className="flex flex-col gap-0.5">
        {title ? <p className="font-semibold">{title}</p> : null}
        <p>{message}</p>
      </div>
      {onClose ? (
        <button
          type="button"
          className="ml-auto inline-flex rounded-sm outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-current/40"
          onClick={onClose}
          aria-label="Dismiss"
        >
          <CloseIcon />
        </button>
      ) : null}
    </div>
  );
}
