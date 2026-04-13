"use client";

import { useQuery } from "@tanstack/react-query";
import { normativaApi } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { NormativaResponse } from "@/types";

export function useNormativa(query: string, codigos?: string[], enabled = true) {
  const token = useAuthStore((state) => state.token);

  return useQuery<NormativaResponse>({
    queryKey: ["normativa", query, codigos],
    queryFn: () => normativaApi.buscar(query, codigos, 5, token || undefined),
    enabled: enabled && !!query && query.trim().length > 3,
    staleTime: 5 * 60 * 1000,
  });
}
