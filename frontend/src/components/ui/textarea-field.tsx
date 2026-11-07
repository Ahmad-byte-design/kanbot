import { useId, type TextareaHTMLAttributes } from 'react';

export interface TextareaFieldProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'value' | 'onChange'> {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  /** Rendered at the bottom-right of the label row (e.g. a character count). */
  meta?: string;
}

export function TextareaField({
  id,
  label,
  value,
  onChange,
  error,
  helperText,
  meta,
  className,
  rows = 3,
  ...rest
}: TextareaFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  const describedBy = error ? errorId : helperText ? helperId : undefined;

  return (
    <div className={['flex flex-col gap-1.5', className ?? ''].filter(Boolean).join(' ')}>
      {label || meta ? (
        <div className="flex items-baseline justify-between gap-3">
          {label ? (
            <label className="text-xs font-medium text-foreground" htmlFor={inputId}>
              {label}
            </label>
          ) : null}
          {meta ? <span className="text-xs tabular-nums text-muted-foreground">{meta}</span> : null}
        </div>
      ) : null}
      <textarea
        id={inputId}
        rows={rows}
        className={[
          'w-full resize-y rounded-md border bg-background px-2.5 py-2 text-[13px] text-foreground transition-colors',
          'placeholder:text-muted-foreground',
          'outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error
            ? 'border-error focus-visible:border-error focus-visible:ring-error/30'
            : 'border-input',
        ]
          .filter(Boolean)
          .join(' ')}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
      {error ? (
        <p id={errorId} className="text-[11px] text-error">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-[11px] text-muted-foreground">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
