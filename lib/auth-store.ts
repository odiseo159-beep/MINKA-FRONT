"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, LoginCredentials, RegisterCredentials, AuthState } from "@/types";
import { authApi } from "@/lib/api";

/** Decode JWT payload (client-side, no verification). Returns exp as unix timestamp or null. */
function getTokenExp(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

interface AuthStore extends AuthState {
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
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

      register: async (credentials: RegisterCredentials) => {
        set({ isLoading: true });
        try {
          const response = await authApi.register(credentials);
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
          const response = await authApi.verify(token);
          if (response.autenticado) {
            // Calcular si el token expira pronto (menos de 2 horas = 7200 segundos)
            let activeToken = token;
            const exp = getTokenExp(token);
            const now = Math.floor(Date.now() / 1000);
            if (exp && (exp - now) < 7200) {
              try {
                const refreshed = await authApi.refresh(token);
                activeToken = refreshed.access_token;
              } catch {
                // Si falla el refresh, continuar con el token actual (ya es válido)
              }
            }
            set({
              isAuthenticated: true,
              isLoading: false,
              token: activeToken,  // actualizar token si fue refrescado
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
