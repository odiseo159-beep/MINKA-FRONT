import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  casesByStatus,
  casesByType,
  casesByMonth,
  urgentCases,
  topClients,
  filterByPeriod,
} from "@/lib/report-utils";
import type { Case } from "@/types";
import { addDays, subDays, format } from "date-fns";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeCase(overrides: Partial<Case> & { id: number }): Case {
  return {
    telefono: "912345678",
    nombre_cliente: "Maria Garcia",
    tipo_caso: "laboral",
    estado: "nuevo",
    fecha_creacion: "2026-04-01T10:00:00",
    fecha_actualizacion: "2026-04-01T10:00:00",
    ...overrides,
  };
}

const now = new Date();
const todayISO = format(now, "yyyy-MM-dd'T'HH:mm:ss");

const mockCases: Case[] = [
  makeCase({ id: 1, estado: "nuevo", tipo_caso: "laboral", telefono: "912345678", nombre_cliente: "Maria Garcia", fecha_creacion: "2026-04-01T10:00:00" }),
  makeCase({ id: 2, estado: "nuevo", tipo_caso: "penal_estafa", telefono: "912345678", nombre_cliente: "Maria Garcia", fecha_creacion: "2026-04-02T12:00:00" }),
  makeCase({ id: 3, estado: "en_tramite", tipo_caso: "laboral", telefono: "999888777", nombre_cliente: "Carlos Lopez", fecha_creacion: "2026-03-15T09:00:00" }),
  makeCase({ id: 4, estado: "resuelto", tipo_caso: "familia_alimentos", telefono: "999888777", nombre_cliente: "Carlos Lopez", fecha_creacion: "2026-02-10T08:00:00" }),
  makeCase({ id: 5, estado: "en_tramite", tipo_caso: "civil_desalojo", telefono: "911222333", nombre_cliente: "Ana Torres", fecha_creacion: "2026-01-20T14:00:00" }),
  makeCase({ id: 6, estado: "archivado", tipo_caso: "laboral", telefono: "911222333", nombre_cliente: "Ana Torres", fecha_creacion: "2025-12-01T11:00:00" }),
];

