import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { caseDocumentosApi } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

export function useDocumentosCaso(casoId: number) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["documentos", casoId],
    queryFn: () => caseDocumentosApi.list(casoId, token || undefined),
    enabled: casoId > 0,
  });
}

export function useUploadDocumento(casoId: number) {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => caseDocumentosApi.upload(casoId, file, token || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentos", casoId] });
    },
  });
}

export function useDeleteDocumento(casoId: number) {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (docId: number) => caseDocumentosApi.delete(casoId, docId, token || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentos", casoId] });
    },
  });
}
