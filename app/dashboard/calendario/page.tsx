"use client";

import { useState, useMemo } from "react";
import { Calendar } from "lucide-react";
import { useCases } from "@/hooks/use-cases";
import { CalendarView } from "@/components/calendar-view";
import { EventList } from "@/components/event-list";

export default function CalendarioPage() {
  const { data: cases = [], isLoading } = useCases();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Only cases that have a proxima_fecha
  const casesWithDate = useMemo(
    () => cases.filter((c) => !!c.proxima_fecha),
    [cases]
  );

  // Cases for selected date
  const selectedCases = useMemo(() => {
    if (!selectedDate) return [];
    return casesWithDate.filter(
      (c) => c.proxima_fecha && c.proxima_fecha.slice(0, 10) === selectedDate
    );
  }, [casesWithDate, selectedDate]);

  if (isLoading) {
    return (
      <div className="animate-fadeIn">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
            <p className="text-gray-500">Gestiona tus audiencias, plazos y eventos</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Calendar className="w-10 h-10 text-gray-300" />
          </div>
          <div className="h-4 w-48 bg-gray-200 rounded mx-auto animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
          <p className="text-gray-500">
            {casesWithDate.length === 0
              ? "No hay eventos programados"
              : `${casesWithDate.length} caso${casesWithDate.length > 1 ? "s" : ""} con fecha programada`}
          </p>
        </div>
      </div>

      {/* Calendar + Event list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CalendarView
            cases={casesWithDate}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </div>
        <div>
          <EventList cases={selectedCases} dateStr={selectedDate} />
        </div>
      </div>
    </div>
  );
}