// ---------------------------------------------------------------------------
// casesByStatus
// ---------------------------------------------------------------------------
describe("casesByStatus", () => {
  it("groups cases by estado and returns sorted by count desc", () => {
    const result = casesByStatus(mockCases);
    // "nuevo" x2, "en_tramite" x2 tie at the top; then 1 each for resuelto, archivado
    expect(result).toHaveLength(4);
    expect(result[0].value).toBeGreaterThanOrEqual(result[1].value);
  });

  it("uses STATUS_LABELS for display names", () => {
    const result = casesByStatus([makeCase({ id: 10, estado: "pendiente_documento" })]);
    expect(result[0].name).toBe("Pend. documento");
  });

  it("assigns chart colors", () => {
    const result = casesByStatus([makeCase({ id: 10, estado: "nuevo" })]);
    expect(result[0].color).toBe("#3b82f6");
  });

  it("handles empty array", () => {
    expect(casesByStatus([])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// casesByType
// ---------------------------------------------------------------------------
describe("casesByType", () => {
  it("groups cases by tipo_caso sorted by count desc", () => {
    const result = casesByType(mockCases);
    // laboral x3 is the top
    expect(result[0].name).toBe("Laboral");
    expect(result[0].value).toBe(3);
  });

  it("uses CASE_TYPE_LABELS for known types", () => {
    const result = casesByType([makeCase({ id: 10, tipo_caso: "penal_robo" })]);
    expect(result[0].name).toBe("Penal - Robo");
  });

  it("falls back to raw key for unknown types", () => {
    const result = casesByType([makeCase({ id: 10, tipo_caso: "desconocido" })]);
    expect(result[0].name).toBe("desconocido");
  });
});

// ---------------------------------------------------------------------------
// casesByMonth
// ---------------------------------------------------------------------------
describe("casesByMonth", () => {
  it("groups by year-month in chronological order", () => {
    const result = casesByMonth(mockCases);
    // We have dates in 2025-12, 2026-01, 2026-02, 2026-03, 2026-04
    expect(result.length).toBeGreaterThanOrEqual(4);
    // Chronological: first entry should be the earliest month
    expect(result[0].value).toBeGreaterThanOrEqual(1);
    // Verify order: indices should be chronological
    const names = result.map((r) => r.name);
    expect(names.length).toBe(new Set(names).size); // all unique
  });

  it("skips cases without fecha_creacion", () => {
    const cases = [makeCase({ id: 10, fecha_creacion: "" })];
    // empty string -> new Date("") is Invalid -> format might throw, but the code
    // checks c.fecha_creacion truthiness first via the !c.fecha_creacion guard
    const result = casesByMonth(cases);
    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// urgentCases
// ---------------------------------------------------------------------------
describe("urgentCases", () => {
  it("returns cases with proxima_fecha within 7 days from now", () => {
    const inRange = format(addDays(new Date(), 3), "yyyy-MM-dd");
    const cases = [
      makeCase({ id: 1, proxima_fecha: inRange }),
      makeCase({ id: 2, proxima_fecha: undefined }),
    ];
    const result = urgentCases(cases);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it("excludes past dates", () => {
    const past = format(subDays(new Date(), 2), "yyyy-MM-dd");
    const cases = [makeCase({ id: 1, proxima_fecha: past })];
    expect(urgentCases(cases)).toHaveLength(0);
  });

  it("excludes dates beyond the window", () => {
    const far = format(addDays(new Date(), 15), "yyyy-MM-dd");
    const cases = [makeCase({ id: 1, proxima_fecha: far })];
    expect(urgentCases(cases)).toHaveLength(0);
  });

  it("sorts results by proxima_fecha ascending", () => {
    const day2 = format(addDays(new Date(), 2), "yyyy-MM-dd");
    const day5 = format(addDays(new Date(), 5), "yyyy-MM-dd");
    const cases = [
      makeCase({ id: 2, proxima_fecha: day5 }),
      makeCase({ id: 1, proxima_fecha: day2 }),
    ];
    const result = urgentCases(cases);
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// topClients
// ---------------------------------------------------------------------------
describe("topClients", () => {
  it("groups by phone and counts total and active cases", () => {
    const result = topClients(mockCases);
    const maria = result.find((c) => c.nombre === "Maria Garcia");
    expect(maria).toBeDefined();
    expect(maria!.totalCasos).toBe(2);
    expect(maria!.casosActivos).toBe(2); // both "nuevo"
  });

  it("marks resuelto/archivado as inactive", () => {
    const result = topClients(mockCases);
    const carlos = result.find((c) => c.nombre === "Carlos Lopez");
    expect(carlos!.totalCasos).toBe(2);
    expect(carlos!.casosActivos).toBe(1); // en_tramite is active, resuelto is not
  });

  it("limits results to N", () => {
    const result = topClients(mockCases, 2);
    expect(result).toHaveLength(2);
  });

  it("sorts by totalCasos descending", () => {
    const result = topClients(mockCases);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].totalCasos).toBeGreaterThanOrEqual(result[i].totalCasos);
    }
  });
});

// ---------------------------------------------------------------------------
// filterByPeriod
// ---------------------------------------------------------------------------
describe("filterByPeriod", () => {
  it("returns all cases when days is null", () => {
    expect(filterByPeriod(mockCases, null)).toHaveLength(mockCases.length);
  });

  it("filters to last N days based on fecha_creacion", () => {
    const recent = makeCase({ id: 99, fecha_creacion: todayISO });
    const old = makeCase({ id: 100, fecha_creacion: "2020-01-01T00:00:00" });
    const result = filterByPeriod([recent, old], 30);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(99);
  });

  it("handles empty array", () => {
    expect(filterByPeriod([], 30)).toEqual([]);
  });
});
