import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'default' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active',
  secondary:
    'bg-secondary text-secondary-foreground hover:bg-secondary-hover',
  outline:
    'border border-border bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground',
  ghost: 'bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground',
  destructive:
    'bg-destructive text-destructive-foreground hover:bg-destructive-hover',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-7 px-2.5 text-xs',
  default: 'h-9 px-3.5 text-[13px]',
  lg: 'h-11 px-5 text-sm',
};

export function Button({
  variant = 'primary',
  size = 'default',
  loading = false,
  fullWidth = false,
  disabled,
  type,
  children,
  className,
  ...props
}: ButtonProps) {
  const classes = [
    'inline-flex cursor-pointer items-center justify-center gap-2 rounded-md font-medium transition-[background-color,box-shadow,transform,color] duration-150 active:scale-[0.985]',
    'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:pointer-events-none disabled:opacity-50',
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? 'w-full' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type ?? 'submit'} disabled={disabled || loading} className={classes} {...props}>
      {loading ? (
        <span
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      ) : null}
      <span className="inline-flex items-center gap-2">{children}</span>
    </button>
  );
}
