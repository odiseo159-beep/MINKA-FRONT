"use client";

import { useRouter } from "next/navigation";
import { Edit2, MessageSquare } from "lucide-react";
import { formatDate, formatRelativeTime, getDateUrgencyClass } from "@/lib/utils";
import { STATUS_LABELS, STATUS_COLORS, CASE_TYPE_LABELS } from "@/types";
import type { Case } from "@/types";

interface CaseCardProps {
  caso: Case;
  onEdit: (caso: Case) => void;
  onNotify: (caso: Case) => void;
}

export function CaseCard({ caso, onEdit, onNotify }: CaseCardProps) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/dashboard/casos/${caso.id}`)}
      className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all"
    >
      {/* Header: name + status */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900 truncate">{caso.nombre_cliente}</p>
          <p className="text-sm text-gray-500">{caso.expediente || "Sin expediente"}</p>
        </div>
        <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${STATUS_COLORS[caso.estado]}`}>
          {STATUS_LABELS[caso.estado]}
        </span>
      </div>

      {/* Details */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="text-gray-500">
          {CASE_TYPE_LABELS[caso.tipo_caso] || caso.tipo_caso}
        </span>
        {caso.proxima_fecha && (
          <span className={getDateUrgencyClass(caso.proxima_fecha)}>
            {formatDate(caso.proxima_fecha)}
          </span>
        )}
        <span className="text-gray-400">
          {formatRelativeTime(caso.fecha_actualizacion)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(caso); }}
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Editar"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onNotify(caso); }}
          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
          title="Notificar por WhatsApp"
        >
          <MessageSquare className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
