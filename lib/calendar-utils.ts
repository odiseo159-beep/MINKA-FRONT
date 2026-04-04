import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  eachHourOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  startOfDay,
  endOfDay,
} from "date-fns";
import { es } from "date-fns/locale";
import type { Case } from "@/types";

export type CalendarViewMode = "month" | "week" | "day";

export interface CalendarDay {
  date: Date;
  dateStr: string; // "YYYY-MM-DD"
  isCurrentMonth: boolean;
  isToday: boolean;
  cases: Case[];
}

/**
 * Groups cases by their proxima_fecha into a Map<"YYYY-MM-DD", Case[]>
 */
export function groupCasesByDate(cases: Case[]): Map<string, Case[]> {
  const map = new Map<string, Case[]>();
  for (const caso of cases) {
    if (!caso.proxima_fecha) continue;
    const key = caso.proxima_fecha.slice(0, 10); // "YYYY-MM-DD"
    const existing = map.get(key) || [];
    existing.push(caso);
    map.set(key, existing);
  }
  return map;
}

/**
 * Returns an array of CalendarDay objects for the month grid,
 * including padding days from previous/next months to fill the weeks.
 */
export function getMonthDays(year: number, month: number, casesByDate: Map<string, Case[]>): CalendarDay[] {
  const monthDate = new Date(year, month);
  const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 }); // Monday
  const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });

  return eachDayOfInterval({ start, end }).map((date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return {
      date,
      dateStr,
      isCurrentMonth: isSameMonth(date, monthDate),
      isToday: isToday(date),
      cases: casesByDate.get(dateStr) || [],
    };
  });
}

export function formatMonthYear(year: number, month: number): string {
  return format(new Date(year, month), "MMMM yyyy", { locale: es });
}

export function getNextMonth(year: number, month: number): { year: number; month: number } {
  const d = addMonths(new Date(year, month), 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function getPrevMonth(year: number, month: number): { year: number; month: number } {
  const d = subMonths(new Date(year, month), 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

/**
 * Returns an array of CalendarDay objects for a single week.
 */
export function getWeekDays(date: Date, casesByDate: Map<string, Case[]>): CalendarDay[] {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });

  return eachDayOfInterval({ start, end }).map((d) => {
    const dateStr = format(d, "yyyy-MM-dd");
    return {
      date: d,
      dateStr,
      isCurrentMonth: true,
      isToday: isToday(d),
      cases: casesByDate.get(dateStr) || [],
    };
  });
}

/**
 * Returns a single CalendarDay for a specific date.
 */
export function getDayDetail(date: Date, casesByDate: Map<string, Case[]>): CalendarDay {
  const dateStr = format(date, "yyyy-MM-dd");
  return {
    date,
    dateStr,
    isCurrentMonth: true,
    isToday: isToday(date),
    cases: casesByDate.get(dateStr) || [],
  };
}

export function getNextWeek(date: Date): Date {
  return addWeeks(date, 1);
}

export function getPrevWeek(date: Date): Date {
  return subWeeks(date, 1);
}

export function getNextDay(date: Date): Date {
  return addDays(date, 1);
}

export function getPrevDay(date: Date): Date {
  return subDays(date, 1);
}

export function formatWeekRange(date: Date): string {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  const startStr = format(start, "d MMM", { locale: es });
  const endStr = format(end, "d MMM yyyy", { locale: es });
  return `${startStr} — ${endStr}`;
}

export function formatDayFull(date: Date): string {
  return format(date, "EEEE d 'de' MMMM yyyy", { locale: es });
}
