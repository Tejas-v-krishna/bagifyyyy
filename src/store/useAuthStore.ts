import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  id: string;
  email: string;
  name?: string | null;
  avatar?: string | null;
  googleId?: string | null;
}

interface AuthState {
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  isAuthenticated: boolean;
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  setIsAuthenticated: (val: boolean) => void;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthModalOpen: false,
      openAuthModal: () => set({ isAuthModalOpen: true }),
      closeAuthModal: () => set({ isAuthModalOpen: false }),
      isAuthenticated: false,
      user: null,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setIsAuthenticated: (val) => set({ isAuthenticated: val }),
      logout: async () => {
        try {
          await fetch('/api/auth/login', { method: 'DELETE' });
        } catch (e) {
          console.error('Logout error:', e);
        }
        set({ user: null, isAuthenticated: false });
      },
      checkSession: async () => {
        try {
          const res = await fetch('/api/auth/me');
          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              set({ user: data.user, isAuthenticated: true });
            } else {
              set({ user: null, isAuthenticated: false });
            }
          }
        } catch (e) {
          console.error('Check session error:', e);
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
);
