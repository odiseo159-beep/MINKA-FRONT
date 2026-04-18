"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Users, Search, Phone, Briefcase, ArrowRight } from "lucide-react";
import { useCases } from "@/hooks/use-cases";
import { extractClients } from "@/lib/client-utils";
import { CASE_TYPE_LABELS, STATUS_COLORS, STATUS_LABELS } from "@/types";
import type { ClientSummary } from "@/lib/client-utils";

export default function ClientesPage() {
  const { data: cases = [], isLoading } = useCases();
  const [search, setSearch] = useState("");

  const clients = useMemo(() => extractClients(cases), [cases]);

  const filtered = useMemo(() => {
    if (!search) return clients;
    const q = search.toLowerCase();
    return clients.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.telefono.includes(q)
    );
  }, [clients, search]);

  if (isLoading) {
    return (
      <div className="animate-fadeIn">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500">Cargando...</p>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 w-40 bg-gray-200 rounded mb-2" />
                  <div className="h-3 w-24 bg-gray-100 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500">
            {clients.length} cliente{clients.length !== 1 ? "s" : ""} registrado{clients.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-minka-500/20 focus:border-minka-500"
        />
      </div>

      {/* Client list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">
            {search ? "No se encontraron clientes" : "No hay clientes registrados"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((client) => (
            <ClientCard key={client.telefono} client={client} />
          ))}
        </div>
      )}
    </div>
  );
}

function ClientCard({ client }: { client: ClientSummary }) {
  const initials = client.nombre
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-11 h-11 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-gray-900 truncate">{client.nombre}</h3>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                  <Briefcase className="w-3 h-3" />
                  {client.totalCasos} caso{client.totalCasos !== 1 ? "s" : ""}
                </span>
                {client.casosActivos > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-green-50 text-green-700">
                    {client.casosActivos} activo{client.casosActivos !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                {client.telefono}
              </span>
              <span className="text-gray-300">|</span>
              <span className="truncate">
                {client.tipos.map((t) => CASE_TYPE_LABELS[t] || t).join(", ")}
              </span>
            </div>

            {/* Last case */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-1">Último caso:</p>
              <Link
                href={`/dashboard/casos/${client.ultimoCaso.id}`}
                className="flex items-center justify-between group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-full ${
                      STATUS_COLORS[client.ultimoCaso.estado] || "badge-archivado"
                    }`}
                  >
                    {STATUS_LABELS[client.ultimoCaso.estado] || client.ultimoCaso.estado}
                  </span>
                  <span className="text-sm text-gray-700 truncate">
                    {client.ultimoCaso.proxima_accion || client.ultimoCaso.tipo_caso}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-minka-500 transition-colors flex-shrink-0 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
