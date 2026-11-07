import { useId, type ReactNode, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

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
    <div className={['flex flex-col gap-1.5', className ?? ''].filter(Boolean).join(' ')}>
      {label || meta ? (
        <div className="flex items-baseline justify-between gap-3">
          {label ? (
            <label className="text-xs font-medium text-foreground" htmlFor={selectId}>
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
            'h-9 w-full appearance-none rounded-md border bg-background px-2.5 pr-8 text-[13px] text-foreground transition-colors',
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
        <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-muted-foreground">
          <ChevronDown size={15} strokeWidth={1.8} aria-hidden="true" />
        </span>
      </div>

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
