import { useState, useCallback } from "react";
import type { Case } from "@/types";

export type SortField = "nombre_cliente" | "tipo_caso" | "estado" | "proxima_fecha" | "fecha_actualizacion";
export type SortDirection = "asc" | "desc";

interface SortState {
  field: SortField | null;
  direction: SortDirection;
}

export function useSortState() {
  const [sort, setSort] = useState<SortState>({ field: null, direction: "asc" });

  const toggleSort = useCallback((field: SortField) => {
    setSort((prev) => {
      if (prev.field !== field) return { field, direction: "asc" };
      if (prev.direction === "asc") return { field, direction: "desc" };
      return { field: null, direction: "asc" };
    });
  }, []);

  return { sortField: sort.field, sortDirection: sort.direction, toggleSort };
}

export function sortCases(cases: Case[], field: SortField | null, direction: SortDirection): Case[] {
  if (!field) return cases;

  return [...cases].sort((a, b) => {
    let comparison = 0;

    if (field === "proxima_fecha" || field === "fecha_actualizacion") {
      const dateA = a[field] ? new Date(a[field]!).getTime() : 0;
      const dateB = b[field] ? new Date(b[field]!).getTime() : 0;
      // Push empty dates to the end
      if (!a[field] && b[field]) return 1;
      if (a[field] && !b[field]) return -1;
      comparison = dateA - dateB;
    } else {
      const valA = (a[field] || "").toLowerCase();
      const valB = (b[field] || "").toLowerCase();
      comparison = valA.localeCompare(valB, "es");
    }

    return direction === "desc" ? -comparison : comparison;
  });
}
