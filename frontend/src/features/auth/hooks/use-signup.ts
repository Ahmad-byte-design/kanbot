import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../../../services/auth';
import { useAuthStore } from '../store/auth.store';
import type { AuthSession, SignupInput } from '../types/auth.types';

export function useSignup() {
  const queryClient = useQueryClient();
  const signIn = useAuthStore((state) => state.signIn);

  return useMutation({
    mutationFn: ({ name, email, password }: SignupInput): Promise<AuthSession> =>
      authService.register({ name, email, password }),
    onSuccess: ({ token, user }) => {
      queryClient.clear();
      signIn(token, user);
    },
  });
}
