import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StaffUser } from '@/types';

interface StaffAuthState {
  user: StaffUser | null;
  isAuthenticated: boolean;
  setUser: (user: StaffUser | null) => void;
  clearAuth: () => void;
}

export const useStaffAuthStore = create<StaffAuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      clearAuth: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'staff-auth-storage',
    }
  )
);

