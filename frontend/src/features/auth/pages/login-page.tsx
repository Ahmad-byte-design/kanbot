import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Alert } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';
import { AuthLayout } from '../components/auth-layout';
import { PasswordField } from '../components/password-field';
import { TextField } from '../../../components/ui/text-field';
import { AUTH_MESSAGES, AUTH_ROUTES } from '../constants/auth.constants';
import { safeRedirect } from '../lib/redirect';
import { useLogin } from '../hooks/use-login';
import { loginSchema } from '../schema/auth.schema';
import { errorMessage } from '../../../services/client';

const linkClass =
  'font-semibold text-primary underline-offset-4 transition-colors hover:text-primary-hover hover:underline';

function collectFieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = safeRedirect(searchParams.get('redirect'));
  const [showExpired, setShowExpired] = useState(searchParams.get('expired') === '1');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const login = useLogin();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setFieldErrors(collectFieldErrors(result.error.issues));
      setFormError(null);
      return;
    }

    setFieldErrors({});
    setFormError(null);
    login.mutate(result.data, {
      onSuccess: () => navigate(redirectTo, { replace: true }),
      onError: (error) => setFormError(errorMessage(error, 'Incorrect email or password.')),
    });
  };

  return (
    <AuthLayout
      eyebrow="Sign in"
      title={AUTH_MESSAGES.signInTitle}
      description={AUTH_MESSAGES.signInDescription}
      footer={
        <p className="text-center text-sm text-muted-foreground">
          New to Kanbot?{' '}
          <Link className={linkClass} to={AUTH_ROUTES.register}>
            Create an account
          </Link>
        </p>
      }
    >
      <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        {showExpired && !formError ? (
          <Alert variant="info" message={AUTH_MESSAGES.sessionExpired} onClose={() => setShowExpired(false)} />
        ) : null}
        {formError ? <Alert variant="error" message={formError} /> : null}

        <TextField
          id="auth-login-email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={setEmail}
          error={fieldErrors.email}
          autoFocus
        />
        <PasswordField
          id="auth-login-password"
          label="Password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={setPassword}
          error={fieldErrors.password}
        />

        <Button type="submit" size="lg" fullWidth loading={login.isPending}>
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </Button>

        <div className="rounded-xl border border-dashed border-border bg-muted/60 p-4 text-center text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Just exploring?</p>
          <p className="mt-1">Use the seeded demo account.</p>
          <button
            type="button"
            className="mt-2 font-semibold text-primary underline-offset-4 hover:underline"
            onClick={() => {
              setEmail('demo@kanbot.dev');
              setPassword('password123');
              setFormError(null);
              setFieldErrors({});
            }}
          >
            Fill demo credentials
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
