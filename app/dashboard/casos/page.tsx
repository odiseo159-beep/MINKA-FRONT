"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCases, useCreateCase, useUpdateCase, useNotifyClient, filterCases } from "@/hooks/use-cases";
import { casesApi } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { useDebounce } from "@/hooks/use-debounce";
import { TableRowSkeleton } from "@/components/skeletons";
import { EmptyNoCases, EmptyNoResults, EmptyError } from "@/components/empty-states";
import { CaseCard } from "@/components/case-card";
import { CaseCardSkeleton } from "@/components/skeletons";
import { useSortState, sortCases } from "@/hooks/use-sort";
import { usePagination } from "@/hooks/use-pagination";
import { Pagination } from "@/components/pagination";
import type { SortField } from "@/hooks/use-sort";
import { CaseForm } from "@/components/case-form";
import { StatsCards } from "@/components/stats-cards";
import { useToast } from "@/components/ui/use-toast";
import { formatDate, formatRelativeTime, getDateUrgencyClass } from "@/lib/utils";
import { STATUS_LABELS, STATUS_COLORS, CASE_TYPE_LABELS, DEFAULT_FILTERS } from "@/types";
import type { Case, CaseFormData, CaseFilters } from "@/types";
import { FilterBar } from "@/components/filter-bar";
import {
  Edit2,
  MessageSquare,
  X,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OnboardingTour } from "@/components/onboarding-tour";

const CASOS_TOUR_STEPS = [
  {
    title: "Gestiona tus casos",
    body: "Aquí están todos tus expedientes. Puedes crearlos, editarlos, filtrarlos y ordenarlos por cualquier columna.",
    placement: "center" as const,
  },
  {
    target: "casos-nuevo",
    title: "Crear un nuevo caso",
    body: "Sube el documento del expediente (.docx o PDF) y la IA pre-llenará los campos automáticamente.",
    placement: "bottom" as const,
  },
  {
    target: "casos-tabla",
    title: "Detalle del caso",
    body: "Haz clic en cualquier fila para ver el expediente completo, documentos subidos y el Agente Legal IA.",
    placement: "top" as const,
  },
];

export default function CasosPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-minka-500" /></div>}>
      <CasosContent />
    </Suspense>
  );
}

function CasosContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: cases, isLoading, error, refetch } = useCases();
  const createCase = useCreateCase();
  const updateCase = useUpdateCase();
  const notifyClient = useNotifyClient();
  const { toast } = useToast();
  const token = useAuthStore((state) => state.token);

  const [filters, setFilters] = useState<CaseFilters>(DEFAULT_FILTERS);
  const debouncedSearch = useDebounce(filters.search, 300);
  const { sortField, sortDirection, toggleSort } = useSortState();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<Case | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  // Open modal if ?new=true in URL
  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  // Focus management for modal
  useEffect(() => {
    if (isModalOpen) {
      lastFocusedRef.current = document.activeElement as HTMLElement;
      const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    } else {
      lastFocusedRef.current?.focus();
    }
  }, [isModalOpen]);

  // Filter → sort → paginate
  const filteredCases = cases ? filterCases(cases, { ...filters, search: debouncedSearch }) : [];
  const sortedCases = sortCases(filteredCases, sortField, sortDirection);
  const pagination = usePagination(sortedCases, 10);

  // Calculate stats
  const stats = {
    total: cases?.length || 0,
    activos: cases?.filter(c => !["resuelto", "archivado"].includes(c.estado)).length || 0,
    resueltos: cases?.filter(c => c.estado === "resuelto").length || 0,
    pendientes_documento: cases?.filter(c => c.estado === "pendiente_documento").length || 0,
  };

  // Handle form submit
  const handleSubmit = async (data: CaseFormData, files?: File[]) => {
    try {
      if (editingCase) {
        await updateCase.mutateAsync({ id: editingCase.id, data });
        toast({ title: "Caso actualizado", description: "Los cambios se guardaron correctamente." });
      } else {
        const newCase = await createCase.mutateAsync(data);
        if (files?.length && newCase?.id) {
          let uploaded = 0;
          for (const f of files) {
            try {
              await casesApi.uploadDocument(newCase.id, f, token || undefined);
              uploaded++;
            } catch {
              // continue uploading remaining files even if one fails
            }
          }
          const msg = uploaded === files.length
            ? `Caso creado con ${uploaded} documento${uploaded !== 1 ? "s" : ""}.`
            : `Caso creado. ${uploaded}/${files.length} documentos subidos.`;
          toast({ title: "Caso creado", description: msg });
        } else {
          toast({ title: "Caso creado", description: "El nuevo caso se registró correctamente." });
        }
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
      await notifyClient.mutateAsync({
        id: caso.id,
        nombreCliente: caso.nombre_cliente,
        telefono: caso.telefono,
      });
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

  const closeModal = () => { setIsModalOpen(false); setEditingCase(null); };

  const handleModalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { closeModal(); return; }
    if (e.key !== "Tab") return;
    const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page header */}
      <div>
        <p className="eyebrow">Cartera de casos</p>
        <h1 className="text-2xl font-bold text-gray-900">Casos activos</h1>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} isLoading={isLoading} />

      {/* Filters */}
      <FilterBar
        filters={filters}
        onChange={setFilters}
        onClearAll={() => setFilters(DEFAULT_FILTERS)}
        onNewCase={() => { setEditingCase(null); setIsModalOpen(true); }}
      />

      {/* Mobile card view */}
      <div className="lg:hidden space-y-3">
        {isLoading ? (
          <CaseCardSkeleton count={3} />
        ) : error ? (
          <EmptyError
            message={error instanceof Error ? error.message : undefined}
            onRetry={() => refetch()}
          />
        ) : cases?.length === 0 ? (
          <EmptyNoCases onAction={() => { setEditingCase(null); setIsModalOpen(true); }} />
        ) : filteredCases.length === 0 ? (
          <EmptyNoResults onAction={() => setFilters(DEFAULT_FILTERS)} />
        ) : (
          pagination.paginatedItems.map((caso) => (
            <CaseCard
              key={caso.id}
              caso={caso}
              onEdit={handleEdit}
              onNotify={handleNotify}
            />
          ))
        )}
      </div>

      {/* Desktop table view */}
      <div data-tour="casos-tabla" className="hidden lg:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {([
                  { field: "nombre_cliente" as SortField, label: "Cliente" },
                  { field: "tipo_caso" as SortField, label: "Tipo" },
                  { field: "estado" as SortField, label: "Estado" },
                  { field: "proxima_fecha" as SortField, label: "Próxima fecha" },
                  { field: "fecha_actualizacion" as SortField, label: "Actualizado" },
                ]).map(({ field, label }) => {
                  const isActive = sortField === field;
                  const SortIcon = isActive
                    ? sortDirection === "asc" ? ArrowUp : ArrowDown
                    : ArrowUpDown;
                  return (
                    <th
                      key={field}
                      onClick={() => toggleSort(field)}
                      aria-sort={isActive ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
                      className={cn(
                        "px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 transition-colors",
                        isActive ? "text-minka-600" : "text-gray-500"
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        {label}
                        <SortIcon className="w-3.5 h-3.5" />
                      </div>
                    </th>
                  );
                })}
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <TableRowSkeleton rows={5} />
              ) : error ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyError
                      message={error instanceof Error ? error.message : undefined}
                      onRetry={() => refetch()}
                    />
                  </td>
                </tr>
              ) : cases?.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyNoCases onAction={() => { setEditingCase(null); setIsModalOpen(true); }} />
                  </td>
                </tr>
              ) : filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyNoResults onAction={() => setFilters(DEFAULT_FILTERS)} />
                  </td>
                </tr>
              ) : (
                pagination.paginatedItems.map((caso) => (
                  <tr
                    key={caso.id}
                    tabIndex={0}
                    onClick={() => router.push(`/dashboard/casos/${caso.id}`)}
                    onKeyDown={(e) => { if (e.key === "Enter") router.push(`/dashboard/casos/${caso.id}`); }}
                    className="hover:bg-gray-50 transition-colors cursor-pointer focus:outline-none focus:bg-gray-100"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{caso.nombre_cliente}</p>
                        <p className="text-xs text-gray-400 font-mono">{caso.expediente || "—"}</p>
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
                    <td className="px-6 py-4 text-sm">
                      {(() => {
                        const estaVencido = caso.proxima_fecha && new Date(caso.proxima_fecha) < new Date();
                        return estaVencido ? (
                          <span className="inline-block px-2 py-0.5 text-xs font-bold rounded-full bg-red-100 text-red-700">
                            VENCIDO
                          </span>
                        ) : (
                          <span className={getDateUrgencyClass(caso.proxima_fecha)}>
                            {formatDate(caso.proxima_fecha)}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatRelativeTime(caso.fecha_actualizacion)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEdit(caso); }}
                          aria-label={`Editar caso de ${caso.nombre_cliente}`}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleNotify(caso); }}
                          aria-label={`Notificar a ${caso.nombre_cliente} por WhatsApp`}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" aria-hidden="true" />
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

      {/* Pagination (shared between mobile and desktop) */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden lg:rounded-none lg:border-0 lg:border-t">
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
          rowsPerPage={pagination.rowsPerPage}
          onPageChange={pagination.goToPage}
          onRowsPerPageChange={pagination.setRowsPerPage}
        />
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            aria-hidden="true"
            onClick={closeModal}
          />

          {/* Modal content */}
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="caso-modal-title"
            onKeyDown={handleModalKeyDown}
            className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto animate-fadeIn"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 id="caso-modal-title" className="text-lg font-semibold text-gray-900">
                {editingCase ? "Editar caso" : "Nuevo caso"}
              </h3>
              <button
                onClick={closeModal}
                aria-label="Cerrar"
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="p-6">
              <CaseForm
                initialData={editingCase || undefined}
                onSubmit={handleSubmit}
                onCancel={closeModal}
                isLoading={createCase.isPending || updateCase.isPending}
              />
            </div>
          </div>
        </div>
      )}

      <OnboardingTour steps={CASOS_TOUR_STEPS} storageKey="minka_tour_casos" />
    </div>
  );
}
