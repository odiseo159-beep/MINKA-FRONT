"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Case, CaseFormData } from "@/types";
import { STATUS_LABELS, CASE_TYPE_LABELS } from "@/types";

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
  const {
    register,
    handleSubmit,
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
