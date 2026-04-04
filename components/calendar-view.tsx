"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  groupCasesByDate,
  getMonthDays,
  getWeekDays,
  getDayDetail,
  formatMonthYear,
  formatWeekRange,
  formatDayFull,
  getNextMonth,
  getPrevMonth,
  getNextWeek,
  getPrevWeek,
  getNextDay,
  getPrevDay,
  WEEKDAY_LABELS,
} from "@/lib/calendar-utils";
import type { CalendarDay, CalendarViewMode } from "@/lib/calendar-utils";
import type { Case } from "@/types";
import { STATUS_COLORS, STATUS_LABELS, CASE_TYPE_LABELS } from "@/types";

interface CalendarViewProps {
  cases: Case[];
  selectedDate: string | null;
  onSelectDate: (dateStr: string) => void;
}

const VIEW_LABELS: { mode: CalendarViewMode; label: string }[] = [
  { mode: "month", label: "Mes" },
  { mode: "week", label: "Semana" },
  { mode: "day", label: "Día" },
];

export function CalendarView({ cases, selectedDate, onSelectDate }: CalendarViewProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [currentDate, setCurrentDate] = useState(today);
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");

  const casesByDate = useMemo(() => groupCasesByDate(cases), [cases]);
  const monthDays = useMemo(() => getMonthDays(year, month, casesByDate), [year, month, casesByDate]);
  const weekDays = useMemo(() => getWeekDays(currentDate, casesByDate), [currentDate, casesByDate]);
  const dayDetail = useMemo(() => getDayDetail(currentDate, casesByDate), [currentDate, casesByDate]);

  const goNext = () => {
    if (viewMode === "month") {
      const next = getNextMonth(year, month);
      setYear(next.year);
      setMonth(next.month);
    } else if (viewMode === "week") {
      setCurrentDate(getNextWeek(currentDate));
    } else {
      setCurrentDate(getNextDay(currentDate));
    }
  };

  const goPrev = () => {
    if (viewMode === "month") {
      const prev = getPrevMonth(year, month);
      setYear(prev.year);
      setMonth(prev.month);
    } else if (viewMode === "week") {
      setCurrentDate(getPrevWeek(currentDate));
    } else {
      setCurrentDate(getPrevDay(currentDate));
    }
  };

  const goToday = () => {
    const t = new Date();
    setYear(t.getFullYear());
    setMonth(t.getMonth());
    setCurrentDate(t);
  };

  const headerLabel =
    viewMode === "month"
      ? formatMonthYear(year, month)
      : viewMode === "week"
        ? formatWeekRange(currentDate)
        : formatDayFull(currentDate);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 capitalize">{headerLabel}</h3>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
            {VIEW_LABELS.map(({ mode, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium rounded-md transition-colors",
                  viewMode === mode
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="w-px h-6 bg-gray-200" />
          <button
            onClick={goToday}
            className="px-3 py-1.5 text-sm text-minka-600 hover:bg-minka-50 rounded-lg transition-colors font-medium"
          >
            Hoy
          </button>
          <button onClick={goPrev} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={goNext} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === "month" && (
        <MonthView days={monthDays} selectedDate={selectedDate} onSelectDate={onSelectDate} />
      )}
      {viewMode === "week" && (
        <WeekView days={weekDays} selectedDate={selectedDate} onSelectDate={onSelectDate} />
      )}
      {viewMode === "day" && (
        <DayView day={dayDetail} />
      )}
    </div>
  );
}

/* ============ MONTH VIEW ============ */
function MonthView({
  days,
  selectedDate,
  onSelectDate,
}: {
  days: CalendarDay[];
  selectedDate: string | null;
  onSelectDate: (dateStr: string) => void;
}) {
  return (
    <>
      <div className="grid grid-cols-7 border-b border-gray-100">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="px-2 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => (
          <MonthDayCell
            key={day.dateStr}
            day={day}
            isSelected={selectedDate === day.dateStr}
            onClick={() => onSelectDate(day.dateStr)}
          />
        ))}
      </div>
    </>
  );
}

