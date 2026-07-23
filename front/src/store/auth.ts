import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/lib/types';

interface AuthState {
  token: string | null;
  user: User | null;
  /** Passe à true une fois l'état restauré depuis le localStorage. */
  hydrated: boolean;
  setAuth: (token: string, user: User) => void;
  setUser: (user: User) => void;
  logout: () => void;
  setHydrated: (v: boolean) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      hydrated: false,
      setAuth: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
      setHydrated: (v) => set({ hydrated: v }),
    }),
    {
      name: 'bibliosmart-auth',
      partialize: (s) => ({ token: s.token, user: s.user }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
);
