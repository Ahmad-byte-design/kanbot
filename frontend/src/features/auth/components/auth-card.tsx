import type { ReactNode } from 'react';

interface CardProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Card({ title, description, children, footer }: CardProps) {
  return (
    <div className="w-full max-w-[26rem] rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description ? (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </header>
      <div className="flex flex-col gap-4">{children}</div>
      {footer ? <footer className="mt-6 flex flex-col gap-2 text-center">{footer}</footer> : null}
    </div>
  );
}
