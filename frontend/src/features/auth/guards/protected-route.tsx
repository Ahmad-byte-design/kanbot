import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuthSession } from '../hooks/use-auth';
import { AUTH_ROUTES } from '../constants/auth.constants';

/** AUTH-5: send guests to login and remember where they were going. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthSession();
  const location = useLocation();

  if (!isAuthenticated) {
    const redirect = `${location.pathname}${location.search}`;
    return <Navigate to={`${AUTH_ROUTES.login}?redirect=${encodeURIComponent(redirect)}`} replace />;
  }

  return <>{children}</>;
}
