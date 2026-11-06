import { useId, type ReactNode, type SelectHTMLAttributes } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectFieldProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'value' | 'onChange' | 'children'> {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  error?: string;
  helperText?: string;
  /** Rendered at the bottom-right of the label row. */
  meta?: ReactNode;
  placeholder?: string;
}

function ChevronIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/** Native select with the same label, error and helper contract as TextField. */
export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  error,
  helperText,
  meta,
  placeholder,
  className,
  ...rest
}: SelectFieldProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const errorId = `${selectId}-error`;
  const helperId = `${selectId}-helper`;
  const describedBy = error ? errorId : helperText ? helperId : undefined;

  return (
    <div className={['flex flex-col gap-2', className ?? ''].filter(Boolean).join(' ')}>
      {label || meta ? (
        <div className="flex items-baseline justify-between gap-3">
          {label ? (
            <label className="text-sm font-medium text-foreground" htmlFor={selectId}>
              {label}
            </label>
          ) : null}
          {meta ? <span className="text-xs text-muted-foreground">{meta}</span> : null}
        </div>
      ) : null}

      <div className="relative">
        <select
          id={selectId}
          className={[
            'h-10 w-full appearance-none rounded-md border bg-background px-3 pr-9 text-sm text-foreground transition-colors',
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
        >
          {placeholder && value === '' ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">
          <ChevronIcon />
        </span>
      </div>

      {error ? (
        <p id={errorId} className="text-xs text-error">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-xs text-muted-foreground">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
