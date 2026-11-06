import type { SVGProps } from 'react';

export type IconProps = SVGProps<SVGSVGElement>;

/** Shared frame: 24px grid, currentColor stroke, decorative by default. */
export function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}
