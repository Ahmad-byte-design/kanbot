import { useId, type InputHTMLAttributes, type ReactNode } from 'react';

export interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'value' | 'onChange' | 'type'> {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  type?: string;
  endAdornment?: ReactNode;
}

export function TextField({
  id,
  label,
  value,
  onChange,
  error,
  helperText,
  type = 'text',
  endAdornment,
  className,
  ...rest
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  const describedBy = error ? errorId : helperText ? helperId : undefined;

  return (
    <div className={['flex flex-col gap-2', className ?? ''].filter(Boolean).join(' ')}>
      {label ? (
        <label className="text-sm font-medium text-foreground" htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <div className="relative">
        <input
          id={inputId}
          className={[
            'h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground transition-colors',
            'placeholder:text-muted-foreground',
            'outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30',
            'disabled:cursor-not-allowed disabled:opacity-50',
            endAdornment ? 'pr-10' : '',
            error
              ? 'border-error focus-visible:border-error focus-visible:ring-error/30'
              : 'border-input',
          ]
            .filter(Boolean)
            .join(' ')}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        />
        {endAdornment ? (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">{endAdornment}</div>
        ) : null}
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
