import mammoth from "mammoth";
import type { CaseFormData } from "@/types";

export interface ParsedDocument {
  /** Campos extraídos para pre-llenar el formulario */
  caseData: Partial<CaseFormData>;
  /** Texto completo del documento (para referencia en notas) */
  rawText: string;
  /** Campos que se lograron extraer */
  fieldsFound: string[];
}

/**
 * Parsea un archivo .docx y extrae datos relevantes para crear un caso.
 * Funciona enteramente en el navegador, no envía datos a ningún servidor.
 */
export async function parseDocxFile(file: File): Promise<ParsedDocument> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  const text = result.value;

  const caseData: Partial<CaseFormData> = {};
  const fieldsFound: string[] = [];

  // --- Expediente ---
  const expPatterns = [
    /Expediente\s*(?:Judicial\s*)?N[°º]?\s*:?\s*([\d\-]+(?:-\d+-\d+-\w+-\w+-\d+)?)/i,
    /Exp[._]?\s*([\d\-]+(?:-\d+-\d+-\w+-\w+-\d+)?)/i,
    /CARPETA FISCAL\s*N[°º]?\s*:?\s*([\d\-]+)/i,
  ];
  for (const pattern of expPatterns) {
    const match = text.match(pattern);
    if (match) {
      caseData.expediente = match[1].trim();
      fieldsFound.push("expediente");
      break;
    }
  }

  // --- Nombre del cliente (denunciante/demandante) ---
  const clientPatterns = [
    /DENUNCIANTE:\s*([A-ZÁÉÍÓÚÑ\s,]+)/i,
    /DEMANDANTE:\s*([A-ZÁÉÍÓÚÑ\s,]+)/i,
    /AGRAVIADO:\s*([A-ZÁÉÍÓÚÑ\s,]+)/i,
    /([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+ (?:[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+ )*[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+),?\s*identificad[oa]\s*con\s*DNI/i,
  ];
  for (const pattern of clientPatterns) {
    const match = text.match(pattern);
    if (match) {
      const name = match[1].trim().replace(/,\s*$/, "");
      // Convertir "PAREDES SOTO, JORGE LUIS" → "Jorge Luis Paredes Soto"
      caseData.nombre_cliente = formatName(name);
      fieldsFound.push("nombre_cliente");
      break;
    }
  }

  // --- Teléfono ---
  const phonePatterns = [
    /celular\s*:?\s*(\d{9,})/i,
    /tel[eé]fono\s*:?\s*(\d{9,})/i,
    /WhatsApp\s*:?\s*(\d{9,})/i,
    /\b(9\d{8})\b/, // Números peruanos móviles (empiezan con 9)
  ];
  for (const pattern of phonePatterns) {
    const match = text.match(pattern);
    if (match) {
      caseData.telefono = match[1].trim();
      fieldsFound.push("telefono");
      break;
    }
  }

  // --- Tipo de caso ---
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
  };

  const delitoMatch = text.match(
    /delito\s*(?:de|contra\s*[\w\s]+en\s*la\s*modalidad\s*de)\s+(\w+)/i
  );
  const materiaMatch = text.match(/materia\s*:?\s*(\w+)/i);
  const tipMatch = delitoMatch || materiaMatch;

  if (tipMatch) {
    const keyword = tipMatch[1].toLowerCase();
    for (const [key, value] of Object.entries(caseTypeMap)) {
      if (keyword.includes(key)) {
        caseData.tipo_caso = value;
        fieldsFound.push("tipo_caso");
        break;
      }
    }
  }

  // Si no se encontró por delito, buscar en el texto general
  if (!caseData.tipo_caso) {
    const textLower = text.toLowerCase();
    for (const [key, value] of Object.entries(caseTypeMap)) {
      if (textLower.includes(key)) {
        caseData.tipo_caso = value;
        fieldsFound.push("tipo_caso");
        break;
      }
    }
  }

  // --- Estado: si hay "diligencias preliminares" → en_tramite, sino → nuevo ---
  if (
    /diligencias preliminares/i.test(text) ||
    /investigaci[oó]n preparatoria/i.test(text)
  ) {
    caseData.estado = "en_tramite";
    fieldsFound.push("estado");
  } else {
    caseData.estado = "nuevo";
  }

  // --- Notas: resumen automático ---
  const parts: string[] = [];

  const denunciadoMatch = text.match(
    /DENUNCIADO:\s*([A-ZÁÉÍÓÚÑ\s,]+)/i
  ) || text.match(
    /contra\s*(?:el\s*ciudadano\s+)?([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]+),?\s*identificad/i
  );
  if (denunciadoMatch) {
    parts.push(`Denunciado: ${formatName(denunciadoMatch[1].trim())}`);
  }

  const montoMatch = text.match(/S\/\s*([\d,\.]+(?:\.\d{2})?)/);
  if (montoMatch) {
    parts.push(`Monto: S/ ${montoMatch[1]}`);
  }

  const fiscalMatch = text.match(/FISCAL:\s*(.+)/i);
  if (fiscalMatch) {
    parts.push(`Fiscal: ${fiscalMatch[1].trim()}`);
  }

  const carpetaMatch = text.match(/CARPETA FISCAL\s*N[°º]?\s*:?\s*([\d\-]+)/i);
  if (carpetaMatch) {
    parts.push(`Carpeta Fiscal: ${carpetaMatch[1]}`);
  }

  if (parts.length > 0) {
    caseData.notas = parts.join(" | ");
    fieldsFound.push("notas");
  }

  // --- Documentos pendientes: extraer de medios probatorios ---
  const docsSection = text.match(
    /MEDIOS PROBATORIOS([\s\S]*?)(?:V\.|DILIGENCIAS|POR TANTO)/i
  );
  if (docsSection) {
    const docs = docsSection[1]
      .split(/\d+\.-?\s*/)
      .map((d) => d.trim())
      .filter((d) => d.length > 5)
      .slice(0, 5) // Máximo 5 documentos
      .join("; ");
    if (docs) {
      caseData.documentos_pendientes = docs;
      fieldsFound.push("documentos_pendientes");
    }
  }

  return { caseData, rawText: text, fieldsFound };
}

/**
 * Convierte nombre de formato legal a formato legible.
 * "PAREDES SOTO, JORGE LUIS" → "Jorge Luis Paredes Soto"
 * "JORGE LUIS PAREDES SOTO" → "Jorge Luis Paredes Soto"
 */
function formatName(name: string): string {
  const cleaned = name.replace(/,\s*$/, "").trim();

  // Si tiene coma → "APELLIDOS, NOMBRES"
  if (cleaned.includes(",")) {
    const [apellidos, nombres] = cleaned.split(",").map((s) => s.trim());
    return `${toTitleCase(nombres)} ${toTitleCase(apellidos)}`;
  }

  return toTitleCase(cleaned);
}

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .filter((w) => w.length > 0)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
