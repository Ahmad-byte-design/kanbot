import { useRef, type PointerEvent, type ReactNode } from 'react';
import { Link } from 'react-router';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { Check, Kanban, Sparkles } from 'lucide-react';
import { AUTH_ROUTES } from '../constants/auth.constants';

interface AuthLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  eyebrow?: string;
}

const highlights = [
  'Backlog, sprint and board in one place',
  'An AI teammate that drafts and plans with you',
  'A board that stays out of your way',
];

/** Small floating cards that make the background feel alive. */
const floatingCards = [
  {
    id: 'backlog',
    className: 'left-[4%] top-[16%] w-52 -rotate-6',
    depth: 34,
    icon: Kanban,
    label: 'KB-128 · In review',
    title: 'Ship the compact header',
  },
  {
    id: 'ai',
    className: 'right-[5%] top-[22%] w-56 rotate-3',
    depth: 52,
    icon: Sparkles,
    label: 'AI teammate',
    title: 'Draft 4 sprint tasks?',
  },
  {
    id: 'done',
    className: 'right-[12%] bottom-[12%] w-48 rotate-6',
    depth: 26,
    icon: Check,
    label: 'KB-124 · Done',
    title: 'Move the card to done',
  },
] as const;

interface FloatingCardProps {
  card: (typeof floatingCards)[number];
  smoothX: MotionValue<number>;
  smoothY: MotionValue<number>;
  reducedMotion: boolean | null;
}

