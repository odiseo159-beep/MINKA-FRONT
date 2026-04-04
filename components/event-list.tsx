"use client";

import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { STATUS_LABELS, STATUS_COLORS, CASE_TYPE_LABELS } from "@/types";
import type { Case } from "@/types";

interface EventListProps {
  cases: Case[];
  dateStr: string | null;
}

export function EventList({ cases, dateStr }: EventListProps) {
  if (!dateStr) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-center py-8">
          <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Selecciona un día para ver los eventos</p>
        </div>
      </div>
    );
  }

  const dateLabel = format(new Date(dateStr + "T00:00:00"), "EEEE d 'de' MMMM", { locale: es });

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 capitalize">{dateLabel}</h3>
        <p className="text-sm text-gray-500">
          {cases.length === 0
            ? "Sin eventos programados"
            : `${cases.length} evento${cases.length > 1 ? "s" : ""}`}
        </p>
      </div>

      {cases.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-sm text-gray-400">No hay audiencias ni plazos para este día</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {cases.map((caso) => (
            <li key={caso.id}>
              <Link
                href={`/dashboard/casos/${caso.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate">{caso.nombre_cliente}</p>
                  <p className="text-sm text-gray-500 truncate">
                    {caso.proxima_accion || CASE_TYPE_LABELS[caso.tipo_caso] || caso.tipo_caso}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span
                      className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded-full ${
                        STATUS_COLORS[caso.estado] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {STATUS_LABELS[caso.estado] || caso.estado}
                    </span>
                    {caso.expediente && (
                      <span className="text-xs text-gray-400">{caso.expediente}</span>
                    )}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-minka-500 transition-colors flex-shrink-0 ml-3" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
