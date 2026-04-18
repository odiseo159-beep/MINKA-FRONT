"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useNotificationStore } from "@/lib/notification-store";
import { formatRelativeTime } from "@/lib/utils";
import {
  Bell,
  MessageSquare,
  CheckCircle,
  XCircle,
  Trash2,
  Search,
} from "lucide-react";

type EstadoFilter = "todos" | "enviado" | "error";

export default function NotificacionesPage() {
  const { notifications, clearHistory } = useNotificationStore();
  const [filtroEstado, setFiltroEstado] = useState<EstadoFilter>("todos");
  const [busqueda, setBusqueda] = useState("");

  const filtered = useMemo(() => {
    let result = notifications;

    if (filtroEstado !== "todos") {
      result = result.filter((n) => n.estado === filtroEstado);
    }

    if (busqueda.trim()) {
      const term = busqueda.toLowerCase();
      result = result.filter((n) =>
        n.nombreCliente.toLowerCase().includes(term)
      );
    }

    return result;
  }, [notifications, filtroEstado, busqueda]);

  const handleClear = () => {
    if (
      confirm(
        "¿Estás seguro de que quieres borrar todo el historial de notificaciones?"
      )
    ) {
      clearHistory();
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-gray-400" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Historial de Notificaciones
            </h1>
            <p className="text-sm text-gray-500">
              {notifications.length}{" "}
              {notifications.length === 1
                ? "notificacion registrada"
                : "notificaciones registradas"}
            </p>
          </div>
        </div>

        {notifications.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Limpiar historial
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre de cliente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-minka-500/20 focus:border-minka-500"
            />
          </div>

          {/* Estado filter */}
          <div className="flex gap-2">
            {(
              [
                { value: "todos", label: "Todos" },
                { value: "enviado", label: "Enviados" },
                { value: "error", label: "Errores" },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                onClick={() => setFiltroEstado(option.value)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  filtroEstado === option.value
                    ? "bg-gray-200 text-gray-900 border border-gray-300 font-semibold"
                    : "text-gray-500 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notification list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {notifications.length === 0
                ? "Sin notificaciones"
                : "No se encontraron resultados"}
            </h3>
            <p className="text-sm text-gray-500">
              {notifications.length === 0
                ? "Las notificaciones enviadas a clientes aparecerán aquí."
                : "Intenta cambiar los filtros de búsqueda."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((notification) => (
              <div
                key={notification.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Tipo icon */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      notification.estado === "enviado"
                        ? "bg-green-50"
                        : "bg-red-50"
                    }`}
                  >
                    <MessageSquare
                      className={`w-5 h-5 ${
                        notification.estado === "enviado"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    />
                  </div>

                  <div>
                    <p className="font-medium text-gray-900">
                      {notification.nombreCliente}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm text-gray-500">
                        {formatRelativeTime(notification.fecha)}
                      </span>
                      <span className="text-gray-300">|</span>
                      <Link
                        href={`/dashboard/casos/${notification.casoId}`}
                        className="text-sm text-minka-500 hover:text-minka-600"
                      >
                        Ver caso
                      </Link>
                    </div>
                    {notification.mensaje && notification.estado === "error" && (
                      <p className="text-xs text-red-500 mt-1">
                        {notification.mensaje}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Tipo badge */}
                  <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                    WhatsApp
                  </span>

                  {/* Estado badge */}
                  {notification.estado === "enviado" ? (
                    <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3" />
                      Enviado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800">
                      <XCircle className="w-3 h-3" />
                      Error
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
