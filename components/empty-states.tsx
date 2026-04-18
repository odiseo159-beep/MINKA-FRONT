import { Plus, RotateCcw } from "lucide-react";

interface EmptyStateProps {
  onAction?: () => void;
}

export function EmptyNoCases({ onAction }: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-4">
      <svg aria-hidden="true" className="w-24 h-24 mx-auto mb-6" viewBox="0 0 96 96" fill="none">
        <rect x="16" y="20" width="64" height="56" rx="4" className="fill-minka-50 stroke-minka-200" strokeWidth="2" />
        <path d="M16 28C16 25.7909 17.7909 24 20 24H76C78.2091 24 80 25.7909 80 28V32H16V28Z" className="fill-minka-100" />
        <circle cx="24" cy="28" r="2" className="fill-minka-300" />
        <circle cx="32" cy="28" r="2" className="fill-minka-300" />
        <circle cx="40" cy="28" r="2" className="fill-minka-300" />
        <line x1="36" y1="48" x2="60" y2="48" className="stroke-minka-300" strokeWidth="2" strokeLinecap="round" />
        <line x1="40" y1="56" x2="56" y2="56" className="stroke-minka-200" strokeWidth="2" strokeLinecap="round" />
        <circle cx="72" cy="64" r="14" className="fill-minka-500" />
        <line x1="72" y1="58" x2="72" y2="70" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="66" y1="64" x2="78" y2="64" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <p className="text-lg font-semibold text-gray-700 mb-1">No tienes casos registrados</p>
      <p className="text-sm text-gray-400 mb-6">Crea tu primer caso para comenzar a gestionar tus expedientes</p>
      {onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-minka-500 text-white rounded-lg hover:bg-minka-600 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" aria-hidden="true" />
          Nuevo caso
        </button>
      )}
    </div>
  );
}

export function EmptyNoResults({ onAction }: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-4">
      <svg aria-hidden="true" className="w-24 h-24 mx-auto mb-6" viewBox="0 0 96 96" fill="none">
        <circle cx="42" cy="42" r="22" className="fill-gray-50 stroke-gray-300" strokeWidth="2" />
        <circle cx="42" cy="42" r="14" className="stroke-gray-200" strokeWidth="2" strokeDasharray="4 4" />
        <line x1="58" y1="58" x2="76" y2="76" className="stroke-gray-400" strokeWidth="4" strokeLinecap="round" />
        <line x1="36" y1="38" x2="48" y2="46" className="stroke-minka-300" strokeWidth="2" strokeLinecap="round" />
        <line x1="48" y1="38" x2="36" y2="46" className="stroke-minka-300" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <p className="text-lg font-semibold text-gray-700 mb-1">Sin resultados</p>
      <p className="text-sm text-gray-400 mb-6">Intenta con otros filtros o busca algo diferente</p>
      {onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors font-medium"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}

interface EmptyErrorProps {
  message?: string;
  onRetry?: () => void;
}

export function EmptyError({ message, onRetry }: EmptyErrorProps) {
  return (
    <div className="text-center py-16 px-4">
      <svg aria-hidden="true" className="w-24 h-24 mx-auto mb-6" viewBox="0 0 96 96" fill="none">
        <path d="M48 12L88 80H8L48 12Z" className="fill-red-50 stroke-red-300" strokeWidth="2" strokeLinejoin="round" />
        <line x1="48" y1="36" x2="48" y2="56" className="stroke-red-400" strokeWidth="3" strokeLinecap="round" />
        <circle cx="48" cy="66" r="2.5" className="fill-red-400" />
      </svg>
      <p className="text-lg font-semibold text-gray-700 mb-1">Error al cargar los casos</p>
      <p className="text-sm text-gray-400 mb-6">{message || "Ocurrió un error inesperado"}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors font-medium border border-gray-200"
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
          Reintentar
        </button>
      )}
    </div>
  );
}
