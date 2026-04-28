"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, LoginCredentials, RegisterCredentials, AuthState } from "@/types";
import { authApi } from "@/lib/api";

/** Limpia flags de tours / onboarding del navegador. Compartidos por device,
 * no por cuenta — si los dejamos puestos, el próximo usuario en este browser
 * no vería los tours. */
function clearTourFlags(): void {
  if (typeof window === "undefined") return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("minka_tour_") || key === "minka_onboarding_done")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // localStorage puede fallar en modo privado / cookies bloqueadas
  }
}

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
          // Cuenta nueva: arrancar con tours frescos aunque el navegador
          // tenga flags de una sesión anterior (otra cuenta, prueba previa).
          clearTourFlags();
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
        clearTourFlags();
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
