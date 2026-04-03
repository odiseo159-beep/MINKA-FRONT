"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, LoginCredentials, AuthState } from "@/types";
import { authApi } from "@/lib/api";

interface AuthStore extends AuthState {
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      // Actions
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login(credentials);
          set({
            user: response.usuario,
            token: response.access_token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // Ignore logout errors
        }
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      checkAuth: async () => {
        const { token } = get();
        
        if (!token) {
          set({ isLoading: false, isAuthenticated: false });
          return false;
        }

        try {
          const response = await authApi.verify();
          if (response.autenticado) {
            set({ 
              isAuthenticated: true, 
              isLoading: false,
              user: {
                id: 0, // Will be updated when we fetch full user
                email: response.email || "",
                nombre: response.nombre,
                rol: response.rol || "abogado",
                activo: true,
                fecha_creacion: "",
              }
            });
            return true;
          }
        } catch {
          // Token invalid
        }

        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false, 
          isLoading: false 
        });
        return false;
      },

      setLoading: (isLoading: boolean) => set({ isLoading }),
    }),
    {
      name: "minka-auth",
      partialize: (state) => ({ 
        token: state.token,
        user: state.user,
      }),
    }
  )
);
