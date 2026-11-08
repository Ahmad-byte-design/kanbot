import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useLocation } from 'react-router';

/**
 * A soft enter transition for route content. Modals already animate themselves,
 * so this only covers page switches. Tests keep the instant path to avoid
 * timing flakiness around assertions that run right after navigation.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();
  const location = useLocation();
  const animate = !reducedMotion && import.meta.env.MODE !== 'test';

  return (
    <motion.div
      key={location.pathname}
      initial={animate ? { opacity: 0, y: 8 } : false}
      animate={animate ? { opacity: 1, y: 0 } : undefined}
      transition={animate ? { duration: 0.24, ease: [0.22, 1, 0.36, 1] } : undefined}
      className="min-h-full"
    >
      {children}
    </motion.div>
  );
}
