import type { ReactNode } from 'react';

interface CardProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Card({ title, description, children, footer }: CardProps) {
  return (
    <div className="w-full max-w-[26rem] rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
      <header className="mb-4 text-center">
        <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description ? (
          <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>
        ) : null}
      </header>
      <div className="flex flex-col gap-3">{children}</div>
      {footer ? <footer className="mt-4 flex flex-col gap-2 text-center">{footer}</footer> : null}
    </div>
  );
}
