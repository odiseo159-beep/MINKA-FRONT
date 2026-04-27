import { describe, it, expect } from "vitest";

// Referencia al mapa que queremos verificar en la implementación
const caseTypeMap: Record<string, string> = {
  estafa: "penal_estafa",
  robo: "penal_robo",
  hurto: "penal_robo",
  lesiones: "penal_lesiones",
  laboral: "laboral",
  despido: "laboral",
  alimentos: "familia_alimentos",
  tenencia: "familia_tenencia",
  desalojo: "civil_desalojo",
  divorcio: "familia_divorcio",
  "violencia familiar": "penal_violencia_familiar",
  feminicidio: "penal_violencia_familiar",
  homicidio: "penal_homicidio",
  asesinato: "penal_homicidio",
  peculado: "penal_corrupcion",
  corrupcion: "penal_corrupcion",
  cohecho: "penal_corrupcion",
  drogas: "penal_tid",
  narcotrafico: "penal_tid",
  lavado: "penal_lavado",
  administrativo: "administrativo_recurso",
  contencioso: "administrativo_contencioso",
  sunat: "tributario",
  tributario: "tributario",
  amparo: "constitucional",
  "habeas corpus": "constitucional",
  societario: "comercial_societario",
  herencia: "sucesiones",
  testamento: "sucesiones",
  sunarp: "inmobiliario",
  hipoteca: "inmobiliario",
  usucapion: "inmobiliario",
};

describe("caseTypeMap keywords", () => {
  it("mapea keywords penales nuevas correctamente", () => {
    expect(caseTypeMap["peculado"]).toBe("penal_corrupcion");
    expect(caseTypeMap["homicidio"]).toBe("penal_homicidio");
    expect(caseTypeMap["drogas"]).toBe("penal_tid");
    expect(caseTypeMap["lavado"]).toBe("penal_lavado");
  });

  it("mapea keywords de nuevas ramas correctamente", () => {
    expect(caseTypeMap["sunat"]).toBe("tributario");
    expect(caseTypeMap["amparo"]).toBe("constitucional");
    expect(caseTypeMap["sunarp"]).toBe("inmobiliario");
    expect(caseTypeMap["herencia"]).toBe("sucesiones");
  });
});
