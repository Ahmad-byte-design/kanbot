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
import { useSignup } from '../hooks/use-signup';
import { signupSchema } from '../schema/auth.schema';
import { ApiError, errorMessage, fieldErrors as getFieldErrors } from '../../../services/client';

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

export function SignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = safeRedirect(searchParams.get('redirect'));
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const signup = useSignup();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = signupSchema.safeParse({ name, email, password, confirmPassword });
    if (!result.success) {
      setFieldErrors(collectFieldErrors(result.error.issues));
      setFormError(null);
      return;
    }

    setFieldErrors({});
    setFormError(null);
    signup.mutate(result.data, {
      onSuccess: () => navigate(redirectTo, { replace: true }),
      onError: (error) => {
        const serverFieldErrors = getFieldErrors(error);
        if (Object.keys(serverFieldErrors).length > 0) {
          setFieldErrors(serverFieldErrors);
          return;
        }
        if (error instanceof ApiError && error.code === 'CONFLICT') {
          setFieldErrors({ email: error.message });
          return;
        }
        setFormError(errorMessage(error, 'Could not create your account. Please try again.'));
      },
    });
  };

  const signInLink = redirectTo === AUTH_ROUTES.projects
    ? AUTH_ROUTES.login
    : `${AUTH_ROUTES.login}?redirect=${encodeURIComponent(redirectTo)}`;

  return (
    <AuthLayout
      eyebrow="Get started"
      title={AUTH_MESSAGES.signUpTitle}
      description={AUTH_MESSAGES.signUpDescription}
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link className={linkClass} to={signInLink}>
            Sign in
          </Link>
        </p>
      }
    >
      <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        {formError ? <Alert variant="error" message={formError} /> : null}

        <TextField
          id="auth-signup-name"
          label="Full name"
          autoComplete="name"
          placeholder="Ahmad Hasan"
          value={name}
          onChange={setName}
          error={fieldErrors.name}
          autoFocus
        />
        <TextField
          id="auth-signup-email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={setEmail}
          error={fieldErrors.email}
        />
        <PasswordField
          id="auth-signup-password"
          label="Password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={password}
          onChange={setPassword}
          error={fieldErrors.password}
          helperText="Use 8 characters or more."
        />
        <PasswordField
          id="auth-signup-confirm-password"
          label="Confirm password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          error={fieldErrors.confirmPassword}
        />

        <Button type="submit" size="lg" fullWidth loading={signup.isPending}>
          {signup.isPending ? 'Creating account…' : 'Create account'}
        </Button>

        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          By creating an account you agree to keep your sprint board kind and your standups short.
        </p>
      </form>
    </AuthLayout>
  );
}
