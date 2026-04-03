"use client";

import { Calendar, Clock, Plus } from "lucide-react";

export default function CalendarioPage() {
  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
          <p className="text-gray-500">Gestiona tus audiencias, plazos y eventos</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-minka-500 text-white rounded-lg hover:bg-minka-600 transition-colors">
          <Plus className="w-5 h-5" />
          Nuevo evento
        </button>
      </div>

      {/* Coming soon placeholder */}
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="w-20 h-20 bg-minka-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Calendar className="w-10 h-10 text-minka-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Próximamente
        </h2>
        <p className="text-gray-500 max-w-md mx-auto mb-6">
          El calendario de Minka te permitirá visualizar todas tus audiencias, 
          plazos procesales y reuniones en un solo lugar, con alertas automáticas.
        </p>
        <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Vista mensual/semanal
          </span>
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Sync con Google Calendar
          </span>
        </div>
      </div>
    </div>
  );
}
