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
    // Penal existente
    estafa:                  "penal_estafa",
    robo:                    "penal_robo",
    hurto:                   "penal_robo",
    lesiones:                "penal_lesiones",
    // Penal nuevo
    "violencia familiar":    "penal_violencia_familiar",
    feminicidio:             "penal_violencia_familiar",
    homicidio:               "penal_homicidio",
    asesinato:               "penal_homicidio",
    peculado:                "penal_corrupcion",
    corrupcion:              "penal_corrupcion",
    cohecho:                 "penal_corrupcion",
    drogas:                  "penal_tid",
    narcotrafico:            "penal_tid",
    "trafico ilicito":       "penal_tid",
    lavado:                  "penal_lavado",
    "lavado de activos":     "penal_lavado",
    // Laboral
    laboral:                 "laboral",
    despido:                 "laboral",
    // Familia
    alimentos:               "familia_alimentos",
    tenencia:                "familia_tenencia",
    divorcio:                "familia_divorcio",
    "separacion de cuerpos": "familia_divorcio",
    // Civil
    desalojo:                "civil_desalojo",
    // Administrativo
    administrativo:          "administrativo_recurso",
    contencioso:             "administrativo_contencioso",
    // Nuevas ramas
    sunat:                   "tributario",
    tributario:              "tributario",
    "tribunal fiscal":       "tributario",
    amparo:                  "constitucional",
    "habeas corpus":         "constitucional",
    "accion popular":        "constitucional",
    societario:              "comercial_societario",
    empresa:                 "comercial_societario",
    mercantil:               "comercial_contrato",
    herencia:                "sucesiones",
    testamento:              "sucesiones",
    herederos:               "sucesiones",
    sunarp:                  "inmobiliario",
    hipoteca:                "inmobiliario",
    usucapion:               "inmobiliario",
    registral:               "inmobiliario",
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

const ALLOWED_IMAGE_EXTS = ["jpg", "jpeg", "png", "webp"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Envía una imagen al backend para extracción de datos via Claude Vision.
 * Valida formato y tamaño antes de enviar.
 * Las imágenes se envían al servidor (a diferencia de DOCX que es 100% client-side).
 */
export async function parseImageFile(file: File, token: string): Promise<ParsedDocument> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (!ALLOWED_IMAGE_EXTS.includes(ext)) {
    throw new Error("Solo se aceptan JPG, PNG y WEBP. Formatos como HEIC, BMP o TIFF no son compatibles.");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("El archivo no debe superar 10 MB.");
  }

  const formData = new FormData();
  formData.append("archivo", file);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const res = await fetch(`${API_URL}/api/casos/extraer-documento`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Error al procesar la imagen" }));
    throw new Error(err.detail || "Error al procesar la imagen");
  }

  const data = await res.json();

  // Imagen rechazada por validación (ilegible, no legal, sin texto)
  if (data.rejection_reason || data.legible === false || data.es_legal === false) {
    throw new Error(data.advertencias?.[0] || data.rejection_reason || "Imagen no válida como documento legal.");
  }

  return mapBackendResponse(data);
}

/**
 * Convierte la respuesta del backend (POST /api/casos/extraer-documento)
 * al formato ParsedDocument que usa el formulario de caso.
 * Se usa para PDFs procesados server-side via Claude API.
 */
export function mapBackendResponse(response: {
  campos: Record<string, string>;
  faltantes: string[];
  advertencias: string[];
}): ParsedDocument {
  const caseData: Partial<CaseFormData> = {};
  const fieldsFound: string[] = [];

  const fieldKeys: (keyof CaseFormData)[] = [
    "nombre_cliente", "telefono", "expediente", "tipo_caso",
    "estado", "documentos_pendientes", "proxima_fecha", "proxima_accion", "notas",
  ];

  for (const field of fieldKeys) {
    if (response.campos[field]) {
      (caseData as Record<string, string>)[field] = response.campos[field];
      fieldsFound.push(field);
    }
  }

  if (!caseData.estado) {
    caseData.estado = "nuevo";
  }

  return {
    caseData,
    rawText: "",
    fieldsFound,
  };
}
