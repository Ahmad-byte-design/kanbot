import type { ReactNode } from 'react';
import { Navigate, useSearchParams } from 'react-router';
import { useAuthSession } from '../hooks/use-auth';
import { safeRedirect } from '../lib/redirect';

export function GuestRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthSession();
  const [searchParams] = useSearchParams();

  if (isAuthenticated) {
    return <Navigate to={safeRedirect(searchParams.get('redirect'))} replace />;
  }

  return <>{children}</>;
}
