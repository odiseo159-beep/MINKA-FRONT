"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Notification {
  id: string;
  casoId: number;
  nombreCliente: string;
  telefono: string;
  tipo: "whatsapp" | "email";
  estado: "enviado" | "error";
  mensaje?: string;
  fecha: string;
}

interface NotificationStore {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id" | "fecha">) => void;
  clearHistory: () => void;
  getByCase: (casoId: number) => Notification[];
}

const MAX_NOTIFICATIONS = 100;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],

      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: generateId(),
          fecha: new Date().toISOString(),
        };

        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(
            0,
            MAX_NOTIFICATIONS
          ),
        }));
      },

      clearHistory: () => {
        set({ notifications: [] });
      },

      getByCase: (casoId: number) => {
        return get().notifications.filter((n) => n.casoId === casoId);
      },
    }),
    {
      name: "minka-notifications",
      partialize: (state) => ({
        notifications: state.notifications,
      }),
    }
  )
);
