"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useCases, useCreateCase, useUpdateCase, useNotifyClient, filterCases } from "@/hooks/use-cases";
import { CaseForm } from "@/components/case-form";
import { StatsCards } from "@/components/stats-cards";
import { useToast } from "@/components/ui/use-toast";
import { formatDate, formatRelativeTime, getDateUrgencyClass } from "@/lib/utils";
import { STATUS_LABELS, STATUS_COLORS, CASE_TYPE_LABELS } from "@/types";
import type { Case, CaseFormData, CaseStatus } from "@/types";
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  MessageSquare, 
  Scale,
  MoreHorizontal,
  X
} from "lucide-react";

export default function CasosPage() {
  const searchParams = useSearchParams();
  const { data: cases, isLoading, error } = useCases();
  const createCase = useCreateCase();
  const updateCase = useUpdateCase();
  const notifyClient = useNotifyClient();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CaseStatus | "">("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<Case | null>(null);

  // Open modal if ?new=true in URL
  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  // Filter cases
  const filteredCases = cases ? filterCases(cases, search, statusFilter) : [];

  // Calculate stats
  const stats = {
    total: cases?.length || 0,
    activos: cases?.filter(c => !["resuelto", "archivado"].includes(c.estado)).length || 0,
    resueltos: cases?.filter(c => c.estado === "resuelto").length || 0,
    pendientes_documento: cases?.filter(c => c.estado === "pendiente_documento").length || 0,
  };

  // Handle form submit
  const handleSubmit = async (data: CaseFormData) => {
    try {
      if (editingCase) {
        await updateCase.mutateAsync({ id: editingCase.id, data });
        toast({ title: "Caso actualizado", description: "Los cambios se guardaron correctamente." });
      } else {
        await createCase.mutateAsync(data);
        toast({ title: "Caso creado", description: "El nuevo caso se registró correctamente." });
      }
      setIsModalOpen(false);
      setEditingCase(null);
    } catch (err) {
      toast({ 
        title: "Error", 
        description: err instanceof Error ? err.message : "No se pudo guardar el caso",
        variant: "destructive"
      });
    }
  };

  // Handle notify
  const handleNotify = async (caso: Case) => {
    if (!confirm(`¿Enviar notificación a ${caso.nombre_cliente} por WhatsApp?`)) return;
    
    try {
      await notifyClient.mutateAsync(caso.id);
      toast({ title: "Notificación enviada", description: `Se notificó a ${caso.nombre_cliente}` });
    } catch (err) {
      toast({ 
        title: "Error", 
        description: "No se pudo enviar la notificación",
        variant: "destructive"
      });
    }
  };

  // Handle edit
  const handleEdit = (caso: Case) => {
    setEditingCase(caso);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Stats */}
      <StatsCards stats={stats} isLoading={isLoading} />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o expediente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-minka-500 focus:border-minka-500 outline-none"
          />
        </div>

        {/* Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CaseStatus | "")}
            className="pl-9 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-minka-500 focus:border-minka-500 outline-none appearance-none bg-white min-w-[160px]"
          >
            <option value="">Todos los estados</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* New case button */}
        <button
          onClick={() => { setEditingCase(null); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-minka-500 text-white rounded-lg hover:bg-minka-600 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Nuevo caso
        </button>
      </div>

      {/* Cases table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Próxima fecha
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actualizado
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 bg-gray-200 rounded-full w-20 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-8 bg-gray-200 rounded w-24 ml-auto animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-gray-400 mb-2">
                      <Scale className="w-12 h-12 mx-auto" />
                    </div>
                    <p className="text-gray-600 font-medium">No hay casos</p>
                    <p className="text-gray-400 text-sm">
                      {search || statusFilter 
                        ? "Intenta con otros filtros" 
                        : "Crea tu primer caso para comenzar"}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCases.map((caso) => (
                  <tr key={caso.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{caso.nombre_cliente}</p>
                        <p className="text-sm text-gray-500">{caso.expediente || "Sin expediente"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {CASE_TYPE_LABELS[caso.tipo_caso] || caso.tipo_caso}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[caso.estado]}`}>
                        {STATUS_LABELS[caso.estado]}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm ${getDateUrgencyClass(caso.proxima_fecha)}`}>
                      {formatDate(caso.proxima_fecha)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatRelativeTime(caso.fecha_actualizacion)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(caso)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleNotify(caso)}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Notificar por WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => { setIsModalOpen(false); setEditingCase(null); }}
          />
          
          {/* Modal content */}
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingCase ? "Editar caso" : "Nuevo caso"}
              </h3>
              <button
                onClick={() => { setIsModalOpen(false); setEditingCase(null); }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <CaseForm
                initialData={editingCase || undefined}
                onSubmit={handleSubmit}
                onCancel={() => { setIsModalOpen(false); setEditingCase(null); }}
                isLoading={createCase.isPending || updateCase.isPending}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