/** Owns its parallax springs so the hook order stays static. */
function FloatingCard({ card, smoothX, smoothY, reducedMotion }: FloatingCardProps) {
  const CardIcon = card.icon;
  const depthX = useTransform(smoothX, [0, 1], [card.depth, -card.depth]);
  const depthY = useTransform(smoothY, [0, 1], [card.depth / 1.6, -card.depth / 1.6]);

  return (
    <motion.div
      aria-hidden="true"
      className={`pointer-events-none absolute hidden xl:block ${card.className}`}
      style={reducedMotion ? undefined : { x: depthX, y: depthY }}
    >
      <motion.div
        className="rounded-lg border border-white/70 bg-white/80 p-3 shadow-[0_18px_45px_-20px_rgba(9,30,66,0.45)] backdrop-blur-xl"
        animate={reducedMotion ? undefined : { y: [0, -7, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: card.depth / 22 }}
      >
        <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wide text-muted-foreground">
          <CardIcon size={12} className="text-primary" />
          {card.label}
        </div>
        <p className="mt-1.5 text-xs font-medium leading-snug text-foreground">{card.title}</p>
        <div className="mt-2 flex gap-1">
          <span className="h-1 w-8 rounded-full bg-primary/30" />
          <span className="h-1 w-5 rounded-full bg-muted-foreground/20" />
          <span className="h-1 w-3 rounded-full bg-muted-foreground/20" />
        </div>
      </motion.div>
    </motion.div>
  );
}

export function AuthLayout({ title, description, children, footer, eyebrow }: AuthLayoutProps) {
  const reducedMotion = useReducedMotion();
  const stageRef = useRef<HTMLElement>(null);

  // Normalised pointer position, smoothed so the background glides instead of snapping.
  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.5);
  const smoothX = useSpring(pointerX, { stiffness: 55, damping: 18, mass: 0.6 });
  const smoothY = useSpring(pointerY, { stiffness: 55, damping: 18, mass: 0.6 });

  const spotlightX = useTransform(smoothX, (value) => `${value * 100}%`);
  const spotlightY = useTransform(smoothY, (value) => `${value * 100}%`);
  const spotlight = useMotionTemplate`radial-gradient(34rem 34rem at ${spotlightX} ${spotlightY}, color-mix(in oklab, var(--primary) 22%, transparent), transparent 70%)`;

  const driftX = useTransform(smoothX, [0, 1], [18, -18]);
  const driftY = useTransform(smoothY, [0, 1], [14, -14]);
  const liftX = useTransform(smoothX, [0, 1], [-30, 30]);
  const liftY = useTransform(smoothY, [0, 1], [-22, 22]);

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    if (reducedMotion) return;
    const bounds = stageRef.current?.getBoundingClientRect();
    if (!bounds) return;
    pointerX.set((event.clientX - bounds.left) / bounds.width);
    pointerY.set((event.clientY - bounds.top) / bounds.height);
  }

  return (
    <main
      ref={stageRef}
      onPointerMove={handlePointerMove}
      className="auth-stage relative isolate min-h-svh overflow-hidden bg-background"
    >
      {/* Interactive background: spotlight + parallax wash follow the pointer. */}
      <motion.div className="pointer-events-none absolute inset-0" style={{ background: spotlight }} aria-hidden="true" />
      <div className="auth-grid-fine pointer-events-none absolute inset-0" aria-hidden="true" />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -right-32 size-[38rem] rounded-full bg-primary/15 blur-3xl"
        style={reducedMotion ? undefined : { x: driftX, y: driftY }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-48 -left-40 size-[34rem] rounded-full bg-[color-mix(in_oklab,var(--brand-accent)_18%,transparent)] blur-3xl"
        style={reducedMotion ? undefined : { x: liftX, y: liftY }}
      />

      {floatingCards.map((card) => (
        <FloatingCard
          key={card.id}
          card={card}
          smoothX={smoothX}
          smoothY={smoothY}
          reducedMotion={reducedMotion}
        />
      ))}

      <div className="relative z-10 flex min-h-svh items-center justify-center px-4 py-6 sm:px-6">
        <div className="grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-8 xl:gap-14">
          <aside className="hidden max-w-md lg:block">
            <Link
              to={AUTH_ROUTES.root}
              className="inline-flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <img src="/kanbot-icon.svg" alt="" className="size-9 rounded-xl shadow-sm" />
              <span className="font-display text-xl font-semibold tracking-tight text-foreground">
                Kanbot
              </span>
            </Link>

            <div className="mt-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-2.5 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur">
                <span className="size-1.5 rounded-full bg-brand-accent" aria-hidden="true" />
                Your sprint board with an AI teammate
              </span>
              <h2 className="mt-5 font-display text-[2.6rem] font-semibold leading-[1.05] tracking-tight text-foreground">
                Ship the sprint,
                <br />
                not the spreadsheet.
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
                Plan the work, move the cards and let Kanbot handle the summaries. Everything your
                personal sprint needs, in one quiet place.
              </p>
            </div>

            <ul className="mt-8 flex max-w-sm flex-col gap-3">
              {highlights.map((highlight) => (
                <li key={highlight} className="flex items-center gap-2.5 text-sm text-foreground/85">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <Check size={12} strokeWidth={2.4} aria-hidden="true" />
                  </span>
                  {highlight}
                </li>
              ))}
            </ul>
          </aside>

          <section className="flex items-center justify-center">
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 18, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="auth-orb relative flex w-full max-w-[27rem] items-center justify-center rounded-[2rem] border border-border/80 bg-card/80 p-7 shadow-[0_30px_80px_-40px_rgba(9,30,66,0.55)] backdrop-blur-2xl sm:p-9 md:aspect-square md:w-[min(88vw,40rem,calc(100svh-3.5rem))] md:max-w-none md:rounded-full md:p-0"
            >
              {/* Concentric rings keep the circle from reading as a plain blob. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-1.5 rounded-[1.8rem] border border-border/60 md:rounded-full"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-5 hidden rounded-full border border-dashed border-primary/15 md:block"
              />
              <span
                aria-hidden="true"
                className="absolute -top-1 left-1/2 hidden size-2.5 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_0_5px_color-mix(in_oklab,var(--primary)_16%,transparent)] md:block"
              />
              <span
                aria-hidden="true"
                className="absolute bottom-[12%] -left-1 hidden size-2 rounded-full bg-brand-accent shadow-[0_0_0_5px_color-mix(in_oklab,var(--brand-accent)_16%,transparent)] md:block"
              />

              <div className="relative w-full md:w-[72%] md:max-w-[22rem]">
                <Link
                  className="mb-6 inline-flex items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
                  to={AUTH_ROUTES.root}
                >
                  <img src="/kanbot-icon.svg" alt="" className="size-8 rounded-lg shadow-sm" />
                  <span className="font-display text-lg font-semibold tracking-tight text-foreground">
                    Kanbot
                  </span>
                </Link>

                <header>
                  {eyebrow ? (
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                      {eyebrow}
                    </p>
                  ) : null}
                  <h1 className="font-display text-[1.65rem] font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
                    {title}
                  </h1>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </header>

                <div className="mt-5">{children}</div>

                {footer ? <div className="mt-4">{footer}</div> : null}
              </div>
            </motion.div>
          </section>
        </div>
      </div>

      <p className="pointer-events-none absolute inset-x-0 bottom-3 hidden text-center text-[11px] text-muted-foreground/70 lg:block">
        Backlog → sprint → board. Built for focus.
      </p>
    </main>
  );
}
