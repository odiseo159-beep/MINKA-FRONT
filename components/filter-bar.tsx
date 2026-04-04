"use client";

import { Search, Filter, X, Calendar } from "lucide-react";
import { STATUS_LABELS, CASE_TYPE_LABELS } from "@/types";
import type { CaseFilters } from "@/types";

interface FilterBarProps {
  filters: CaseFilters;
  onChange: (filters: CaseFilters) => void;
  onClearAll: () => void;
  onNewCase: () => void;
}

export function FilterBar({ filters, onChange, onClearAll, onNewCase }: FilterBarProps) {
  const update = (partial: Partial<CaseFilters>) => {
    onChange({ ...filters, ...partial });
  };

  const activeFilterCount = [
    filters.status,
    filters.caseType,
    filters.dateFrom,
    filters.dateTo,
  ].filter(Boolean).length;

  return (
    <div className="space-y-3">
      {/* Main filter row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o expediente..."
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-minka-500 focus:border-minka-500 outline-none"
          />
        </div>

        {/* Status filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={filters.status}
            onChange={(e) => update({ status: e.target.value })}
            className="pl-9 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-minka-500 focus:border-minka-500 outline-none appearance-none bg-white min-w-[160px]"
          >
            <option value="">Todos los estados</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Case type filter */}
        <div className="relative">
          <select
            value={filters.caseType}
            onChange={(e) => update({ caseType: e.target.value })}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-minka-500 focus:border-minka-500 outline-none appearance-none bg-white min-w-[160px]"
          >
            <option value="">Todos los tipos</option>
            {Object.entries(CASE_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* New case button */}
        <button
          onClick={onNewCase}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-minka-500 text-white rounded-lg hover:bg-minka-600 transition-colors font-medium whitespace-nowrap"
        >
          <span className="text-lg leading-none">+</span>
          Nuevo caso
        </button>
      </div>

      {/* Date range row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>Próxima fecha:</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => update({ dateFrom: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-minka-500 focus:border-minka-500 outline-none"
            placeholder="Desde"
          />
          <span className="text-gray-400 text-sm">—</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => update({ dateTo: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-minka-500 focus:border-minka-500 outline-none"
            placeholder="Hasta"
          />
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {filters.status && (
            <FilterChip
              label={`Estado: ${STATUS_LABELS[filters.status]}`}
              onRemove={() => update({ status: "" })}
            />
          )}
          {filters.caseType && (
            <FilterChip
              label={`Tipo: ${CASE_TYPE_LABELS[filters.caseType]}`}
              onRemove={() => update({ caseType: "" })}
            />
          )}
          {filters.dateFrom && (
            <FilterChip
              label={`Desde: ${filters.dateFrom}`}
              onRemove={() => update({ dateFrom: "" })}
            />
          )}
          {filters.dateTo && (
            <FilterChip
              label={`Hasta: ${filters.dateTo}`}
              onRemove={() => update({ dateTo: "" })}
            />
          )}
          {activeFilterCount >= 2 && (
            <button
              onClick={onClearAll}
              className="text-sm text-minka-600 hover:text-minka-700 font-medium ml-1"
            >
              Limpiar todos
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-minka-50 text-minka-700 border border-minka-200">
      {label}
      <button
        onClick={onRemove}
        className="hover:bg-minka-100 rounded-full p-0.5 transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}