function MonthDayCell({ day, isSelected, onClick }: { day: CalendarDay; isSelected: boolean; onClick: () => void }) {
  const hasEvents = day.cases.length > 0;
  const isPast = day.date < new Date(new Date().setHours(0, 0, 0, 0)) && day.isCurrentMonth;

  return (
    <button
      onClick={onClick}
      className={cn(
        "min-h-[80px] lg:min-h-[100px] p-1.5 border-b border-r border-gray-100 text-left transition-colors relative",
        !day.isCurrentMonth && "bg-gray-50/50",
        day.isCurrentMonth && "hover:bg-gray-50",
        isSelected && "bg-minka-50 ring-2 ring-inset ring-minka-500"
      )}
    >
      <span
        className={cn(
          "inline-flex items-center justify-center w-7 h-7 rounded-full text-sm",
          !day.isCurrentMonth && "text-gray-300",
          day.isCurrentMonth && "text-gray-700",
          day.isToday && "bg-minka-500 text-white font-bold",
          isPast && hasEvents && !day.isToday && "text-red-500"
        )}
      >
        {day.date.getDate()}
      </span>
      {hasEvents && (
        <div className="mt-1 space-y-0.5">
          {day.cases.slice(0, 3).map((caso) => (
            <div
              key={caso.id}
              className={cn(
                "text-[10px] leading-tight px-1.5 py-0.5 rounded truncate",
                STATUS_COLORS[caso.estado] || "bg-gray-100 text-gray-600"
              )}
              title={`${caso.nombre_cliente} — ${caso.proxima_accion || caso.tipo_caso}`}
            >
              <span className="hidden lg:inline">{caso.nombre_cliente.split(" ")[0]}</span>
              <span className="lg:hidden">&bull;</span>
            </div>
          ))}
          {day.cases.length > 3 && (
            <div className="text-[10px] text-gray-400 px-1.5">+{day.cases.length - 3} más</div>
          )}
        </div>
      )}
    </button>
  );
}

/* ============ WEEK VIEW ============ */
function WeekView({
  days,
  selectedDate,
  onSelectDate,
}: {
  days: CalendarDay[];
  selectedDate: string | null;
  onSelectDate: (dateStr: string) => void;
}) {
  return (
    <div className="grid grid-cols-7 divide-x divide-gray-100">
      {days.map((day) => (
        <button
          key={day.dateStr}
          onClick={() => onSelectDate(day.dateStr)}
          className={cn(
            "min-h-[300px] p-2 text-left transition-colors hover:bg-gray-50 flex flex-col",
            selectedDate === day.dateStr && "bg-minka-50 ring-2 ring-inset ring-minka-500"
          )}
        >
          {/* Day header */}
          <div className="text-center mb-2 pb-2 border-b border-gray-100">
            <p className="text-[10px] font-semibold text-gray-400 uppercase">
              {WEEKDAY_LABELS[days.indexOf(day)]}
            </p>
            <span
              className={cn(
                "inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium mt-0.5",
                day.isToday && "bg-minka-500 text-white font-bold",
                !day.isToday && "text-gray-700"
              )}
            >
              {day.date.getDate()}
            </span>
          </div>
          {/* Events */}
          <div className="flex-1 space-y-1 overflow-y-auto">
            {day.cases.map((caso) => (
              <div
                key={caso.id}
                className={cn(
                  "text-[11px] leading-tight px-1.5 py-1 rounded truncate",
                  STATUS_COLORS[caso.estado] || "bg-gray-100 text-gray-600"
                )}
                title={`${caso.nombre_cliente} — ${caso.proxima_accion || caso.tipo_caso}`}
              >
                <span className="font-medium">{caso.nombre_cliente.split(" ")[0]}</span>
              </div>
            ))}
          </div>
        </button>
      ))}
    </div>
  );
}

/* ============ DAY VIEW ============ */
function DayView({ day }: { day: CalendarDay }) {
  return (
    <div className="p-5">
      {day.cases.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-gray-400">No hay eventos programados para este día</p>
        </div>
      ) : (
        <div className="space-y-3">
          {day.cases.map((caso) => (
            <Link
              key={caso.id}
              href={`/dashboard/casos/${caso.id}`}
              className="flex items-center gap-4 p-4 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors group"
            >
              <div className="w-1 h-12 rounded-full bg-minka-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{caso.nombre_cliente}</p>
                <p className="text-sm text-gray-500 truncate mt-0.5">
                  {caso.proxima_accion || CASE_TYPE_LABELS[caso.tipo_caso] || caso.tipo_caso}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span
                    className={cn(
                      "inline-block px-2 py-0.5 text-[10px] font-medium rounded-full",
                      STATUS_COLORS[caso.estado] || "bg-gray-100 text-gray-600"
                    )}
                  >
                    {STATUS_LABELS[caso.estado] || caso.estado}
                  </span>
                  {caso.expediente && <span className="text-xs text-gray-400">{caso.expediente}</span>}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-minka-500 transition-colors flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
