import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../../../services/auth';
import { useAuthStore } from '../store/auth.store';
import type { AuthSession, LoginInput } from '../types/auth.types';

export function useLogin() {
  const queryClient = useQueryClient();
  const signIn = useAuthStore((state) => state.signIn);

  return useMutation({
    mutationFn: (input: LoginInput): Promise<AuthSession> => authService.login(input),
    onSuccess: ({ token, user }) => {
      queryClient.clear();
      signIn(token, user);
    },
  });
}
