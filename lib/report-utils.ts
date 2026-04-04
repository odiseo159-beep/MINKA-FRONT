import { format, subDays, isAfter, isBefore, addDays } from "date-fns";
import { es } from "date-fns/locale";
import type { Case } from "@/types";
import { STATUS_LABELS, CASE_TYPE_LABELS } from "@/types";

export interface ChartItem {
  name: string;
  value: number;
  color?: string;
}

const STATUS_CHART_COLORS: Record<string, string> = {
  nuevo: "#3b82f6",
  en_tramite: "#f59e0b",
  en_audiencia: "#a855f7",
  pendiente_documento: "#eab308",
  en_revision: "#06b6d4",
  en_apelacion: "#ec4899",
  resuelto: "#22c55e",
  archivado: "#6b7280",
};

/**
 * Groups and counts cases by estado
 */
export function casesByStatus(cases: Case[]): ChartItem[] {
  const counts = new Map<string, number>();
  for (const c of cases) {
    counts.set(c.estado, (counts.get(c.estado) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([key, value]) => ({
      name: STATUS_LABELS[key] || key,
      value,
      color: STATUS_CHART_COLORS[key] || "#6b7280",
    }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Groups and counts cases by tipo_caso
 */
export function casesByType(cases: Case[]): ChartItem[] {
  const counts = new Map<string, number>();
  for (const c of cases) {
    counts.set(c.tipo_caso, (counts.get(c.tipo_caso) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([key, value]) => ({
      name: CASE_TYPE_LABELS[key] || key,
      value,
    }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Groups cases by month of fecha_creacion
 */
export function casesByMonth(cases: Case[]): ChartItem[] {
  const counts = new Map<string, number>();
  for (const c of cases) {
    if (!c.fecha_creacion) continue;
    const dateStr = c.fecha_creacion.includes("T")
      ? c.fecha_creacion
      : c.fecha_creacion.replace(" ", "T");
    const date = new Date(dateStr);
    const key = format(date, "yyyy-MM");
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return Array.from(counts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => {
      const [y, m] = key.split("-");
      const label = format(new Date(Number(y), Number(m) - 1), "MMM yy", { locale: es });
      return { name: label, value };
    });
}

/**
 * Returns cases with proxima_fecha within the next N days
 */
export function urgentCases(cases: Case[], withinDays = 7): Case[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const limit = addDays(now, withinDays);

  return cases
    .filter((c) => {
      if (!c.proxima_fecha) return false;
      const dateStr = c.proxima_fecha.includes("T")
        ? c.proxima_fecha
        : c.proxima_fecha.replace(" ", "T");
      const date = new Date(dateStr);
      return !isBefore(date, now) && !isAfter(date, limit);
    })
    .sort((a, b) => {
      const da = new Date(a.proxima_fecha!.replace(" ", "T"));
      const db = new Date(b.proxima_fecha!.replace(" ", "T"));
      return da.getTime() - db.getTime();
    });
}

export interface TopClient {
  nombre: string;
  telefono: string;
  totalCasos: number;
  casosActivos: number;
}

/**
 * Returns top clients sorted by number of cases
 */
export function topClients(cases: Case[], limit = 5): TopClient[] {
  const byPhone = new Map<string, { nombre: string; telefono: string; total: number; activos: number }>();

  for (const c of cases) {
    const key = c.telefono || c.nombre_cliente;
    const existing = byPhone.get(key);
    const isActive = !["resuelto", "archivado"].includes(c.estado);
    if (existing) {
      existing.total++;
      if (isActive) existing.activos++;
    } else {
      byPhone.set(key, {
        nombre: c.nombre_cliente,
        telefono: c.telefono,
        total: 1,
        activos: isActive ? 1 : 0,
      });
    }
  }

  return Array.from(byPhone.values())
    .map((v) => ({ nombre: v.nombre, telefono: v.telefono, totalCasos: v.total, casosActivos: v.activos }))
    .sort((a, b) => b.totalCasos - a.totalCasos)
    .slice(0, limit);
}

/**
 * Filters cases by a time period (last N days)
 */
export function filterByPeriod(cases: Case[], days: number | null): Case[] {
  if (!days) return cases; // null = all time
  const cutoff = subDays(new Date(), days);
  return cases.filter((c) => {
    if (!c.fecha_creacion) return false;
    const dateStr = c.fecha_creacion.includes("T")
      ? c.fecha_creacion
      : c.fecha_creacion.replace(" ", "T");
    return isAfter(new Date(dateStr), cutoff);
  });
}
