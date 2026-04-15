"use client";

import { useRef, useCallback, useState } from "react";
import { Upload, FileText, Download, Trash2, Loader2, AlertCircle } from "lucide-react";
import { useDocumentosCaso, useUploadDocumento, useDeleteDocumento } from "@/hooks/use-documentos";
import { caseDocumentosApi } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { useToast } from "@/components/ui/use-toast";

interface DocumentosPanelProps {
  casoId: number;
}

function formatFecha(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function getFileLabel(tipo: string): string {
  if (tipo.includes("pdf")) return "PDF";
  if (tipo.includes("word") || tipo.includes("docx") || tipo.includes("doc")) return "DOC";
  return "DOC";
}

export function DocumentosPanel({ casoId }: DocumentosPanelProps) {
  const { data: documentos, isLoading } = useDocumentosCaso(casoId);
  const uploadDoc = useUploadDocumento(casoId);
  const deleteDoc = useDeleteDocumento(casoId);
  const token = useAuthStore((s) => s.token);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!ext || !["pdf", "doc", "docx"].includes(ext)) {
        toast({ title: "Formato no soportado", description: "Solo se aceptan PDF y DOCX.", variant: "destructive" });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "Archivo muy grande", description: "El archivo no debe superar 10MB.", variant: "destructive" });
        return;
      }
      try {
        await uploadDoc.mutateAsync(file);
        toast({ title: "Documento subido", description: `${file.name} procesado y guardado.` });
      } catch {
        toast({ title: "Error", description: "No se pudo subir el documento.", variant: "destructive" });
      }
    },
    [uploadDoc, toast]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDownload = async (docId: number, nombre: string) => {
    setDownloadingId(docId);
    try {
      const { url } = await caseDocumentosApi.getUrl(casoId, docId, token || undefined);
      const a = document.createElement("a");
      a.href = url;
      a.download = nombre;
      a.target = "_blank";
      a.click();
    } catch {
      toast({ title: "Error", description: "No se pudo obtener el enlace de descarga.", variant: "destructive" });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (docId: number, nombre: string) => {
    if (!confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteDoc.mutateAsync(docId);
      toast({ title: "Documento eliminado", description: nombre });
    } catch {
      toast({ title: "Error", description: "No se pudo eliminar el documento.", variant: "destructive" });
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-minka-500" />
          <h2 className="text-lg font-semibold text-gray-900">Documentos del caso</h2>
          {documentos && documentos.length > 0 && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {documentos.length}
            </span>
          )}
        </div>
      </div>

      {/* Zona de upload */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => !uploadDoc.isPending && fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-4 text-center cursor-pointer mb-4
          transition-colors duration-200
          ${uploadDoc.isPending ? "opacity-50 cursor-not-allowed" : ""}
          ${isDragging
            ? "border-minka-500 bg-minka-50"
            : "border-gray-200 hover:border-minka-400 hover:bg-gray-50"
          }
        `}
      >
        {uploadDoc.isPending ? (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Procesando con IA...
          </div>
        ) : (
          <>
            <Upload className="w-5 h-5 mx-auto mb-1 text-gray-400" />
            <p className="text-sm text-gray-500">
              <span className="font-medium text-minka-600">Agregar documento</span>
              {" "}o arrastra aquí
            </p>
            <p className="text-xs text-gray-400 mt-0.5">PDF, DOCX · máx. 10MB</p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
        />
      </div>

      {/* Lista de documentos */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : !documentos || documentos.length === 0 ? (
        <div className="text-center py-4 text-sm text-gray-400">
          <AlertCircle className="w-5 h-5 mx-auto mb-1 text-gray-300" />
          Sin documentos adjuntos
        </div>
      ) : (
        <div className="space-y-2">
          {documentos.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-bold text-minka-600 bg-minka-50 px-1.5 py-0.5 rounded flex-shrink-0">
                  {getFileLabel(doc.tipo_archivo)}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{doc.nombre}</p>
                  <p className="text-xs text-gray-400">{formatFecha(doc.fecha_subida)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                <button
                  onClick={() => handleDownload(doc.id, doc.nombre)}
                  disabled={downloadingId === doc.id}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                  title="Descargar"
                >
                  {downloadingId === doc.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Download className="w-4 h-4" />
                  }
                </button>
                <button
                  onClick={() => handleDelete(doc.id, doc.nombre)}
                  disabled={deleteDoc.isPending}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
