import { describe, it, expect } from "vitest";
import { extractClients } from "@/lib/client-utils";
import type { Case } from "@/types";

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

const mockCases: Case[] = [
  makeCase({ id: 1, telefono: "912345678", nombre_cliente: "Maria Garcia", tipo_caso: "laboral", estado: "nuevo", fecha_actualizacion: "2026-04-05T10:00:00" }),
  makeCase({ id: 2, telefono: "912345678", nombre_cliente: "Maria Garcia", tipo_caso: "penal_estafa", estado: "en_tramite", fecha_actualizacion: "2026-04-03T08:00:00" }),
  makeCase({ id: 3, telefono: "999888777", nombre_cliente: "Carlos Lopez", tipo_caso: "familia_alimentos", estado: "resuelto", fecha_actualizacion: "2026-04-02T12:00:00" }),
  makeCase({ id: 4, telefono: "999888777", nombre_cliente: "Carlos Lopez", tipo_caso: "laboral", estado: "en_tramite", fecha_actualizacion: "2026-04-04T14:00:00" }),
  makeCase({ id: 5, telefono: "911222333", nombre_cliente: "Ana Torres", tipo_caso: "civil_desalojo", estado: "archivado", fecha_actualizacion: "2026-03-01T09:00:00" }),
];

describe("extractClients", () => {
  it("groups cases by telefono into unique clients", () => {
    const result = extractClients(mockCases);
    expect(result).toHaveLength(3);
  });

  it("counts total cases per client correctly", () => {
    const result = extractClients(mockCases);
    const maria = result.find((c) => c.telefono === "912345678");
    expect(maria!.totalCasos).toBe(2);
    const carlos = result.find((c) => c.telefono === "999888777");
    expect(carlos!.totalCasos).toBe(2);
  });

  it("counts active cases (excludes resuelto and archivado)", () => {
    const result = extractClients(mockCases);
    const carlos = result.find((c) => c.telefono === "999888777");
    // en_tramite is active, resuelto is not
    expect(carlos!.casosActivos).toBe(1);
    const ana = result.find((c) => c.telefono === "911222333");
    expect(ana!.casosActivos).toBe(0);
  });

  it("sets ultimoCaso to the most recently updated case", () => {
    const result = extractClients(mockCases);
    const maria = result.find((c) => c.telefono === "912345678");
    // Most recent fecha_actualizacion is 2026-04-05
    expect(maria!.ultimoCaso.id).toBe(1);
  });

  it("collects unique tipo_caso values per client", () => {
    const result = extractClients(mockCases);
    const maria = result.find((c) => c.telefono === "912345678");
    expect(maria!.tipos).toContain("laboral");
    expect(maria!.tipos).toContain("penal_estafa");
    expect(maria!.tipos).toHaveLength(2);
  });

  it("handles empty array", () => {
    expect(extractClients([])).toEqual([]);
  });
});
