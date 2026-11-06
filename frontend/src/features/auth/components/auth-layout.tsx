import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { CheckIcon } from '../../../assets/icons';
import { AUTH_ROUTES } from '../constants/auth.constants';

interface AuthLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  eyebrow?: string;
}

const highlights = [
  {
    title: 'A backlog that stays calm',
    text: 'Capture work quickly, then shape it into a sprint when you are ready.',
  },
  {
    title: 'An AI teammate in the room',
    text: 'Draft todos, plan capacity and summarise the sprint in plain language.',
  },
  {
    title: 'One board, no busywork',
    text: 'Drag from backlog to done. Kanbot keeps the order and the numbers.',
  },
];

export function AuthLayout({ title, description, children, footer, eyebrow }: AuthLayoutProps) {
  return (
    <main className="min-h-svh bg-background lg:grid lg:grid-cols-[1.05fr_1fr]">
      <aside className="auth-aside relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="auth-grid absolute inset-0" aria-hidden="true" />
        <div className="relative">
          <Link className="inline-flex items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-white/70" to={AUTH_ROUTES.root}>
            <img src="/kanbot-icon.svg" alt="" className="size-11 rounded-2xl shadow-lg shadow-black/20" />
            <span className="font-display text-2xl font-semibold tracking-tight">Kanbot</span>
          </Link>

          <div className="mt-16 max-w-md">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-white/80 backdrop-blur">
              <span className="size-1.5 rounded-full bg-[var(--brand-accent)]" aria-hidden="true" />
              Your sprint board with an AI teammate
            </span>
            <h2 className="mt-6 font-display text-4xl font-semibold leading-[1.08] tracking-tight xl:text-[2.75rem]">
              Ship the sprint,
              <br />
              not the spreadsheet.
            </h2>
            <p className="mt-4 max-w-sm text-base leading-relaxed text-white/70">
              Plan the work, move the cards and let Kanbot handle the summaries. Everything your
              personal sprint needs, in one quiet place.
            </p>
          </div>

          <ul className="mt-10 flex max-w-md flex-col gap-4">
            {highlights.map((highlight) => (
              <li key={highlight.title} className="flex gap-3.5">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-white">
                  <CheckIcon />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-white">{highlight.title}</span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-white/65">
                    {highlight.text}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative mt-12 text-xs text-white/55">
          Backlog → sprint → board. Built for focus.
        </p>
      </aside>

      <section className="auth-canvas flex min-h-svh items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[27rem]">
          <Link
            className="mb-10 inline-flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
            to={AUTH_ROUTES.root}
          >
            <img src="/kanbot-icon.svg" alt="" className="size-9 rounded-xl shadow-sm" />
            <span className="font-display text-xl font-semibold tracking-tight text-foreground">Kanbot</span>
          </Link>

          <header>
            {eyebrow ? (
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>
            ) : null}
            <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-[2rem]">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
          </header>

          <div className="mt-8">{children}</div>

          {footer ? <div className="mt-6">{footer}</div> : null}
        </div>
      </section>
    </main>
  );
}
