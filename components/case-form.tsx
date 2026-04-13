"use client";

import { useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, FileText, CheckCircle, AlertCircle, X } from "lucide-react";
import type { Case, CaseFormData } from "@/types";
import { STATUS_LABELS, CASE_TYPE_LABELS } from "@/types";
import { parseDocxFile, mapBackendResponse, type ParsedDocument } from "@/lib/document-parser";
import { documentApi } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

// Validation schema
const caseSchema = z.object({
  nombre_cliente: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  telefono: z.string().min(9, "El teléfono debe tener al menos 9 dígitos"),
  expediente: z.string().optional(),
  tipo_caso: z.string().min(1, "Selecciona un tipo de caso"),
  estado: z.string().min(1, "Selecciona un estado"),
  proxima_fecha: z.string().optional(),
  proxima_accion: z.string().optional(),
  documentos_pendientes: z.string().optional(),
  notas: z.string().optional(),
});

interface CaseFormProps {
  initialData?: Case;
  onSubmit: (data: CaseFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CaseForm({ initialData, onSubmit, onCancel, isLoading }: CaseFormProps) {
  const [uploadState, setUploadState] = useState<
    "idle" | "parsing" | "success" | "error"
  >("idle");
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<ParsedDocument | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const token = useAuthStore((state) => state.token);

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm<CaseFormData>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      nombre_cliente: initialData?.nombre_cliente || "",
      telefono: initialData?.telefono || "",
      expediente: initialData?.expediente || "",
      tipo_caso: initialData?.tipo_caso || "",
      estado: initialData?.estado || "nuevo",
      proxima_fecha: initialData?.proxima_fecha || "",
      proxima_accion: initialData?.proxima_accion || "",
      documentos_pendientes: initialData?.documentos_pendientes || "",
      notas: initialData?.notas || "",
    },
  });

  const handleFile = useCallback(async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    const allowedExts = ["docx", "pdf"];

    if (!ext || !allowedExts.includes(ext)) {
      setUploadState("error");
      setUploadError("Solo se aceptan archivos .docx y .pdf");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadState("error");
      setUploadError("El archivo no debe superar 10 MB");
      return;
    }

    setUploadState("parsing");
    setUploadedFile(file.name);
    setUploadError(null);

    try {
      let result: ParsedDocument;

      if (ext === "docx") {
        // Client-side parsing con mammoth.js
        result = await parseDocxFile(file);
      } else {
        // Server-side parsing via Claude API (PDF, documentos escaneados)
        const response = await documentApi.extract(file, token || undefined);
        result = mapBackendResponse(response);
      }

      setParseResult(result);
      setUploadState("success");

      const currentValues = getValues();
      reset({
        ...currentValues,
        ...result.caseData,
      });
    } catch (err) {
      setUploadState("error");
      setUploadError(
        err instanceof Error
          ? err.message
          : "No se pudo leer el documento. Verifica que sea un archivo válido."
      );
    }
  }, [reset, getValues, token]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const clearUpload = useCallback(() => {
    setUploadState("idle");
    setUploadedFile(null);
    setParseResult(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const fieldLabels: Record<string, string> = {
    nombre_cliente: "Cliente",
    telefono: "Teléfono",
    expediente: "Expediente",
    tipo_caso: "Tipo de caso",
    estado: "Estado",
    notas: "Notas",
    documentos_pendientes: "Documentos",
  };

  const handleFormSubmit = useCallback(async (formData: CaseFormData) => {
    await onSubmit({
      ...formData,
      ...(parseResult?.rawText ? { documento_texto: parseResult.rawText } : {}),
    });
  }, [onSubmit, parseResult]);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {/* Upload de documento (solo para crear, no editar) */}
      {!initialData && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Cargar documento del caso
            <span className="font-normal text-gray-400 ml-1">(opcional)</span>
          </label>

          {uploadState === "idle" && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                transition-colors duration-200
                ${isDragging
                  ? "border-minka-500 bg-minka-50"
                  : "border-gray-300 hover:border-minka-400 hover:bg-gray-50"
                }
              `}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">
                <span className="font-medium text-minka-600">Sube un archivo</span>
                {" "}o arrastra aquí
              </p>
              <p className="text-xs text-gray-400 mt-1">
                .docx, .pdf (denuncias, demandas, resoluciones, documentos escaneados)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </div>
          )}

          {uploadState === "parsing" && (
            <div className="border border-gray-200 rounded-lg p-4 flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-minka-500/30 border-t-minka-500 rounded-full animate-spin" />
              <div>
                <p className="text-sm font-medium text-gray-700">Leyendo documento...</p>
                <p className="text-xs text-gray-400">{uploadedFile}</p>
              </div>
            </div>
          )}

          {uploadState === "success" && parseResult && (
            <div className="border border-green-200 bg-green-50 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-green-700" />
                      <p className="text-sm font-medium text-green-800">{uploadedFile}</p>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      Campos extraídos: {parseResult.fieldsFound.map(f => fieldLabels[f] || f).join(", ")}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Revisa los datos abajo y ajusta lo que necesites.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearUpload}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  title="Quitar documento"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {uploadState === "error" && (
            <div className="border border-red-200 bg-red-50 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Error al procesar</p>
                    <p className="text-xs text-red-600 mt-0.5">{uploadError}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearUpload}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Row 1: Nombre + Teléfono */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Nombre del cliente *
          </label>
          <input
            {...register("nombre_cliente")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-minka-500 focus:border-minka-500 outline-none"
            placeholder="María García"
          />
          {errors.nombre_cliente && (
            <p className="mt-1 text-sm text-red-600">{errors.nombre_cliente.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Teléfono (WhatsApp) *
          </label>
          <input
            {...register("telefono")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-minka-500 focus:border-minka-500 outline-none"
            placeholder="987654321"
          />
          {errors.telefono && (
            <p className="mt-1 text-sm text-red-600">{errors.telefono.message}</p>
          )}
        </div>
      </div>

      {/* Row 2: Expediente + Tipo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            N° Expediente
          </label>
          <input
            {...register("expediente")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-minka-500 focus:border-minka-500 outline-none"
            placeholder="00123-2026-0-1801-JR-PE-01"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Tipo de caso *
          </label>
          <select
            {...register("tipo_caso")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-minka-500 focus:border-minka-500 outline-none bg-white"
          >
            <option value="">Seleccionar...</option>
            {Object.entries(CASE_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          {errors.tipo_caso && (
            <p className="mt-1 text-sm text-red-600">{errors.tipo_caso.message}</p>
          )}
        </div>
      </div>

      {/* Row 3: Estado + Próxima fecha */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Estado
          </label>
          <select
            {...register("estado")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-minka-500 focus:border-minka-500 outline-none bg-white"
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Próxima fecha
          </label>
          <input
            {...register("proxima_fecha")}
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-minka-500 focus:border-minka-500 outline-none"
          />
        </div>
      </div>

      {/* Próxima acción */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Próxima acción
        </label>
        <input
          {...register("proxima_accion")}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-minka-500 focus:border-minka-500 outline-none"
          placeholder="Ej: Audiencia de juzgamiento"
        />
      </div>

      {/* Documentos pendientes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Documentos pendientes
        </label>
        <textarea
          {...register("documentos_pendientes")}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-minka-500 focus:border-minka-500 outline-none resize-none"
          placeholder="Ej: DNI del testigo, Contrato original"
        />
      </div>

      {/* Notas internas */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Notas internas
          <span className="font-normal text-gray-400 ml-1">(no se comparten con el cliente)</span>
        </label>
        <textarea
          {...register("notas")}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-minka-500 focus:border-minka-500 outline-none resize-none"
          placeholder="Notas privadas para el abogado..."
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          disabled={isLoading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-2 bg-minka-500 text-white rounded-lg hover:bg-minka-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Guardando...
            </span>
          ) : (
            "Guardar"
          )}
        </button>
      </div>
    </form>
  );
}
