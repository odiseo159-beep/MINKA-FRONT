"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { casesApi, calculateStats } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { useNotificationStore } from "@/lib/notification-store";
import type { Case, CaseFormData, CaseFilters } from "@/types";

// Query keys
export const caseKeys = {
  all: ["cases"] as const,
  detail: (id: number) => ["cases", id] as const,
};

// Get all cases
export function useCases() {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: caseKeys.all,
    queryFn: () => casesApi.getAll(token || undefined),
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Get single case
export function useCase(id: number) {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: caseKeys.detail(id),
    queryFn: () => casesApi.getById(id, token || undefined),
    enabled: !!id,
  });
}

// Get dashboard stats
export function useDashboardStats() {
  const { data: cases, isLoading, error } = useCases();
  
  const stats = cases ? calculateStats(cases) : {
    total: 0,
    activos: 0,
    resueltos: 0,
    pendientes_documento: 0,
  };

  return { stats, isLoading, error };
}

// Create case
export function useCreateCase() {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);

  return useMutation({
    mutationFn: (data: CaseFormData) => casesApi.create(data, token || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caseKeys.all });
    },
  });
}

// Update case
export function useUpdateCase() {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CaseFormData> }) =>
      casesApi.update(id, data, token || undefined),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: caseKeys.all });
      queryClient.invalidateQueries({ queryKey: caseKeys.detail(id) });
    },
  });
}

// Delete case
export function useDeleteCase() {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);

  return useMutation({
    mutationFn: (id: number) => casesApi.delete(id, token || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caseKeys.all });
    },
  });
}

// Notify client
export function useNotifyClient() {
  const token = useAuthStore((state) => state.token);
  const addNotification = useNotificationStore((state) => state.addNotification);

  return useMutation({
    mutationFn: ({ id }: { id: number; nombreCliente: string; telefono: string }) =>
      casesApi.notify(id, token || undefined),
    onSuccess: (_, variables) => {
      addNotification({
        casoId: variables.id,
        nombreCliente: variables.nombreCliente,
        telefono: variables.telefono,
        tipo: "whatsapp",
        estado: "enviado",
      });
    },
    onError: (error: Error, variables) => {
      addNotification({
        casoId: variables.id,
        nombreCliente: variables.nombreCliente,
        telefono: variables.telefono,
        tipo: "whatsapp",
        estado: "error",
        mensaje: error.message || "Error al enviar notificación",
      });
    },
  });
}

// Filter cases helper
export function filterCases(
  cases: Case[],
  filters: CaseFilters
): Case[] {
  let filtered = cases;

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.nombre_cliente.toLowerCase().includes(searchLower) ||
        (c.expediente?.toLowerCase().includes(searchLower) ?? false)
    );
  }

  if (filters.status) {
    filtered = filtered.filter((c) => c.estado === filters.status);
  }

  if (filters.caseType) {
    filtered = filtered.filter((c) => c.tipo_caso === filters.caseType);
  }

  if (filters.dateFrom) {
    filtered = filtered.filter(
      (c) => c.proxima_fecha && c.proxima_fecha >= filters.dateFrom
    );
  }

  if (filters.dateTo) {
    filtered = filtered.filter(
      (c) => c.proxima_fecha && c.proxima_fecha <= filters.dateTo
    );
  }

  return filtered;
}
