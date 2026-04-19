"use client";

import Link from "next/link";
import { useCases, useDashboardStats } from "@/hooks/use-cases";
import { StatsCards } from "@/components/stats-cards";
import { formatDate, formatRelativeTime, getDateUrgencyClass } from "@/lib/utils";
import { STATUS_LABELS, STATUS_COLORS, CASE_TYPE_LABELS } from "@/types";
import { ArrowRight, Plus, Clock, AlertTriangle, CheckCircle, Calendar, BarChart3 } from "lucide-react";

export default function DashboardPage() {
  const { data: cases, isLoading } = useCases();
  const { stats } = useDashboardStats();

  // Get urgent cases (próxima fecha <= 7 días)
  const urgentCases = cases?.filter((c) => {
    if (!c.proxima_fecha || c.estado === "resuelto" || c.estado === "archivado") return false;
    const date = new Date(c.proxima_fecha);
    const today = new Date();
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }) || [];

  // Get recent cases
  const recentCases = cases?.slice(0, 5) || [];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page header */}
      <div>
        <p className="eyebrow">Panel de control</p>
        <h1 className="text-2xl font-bold text-gray-900">Resumen general</h1>
      </div>

      {/* Stats cards */}
      <StatsCards stats={stats} isLoading={isLoading} />

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent cases */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" aria-hidden="true" />
              <h3 className="font-semibold text-gray-900">Casos urgentes</h3>
            </div>
            <span className="text-sm text-gray-500">{urgentCases.length} casos</span>
          </div>

          <div className="divide-y divide-gray-100">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : urgentCases.length === 0 ? (
              <div className="p-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" aria-hidden="true" />
                <p className="text-gray-600">No hay casos urgentes</p>
                <p className="text-sm text-gray-400">¡Todo bajo control!</p>
              </div>
            ) : (
              urgentCases.slice(0, 4).map((caso) => (
                <Link
                  key={caso.id}
                  href={`/dashboard/casos/${caso.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{caso.nombre_cliente}</p>
                    <p className="text-sm text-gray-500">
                      {caso.proxima_accion || CASE_TYPE_LABELS[caso.tipo_caso] || caso.tipo_caso}
                    </p>
                  </div>
                  <div className="text-right">
                    {(() => {
                      const estaVencido = caso.proxima_fecha && new Date(caso.proxima_fecha) < new Date();
                      return estaVencido ? (
                        <span className="inline-block px-2 py-0.5 text-xs font-bold rounded-full bg-red-100 text-red-700">
                          VENCIDO
                        </span>
                      ) : (
                        <p className={`text-sm font-medium ${getDateUrgencyClass(caso.proxima_fecha)}`}>
                          {formatDate(caso.proxima_fecha)}
                        </p>
                      );
                    })()}
                    <span className={`inline-block px-2 py-0.5 text-xs rounded-full mt-0.5 ${STATUS_COLORS[caso.estado]}`}>
                      {STATUS_LABELS[caso.estado]}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>

          {urgentCases.length > 4 && (
            <Link
              href="/dashboard/casos?filter=urgente"
              className="block px-6 py-3 text-center text-sm text-gray-500 hover:bg-gray-50 border-t border-gray-100 hover:text-gray-900 transition-colors"
            >
              Ver todos los casos urgentes
              <ArrowRight className="inline w-4 h-4 ml-1" aria-hidden="true" />
            </Link>
          )}
        </div>

        {/* Recent activity */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" aria-hidden="true" />
              <h3 className="font-semibold text-gray-900">Actividad reciente</h3>
            </div>
            <Link
              href="/dashboard/casos"
              className="text-sm text-minka-500 hover:text-minka-600"
            >
              Ver todos
            </Link>
          </div>

          <div className="divide-y divide-gray-100">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : recentCases.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500 mb-4">No hay casos registrados</p>
                <Link
                  href="/dashboard/casos?new=true"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-minka-500 text-white rounded-lg hover:bg-minka-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Crear primer caso
                </Link>
              </div>
            ) : (
              recentCases.map((caso) => (
                <Link
                  key={caso.id}
                  href={`/dashboard/casos/${caso.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{caso.nombre_cliente}</p>
                    <p className="text-sm text-gray-500">
                      {caso.expediente || CASE_TYPE_LABELS[caso.tipo_caso] || caso.tipo_caso}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${STATUS_COLORS[caso.estado]}`}>
                      {STATUS_LABELS[caso.estado]}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatRelativeTime(caso.fecha_actualizacion)}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Acciones rápidas</h3>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/casos?new=true"
            className="inline-flex items-center gap-2 px-4 py-2 bg-minka-500 text-white rounded-lg hover:bg-minka-600 transition-colors"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Nuevo caso
          </Link>
          <Link
            href="/dashboard/calendario"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Calendar className="w-4 h-4" aria-hidden="true" />
            Ver calendario
          </Link>
          <Link
            href="/dashboard/reportes"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <BarChart3 className="w-4 h-4" aria-hidden="true" />
            Generar reporte
          </Link>
        </div>
      </div>
    </div>
  );
}
