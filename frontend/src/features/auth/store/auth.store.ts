import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AuthUser } from '../types/auth.types';

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  signIn: (token: string, user: AuthUser) => void;
  updateUser: (user: AuthUser) => void;
  signOut: () => void;
}

/**
 * The token is the only thing persisted (see requirements NFR-7).
 * `user` and `isAuthenticated` are restored by calling GET /auth/me on startup.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      signIn: (token, user) => set({ token, user, isAuthenticated: true }),
      updateUser: (user) => set({ user, isAuthenticated: true }),
      signOut: () => set({ token: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token }),
    },
  ),
);
