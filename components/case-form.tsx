"use client";

import { useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, FileText, CheckCircle, AlertCircle, X, Plus } from "lucide-react";
import type { Case, CaseFormData } from "@/types";
import { STATUS_LABELS, CASE_TYPE_LABELS } from "@/types";
import { parseDocxFile, mapBackendResponse, parseImageFile, type ParsedDocument } from "@/lib/document-parser";
import { documentApi } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { HintTooltip } from "@/components/hint-tooltip";

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

const ALLOWED_EXTS = ["docx", "pdf", "jpg", "jpeg", "png", "webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB per file
const MAX_FILES = 10;

interface QueuedFile {
  file: File;
  /** Only set for the first parseable file */
  parseResult?: ParsedDocument;
  /** "primary" = used for form pre-fill; "extra" = will just be uploaded */
  role: "primary" | "extra";
  error?: string;
}

interface CaseFormProps {
  initialData?: Case;
  onSubmit: (data: CaseFormData, files?: File[], extractedFields?: Partial<CaseFormData>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CaseForm({ initialData, onSubmit, onCancel, isLoading }: CaseFormProps) {
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [parseState, setParseState] = useState<"idle" | "parsing">("idle");
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
      telefono:       initialData?.telefono || "",
      expediente:     initialData?.expediente || "",
      tipo_caso:      initialData?.tipo_caso || "",
      estado:         initialData?.estado || "nuevo",
      proxima_fecha:  initialData?.proxima_fecha || "",
      proxima_accion: initialData?.proxima_accion || "",
      documentos_pendientes: initialData?.documentos_pendientes || "",
      notas:          initialData?.notas || "",
    },
  });

  const fieldLabels: Record<string, string> = {
    nombre_cliente: "Cliente", telefono: "Teléfono", expediente: "Expediente",
    tipo_caso: "Tipo", estado: "Estado", notas: "Notas", documentos_pendientes: "Docs",
  };

  /** Returns true if this file type can be parsed for form auto-fill */
  const isParseable = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    return ALLOWED_EXTS.includes(ext);
  };

  /** Validate a file and return an error string if invalid, else null */
  const validateFile = (file: File): string | null => {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXTS.includes(ext)) return "Formato no permitido (usa DOCX, PDF, JPG, PNG o WEBP)";
    if (file.size > MAX_FILE_SIZE) return "El archivo supera 10 MB";
    return null;
  };

  const hasPrimary = queue.some((q) => q.role === "primary");

  /** Parse a file and pre-fill the form if it's the primary */
  const parseAndFill = useCallback(async (file: File): Promise<ParsedDocument | undefined> => {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    try {
      let result: ParsedDocument;
      if (["jpg", "jpeg", "png", "webp"].includes(ext)) {
        result = await parseImageFile(file, token || "");
      } else if (ext === "docx") {
        result = await parseDocxFile(file);
      } else {
        const response = await documentApi.extract(file, token || undefined);
        result = mapBackendResponse(response);
      }
      const currentValues = getValues();
      reset({ ...currentValues, ...result.caseData });
      return result;
    } catch {
      return undefined;
    }
  }, [reset, getValues, token]);

  const addFiles = useCallback(async (incoming: File[]) => {
    const toAdd = incoming.slice(0, MAX_FILES - queue.length);
    if (!toAdd.length) return;

    setParseState("parsing");

    const newEntries: QueuedFile[] = [];

    for (const file of toAdd) {
      const err = validateFile(file);
      if (err) {
        newEntries.push({ file, role: "extra", error: err });
        continue;
      }

      // First valid parseable file in the whole queue becomes primary
      if (!hasPrimary && !newEntries.some((e) => e.role === "primary") && isParseable(file)) {
        const parsed = await parseAndFill(file);
        newEntries.push({ file, role: "primary", parseResult: parsed });
      } else {
        newEntries.push({ file, role: "extra" });
      }
    }

    setQueue((prev) => [...prev, ...newEntries]);
    setParseState("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [queue, hasPrimary, parseAndFill]);

  const removeFile = useCallback((idx: number) => {
    setQueue((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      // If we removed the primary, promote the next parseable file
      if (prev[idx].role === "primary") {
        const newPrimary = next.findIndex((q) => !q.error && isParseable(q.file));
        if (newPrimary !== -1) next[newPrimary] = { ...next[newPrimary], role: "primary" };
      }
      return next;
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) addFiles(files);
  }, [addFiles]);

  const handleFormSubmit = useCallback(async (formData: CaseFormData) => {
    const primaryEntry = queue.find((q) => q.role === "primary");
    const files = queue.filter((q) => !q.error).map((q) => q.file);
    await onSubmit(
      {
        ...formData,
        telefono: formData.telefono.replace(/[\s\-\(\)]/g, "").replace(/^\+/, "").replace(/^51(\d{9})$/, "$1"),
        ...(primaryEntry?.parseResult?.rawText ? { documento_texto: primaryEntry.parseResult.rawText } : {}),
      },
      files.length ? files : undefined,
      primaryEntry?.parseResult?.caseData,
    );
  }, [onSubmit, queue]);

  const canAddMore = queue.length < MAX_FILES;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {/* Multi-file upload — only on create */}
      {!initialData && (
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
            Documentos del caso
            <span className="font-normal text-gray-400">(opcional — hasta {MAX_FILES})</span>
            <HintTooltip
              text="Sube uno o varios documentos. El primero se usa para auto-rellenar el formulario. Los demás se adjuntan al caso directamente."
              position="right"
            />
          </label>

          {/* Drop zone — shown when queue is empty OR we can still add more */}
          {(queue.length === 0 || canAddMore) && (
            <div
              role="button"
              tabIndex={0}
              aria-label="Subir documentos del caso"
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInputRef.current?.click(); } }}
              className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors duration-200
                ${isDragging ? "border-minka-500 bg-minka-50" : "border-gray-300 hover:border-minka-400 hover:bg-gray-50"}
                ${queue.length > 0 ? "py-3" : "p-6"}
              `}
            >
              {queue.length === 0 ? (
                <>
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-minka-600">Sube uno o más archivos</span>{" "}o arrastra aquí
                  </p>
                  <p className="text-xs text-gray-400 mt-1">DOCX, PDF, JPG, PNG, WEBP — máx. 10 MB c/u</p>
                </>
              ) : (
                <p className="text-xs text-minka-600 flex items-center justify-center gap-1">
                  <Plus className="w-3.5 h-3.5" />
                  Agregar otro documento ({MAX_FILES - queue.length} restante{MAX_FILES - queue.length !== 1 ? "s" : ""})
                </p>
              )}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".docx,.pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  if (files.length) addFiles(files);
                }}
              />
            </div>
          )}

          {/* Parsing spinner */}
          {parseState === "parsing" && (
            <div className="flex items-center gap-2 text-xs text-gray-500 px-1">
              <div className="w-3.5 h-3.5 border-2 border-minka-500/30 border-t-minka-500 rounded-full animate-spin" />
              Leyendo documento…
            </div>
          )}

          {/* File list */}
          {queue.length > 0 && (
            <ul className="space-y-1.5">
              {queue.map((entry, idx) => (
                <li
                  key={idx}
                  className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm
                    ${entry.error
                      ? "border-red-200 bg-red-50"
                      : entry.role === "primary"
                        ? "border-green-200 bg-green-50"
                        : "border-gray-200 bg-white"
                    }`}
                >
                  {entry.error ? (
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  ) : entry.role === "primary" ? (
                    <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                  )}

                  <span className="flex-1 min-w-0 truncate text-gray-700">{entry.file.name}</span>

                  {entry.role === "primary" && entry.parseResult && !entry.error && (
                    <span className="text-[10px] text-green-600 bg-green-100 rounded px-1.5 py-0.5 shrink-0">
                      {entry.parseResult.fieldsFound.map((f) => fieldLabels[f] || f).join(" · ")}
                    </span>
                  )}

                  {entry.error && (
                    <span className="text-[10px] text-red-600 shrink-0">{entry.error}</span>
                  )}

                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="text-gray-400 hover:text-gray-600 shrink-0"
                    title="Quitar archivo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Row 1: Nombre + Teléfono */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="nombre_cliente" className="block text-sm font-medium text-gray-700 mb-1.5">
            Nombre del cliente *
          </label>
          <input
            id="nombre_cliente"
            {...register("nombre_cliente")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-minka-500 focus:border-minka-500 outline-none"
            placeholder="María García"
          />
          {errors.nombre_cliente && (
            <p className="mt-1 text-sm text-red-600" role="alert">{errors.nombre_cliente.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1.5">
            Teléfono (WhatsApp) *
          </label>
          <input
            id="telefono"
            {...register("telefono")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-minka-500 focus:border-minka-500 outline-none"
            placeholder="987654321"
          />
          {errors.telefono && (
            <p className="mt-1 text-sm text-red-600" role="alert">{errors.telefono.message}</p>
          )}
        </div>
      </div>

      {/* Row 2: Expediente + Tipo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="expediente" className="block text-sm font-medium text-gray-700 mb-1.5">
            N° Expediente
          </label>
          <input
            id="expediente"
            {...register("expediente")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-minka-500 focus:border-minka-500 outline-none"
            placeholder="00123-2026-0-1801-JR-PE-01"
          />
        </div>

        <div>
          <label htmlFor="tipo_caso" className="block text-sm font-medium text-gray-700 mb-1.5">
            Tipo de caso *
          </label>
          <select
            id="tipo_caso"
            {...register("tipo_caso")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-minka-500 focus:border-minka-500 outline-none bg-white"
          >
            <option value="">Seleccionar...</option>
            {Object.entries(CASE_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          {errors.tipo_caso && (
            <p className="mt-1 text-sm text-red-600" role="alert">{errors.tipo_caso.message}</p>
          )}
        </div>
      </div>

      {/* Row 3: Estado + Próxima fecha */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-1.5">
            Estado
          </label>
          <select
            id="estado"
            {...register("estado")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-minka-500 focus:border-minka-500 outline-none bg-white"
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="proxima_fecha" className="block text-sm font-medium text-gray-700 mb-1.5">
            Próxima fecha
          </label>
          <input
            id="proxima_fecha"
            {...register("proxima_fecha")}
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-minka-500 focus:border-minka-500 outline-none"
          />
        </div>
      </div>

      {/* Próxima acción */}
      <div>
        <label htmlFor="proxima_accion" className="block text-sm font-medium text-gray-700 mb-1.5">
          Próxima acción
        </label>
        <input
          id="proxima_accion"
          {...register("proxima_accion")}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-minka-500 focus:border-minka-500 outline-none"
          placeholder="Ej: Audiencia de juzgamiento"
        />
      </div>

      {/* Documentos pendientes */}
      <div>
        <label htmlFor="documentos_pendientes" className="block text-sm font-medium text-gray-700 mb-1.5">
          Documentos pendientes
        </label>
        <textarea
          id="documentos_pendientes"
          {...register("documentos_pendientes")}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-minka-500 focus:border-minka-500 outline-none resize-none"
          placeholder="Ej: DNI del testigo, Contrato original"
        />
      </div>

      {/* Notas internas */}
      <div>
        <label htmlFor="notas" className="block text-sm font-medium text-gray-700 mb-1.5">
          Notas internas
          <span className="font-normal text-gray-400 ml-1">(no se comparten con el cliente)</span>
        </label>
        <textarea
          id="notas"
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
          disabled={isLoading || parseState === "parsing"}
          className="px-5 py-2 bg-minka-500 text-white rounded-lg hover:bg-minka-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Guardando...
            </span>
          ) : "Guardar"}
        </button>
      </div>
    </form>
  );
}
