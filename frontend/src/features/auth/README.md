# Auth feature

Registration, login, session persistence, guards and expired-session handling,
wired to the Kanbot API (`/auth/register`, `/auth/login`, `/auth/me`).

## Public API

```ts
import {
  GuestRoute,
  LoginPage,
  ProtectedRoute,
  SignupPage,
  useAuthBootstrap,
  useAuthSession,
  useLogout,
} from '@/features/auth';
```

Wrap the route table with the bootstrap gate once:

```tsx
function App() {
  const { isReady } = useAuthBootstrap();
  if (!isReady) return <FullPageLoader label="Checking your session…" />;

  return (
    <Routes>
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><SignupPage /></GuestRoute>} />
      <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
    </Routes>
  );
}
```

`GuestRoute` sends signed-in users to `?redirect=` (or `/projects`);
`ProtectedRoute` sends guests to `/login?redirect=<current path>`.

## Session model

```ts
const { user, isAuthenticated } = useAuthSession();
const logout = useLogout();
```

- `useAuthStore` persists **only** the JWT under `auth-storage`.
- `useAuthBootstrap` calls `GET /auth/me` on startup and hydrates the user.
- `useLogout` clears the store and the TanStack Query cache, then routes to login.
- `services/client.ts` is a single axios instance: a request interceptor attaches
  the token via `configureTokenGetter` (set in `main.tsx`), and the response
  interceptor normalises failures to `ApiError` and calls the registered 401
  handler for every non-login request.
- Query keys are centralised in `query-keys.ts` (`authKeys.me(token)`), so future
  invalidations and prefetches share the same key factory.

## API contract

The backend is the source of truth: `src/types/api.ts` is copied verbatim from
`server/src/types/api.ts`. Auth requests go through `services/auth.ts`.

| Endpoint | Used for |
|---|---|
| `POST /auth/register` | Create an account (201) |
| `POST /auth/login` | Sign in (200) |
| `GET /auth/me` | Validate a persisted token on startup |

There is no password-reset endpoint in the API, so the frontend does not show a
forgot-password flow.

## Validation

Zod schemas mirror the server rules (name 1–80, valid email, password 8–200).
Client errors appear under the field; server `details[]` are mapped to fields via
`fieldErrors(error)`.

## Tests

```bash
npm test
```

Covers schema validation, token-only persistence and eight auth flows: login,
401 message, registration, duplicate-email field error, session restore with
the bearer token, expired-token clearing, network retry and logout.

HTTP is mocked at the axios adapter level (`src/test/api-mock.ts`), so the tests
exercise the real client, interceptors and services without a network.
