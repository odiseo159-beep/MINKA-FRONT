import { describe, it, expect } from "vitest";
import { CASE_TYPE_LABELS, CODIGO_LABELS } from "@/types";

describe("CaseType labels", () => {
  it("incluye todas las ramas nuevas", () => {
    const expectedTypes = [
      "penal_violencia_familiar", "penal_homicidio", "penal_corrupcion",
      "penal_tid", "penal_lavado", "administrativo_recurso",
      "administrativo_contencioso", "tributario", "constitucional",
      "comercial_contrato", "comercial_societario", "sucesiones", "inmobiliario",
      "familia_divorcio",
    ];
    for (const t of expectedTypes) {
      expect(CASE_TYPE_LABELS[t]).toBeDefined();
    }
  });

  it("incluye nuevos códigos legales", () => {
    expect(CODIGO_LABELS["L30364"]).toBeDefined();
    expect(CODIGO_LABELS["L29497"]).toBeDefined();
    expect(CODIGO_LABELS["LPAG"]).toBeDefined();
    expect(CODIGO_LABELS["CT"]).toBeDefined();
    expect(CODIGO_LABELS["LGS"]).toBeDefined();
    expect(CODIGO_LABELS["CPCo"]).toBeDefined();
  });
});
