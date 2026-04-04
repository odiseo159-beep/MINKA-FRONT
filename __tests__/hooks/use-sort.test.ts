import { describe, it, expect } from "vitest";
import { sortCases } from "@/hooks/use-sort";
import type { Case } from "@/types";

const makeCaso = (overrides: Partial<Case>): Case => ({
  id: 1,
  telefono: "940592068",
  nombre_cliente: "Test",
  tipo_caso: "laboral",
  estado: "nuevo",
  fecha_creacion: "2026-01-01T00:00:00",
  fecha_actualizacion: "2026-01-01T00:00:00",
  ...overrides,
});

const cases: Case[] = [
  makeCaso({ id: 1, nombre_cliente: "Carlos", tipo_caso: "laboral", estado: "nuevo", proxima_fecha: "2026-04-10", fecha_actualizacion: "2026-03-01T00:00:00" }),
  makeCaso({ id: 2, nombre_cliente: "Ana", tipo_caso: "penal_estafa", estado: "resuelto", proxima_fecha: "2026-04-05", fecha_actualizacion: "2026-03-15T00:00:00" }),
  makeCaso({ id: 3, nombre_cliente: "Beatriz", tipo_caso: "civil_desalojo", estado: "en_tramite", fecha_actualizacion: "2026-03-10T00:00:00" }),
];

describe("sortCases", () => {
  it("returns original order when field is null", () => {
    const result = sortCases(cases, null, "asc");
    expect(result.map((c) => c.id)).toEqual([1, 2, 3]);
  });

  it("sorts by nombre_cliente ascending", () => {
    const result = sortCases(cases, "nombre_cliente", "asc");
    expect(result.map((c) => c.nombre_cliente)).toEqual(["Ana", "Beatriz", "Carlos"]);
  });

  it("sorts by nombre_cliente descending", () => {
    const result = sortCases(cases, "nombre_cliente", "desc");
    expect(result.map((c) => c.nombre_cliente)).toEqual(["Carlos", "Beatriz", "Ana"]);
  });

  it("sorts by proxima_fecha ascending, null dates last", () => {
    const result = sortCases(cases, "proxima_fecha", "asc");
    // Ana (04-05), Carlos (04-10), Beatriz (no date)
    expect(result.map((c) => c.id)).toEqual([2, 1, 3]);
  });

  it("sorts by fecha_actualizacion descending", () => {
    const result = sortCases(cases, "fecha_actualizacion", "desc");
    // Most recent first: Ana (03-15), Beatriz (03-10), Carlos (03-01)
    expect(result.map((c) => c.id)).toEqual([2, 3, 1]);
  });

  it("sorts by estado ascending", () => {
    const result = sortCases(cases, "estado", "asc");
    expect(result.map((c) => c.estado)).toEqual(["en_tramite", "nuevo", "resuelto"]);
  });

  it("does not mutate original array", () => {
    const original = [...cases];
    sortCases(cases, "nombre_cliente", "asc");
    expect(cases.map((c) => c.id)).toEqual(original.map((c) => c.id));
  });
});
