import { AUTH_ROUTES } from '../constants/auth.constants';

/** Only allow same-origin app paths, never `//evil.example` or another auth screen. */
export function safeRedirect(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return AUTH_ROUTES.projects;
  if (value === AUTH_ROUTES.login || value.startsWith(`${AUTH_ROUTES.login}?`)) return AUTH_ROUTES.projects;
  if (value === AUTH_ROUTES.register || value.startsWith(`${AUTH_ROUTES.register}?`)) return AUTH_ROUTES.projects;
  return value;
}
