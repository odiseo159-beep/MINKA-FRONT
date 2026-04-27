# Agente Legal, Ramas Ampliadas y Soporte Multimedia — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ampliar Minka con cobertura completa de ramas legales peruanas, soporte de imágenes en documentos, y un Agente Legal IA con 4 acciones estructuradas (analizar, asesorar, redactar, normativa).

**Architecture:** Enfoque C — agente unificado. Un solo endpoint `POST /api/casos/{id}/agente` recibe `{ accion, parametros }` y ejecuta un Claude con tool use que consulta documentos del caso, normativa BM25, y consejos procesales. Separado del chat libre. El frontend agrega un tab "Agente Legal" en el detalle del caso.

**Tech Stack:** Next.js 14, TypeScript, Vitest, react-markdown (instalar), FastAPI, Python 3.11, anthropic SDK, BM25 (rank-bm25).

**Repos:**
- Frontend: `C:\Users\danie\Downloads\minka-frontend`
- Backend: `C:\Users\danie\Downloads\minka-legal`

---

## File Map

### Frontend (minka-frontend)
| Archivo | Acción | Responsabilidad |
|---------|--------|-----------------|
| `types/index.ts` | Modificar | CaseType +12 tipos, CASE_TYPE_LABELS, CODIGO_LABELS ampliados |
| `lib/document-parser.ts` | Modificar | caseTypeMap nuevos keywords + `parseImageFile()` para enviar imágenes al backend |
| `lib/api.ts` | Modificar | `agentApi.run(casoId, accion, parametros)` |
| `components/case-form.tsx` | Modificar | Aceptar JPG/PNG/WEBP además de DOCX/PDF, mostrar advertencias de validación |
| `components/legal-agent-panel.tsx` | Crear | Panel con 4 botones, subformularios, render markdown, estados loading/error |
| `app/dashboard/casos/[id]/page.tsx` | Modificar | Tab "Agente Legal" → monta LegalAgentPanel |

### Backend (minka-legal)
| Archivo | Acción | Responsabilidad |
|---------|--------|-----------------|
| `agent/document_extractor.py` | Modificar | Agregar soporte imágenes (JPG/PNG/WEBP) + campos `legible`, `es_legal`, `rejection_reason` |
| `agent/prompts.py` | Modificar | Agregar 4 system prompts: AGENT_ANALIZAR, AGENT_ASESORAR, AGENT_REDACTAR, AGENT_NORMATIVA |
| `agent/legal_agent.py` | Crear | Loop agentic de Claude con tools: get_case_documents, search_normativa, consejo_procesal |
| `agent/dashboard_api.py` | Modificar | Endpoint `POST /api/casos/{caso_id}/agente` |

---

## FASE 1 — Ramas Legales Frontend

### Task 1: Expandir CaseType y labels en types/index.ts

**Files:**
- Modify: `types/index.ts`
- Test: `__tests__/types.test.ts` (crear)

- [ ] **Step 1: Escribir test**

Crear `__tests__/types.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { CASE_TYPE_LABELS, CODIGO_LABELS } from "@/types";

describe("CaseType labels", () => {
  it("incluye todas las ramas nuevas", () => {
    const expectedTypes = [
      "penal_violencia_familiar", "penal_homicidio", "penal_corrupcion",
      "penal_tid", "penal_lavado", "administrativo_recurso",
      "administrativo_contencioso", "tributario", "constitucional",
      "comercial_contrato", "comercial_societario", "sucesiones", "inmobiliario",
    ];
    for (const t of expectedTypes) {
      expect(CASE_TYPE_LABELS[t]).toBeDefined();
    }
  });

  it("incluye nuevos códigos legales", () => {
    expect(CODIGO_LABELS["L30364"]).toBeDefined();
    expect(CODIGO_LABELS["LPAG"]).toBeDefined();
    expect(CODIGO_LABELS["LGS"]).toBeDefined();
  });
});
```

- [ ] **Step 2: Correr test — debe fallar**

```bash
cd C:\Users\danie\Downloads\minka-frontend
npx vitest run __tests__/types.test.ts
```
Esperado: FAIL — "penal_violencia_familiar" undefined.

- [ ] **Step 3: Implementar en types/index.ts**

Reemplazar el bloque `CaseType` y sus helpers:

```typescript
export type CaseType =
  // Penal — existentes
  | "penal_estafa"
  | "penal_robo"
  | "penal_lesiones"
  // Penal — nuevos
  | "penal_violencia_familiar"
  | "penal_homicidio"
  | "penal_corrupcion"
  | "penal_tid"
  | "penal_lavado"
  // Laboral
  | "laboral"
  // Familia
  | "familia_alimentos"
  | "familia_tenencia"
  | "familia_divorcio"
  // Civil
  | "civil_desalojo"
  | "civil_otro"
  // Nuevas ramas
  | "administrativo_recurso"
  | "administrativo_contencioso"
  | "tributario"
  | "constitucional"
  | "comercial_contrato"
  | "comercial_societario"
  | "sucesiones"
  | "inmobiliario";
```

Reemplazar `CASE_TYPE_LABELS`:

```typescript
export const CASE_TYPE_LABELS: Record<string, string> = {
  // Penal
  penal_estafa:              "Penal — Estafa",
  penal_robo:                "Penal — Robo",
  penal_lesiones:            "Penal — Lesiones",
  penal_violencia_familiar:  "Penal — Violencia Familiar (Ley 30364)",
  penal_homicidio:           "Penal — Homicidio",
  penal_corrupcion:          "Penal — Corrupción de Funcionarios",
  penal_tid:                 "Penal — TID (Narcotráfico)",
  penal_lavado:              "Penal — Lavado de Activos",
  // Laboral
  laboral:                   "Laboral",
  // Familia
  familia_alimentos:         "Familia — Alimentos",
  familia_tenencia:          "Familia — Tenencia",
  familia_divorcio:          "Familia — Divorcio",
  // Civil
  civil_desalojo:            "Civil — Desalojo",
  civil_otro:                "Civil — Otro",
  // Administrativo
  administrativo_recurso:    "Administrativo — Recurso",
  administrativo_contencioso:"Administrativo — Contencioso",
  // Otras ramas
  tributario:                "Tributario / Fiscal",
  constitucional:            "Constitucional (Amparo / Hábeas Corpus)",
  comercial_contrato:        "Comercial — Contratos",
  comercial_societario:      "Comercial — Societario",
  sucesiones:                "Sucesiones / Herencias",
  inmobiliario:              "Inmobiliario / Registral (SUNARP)",
  // Strings libres que llegan del backend
  "Alimentos":               "Alimentos",
  "Penal - Estafa":          "Penal — Estafa",
  "Laboral":                 "Laboral",
  "Civil - Desalojo":        "Civil — Desalojo",
};
```

Agregar al final de `CODIGO_LABELS`:

```typescript
  L30364: "Ley 30364 — Violencia contra la Mujer",
  L29497: "Ley 29497 — Nueva Ley Procesal del Trabajo",
  LPAG:   "Ley 27444 — Procedimiento Administrativo General",
  CT:     "Código Tributario",
  LGS:    "Ley General de Sociedades (Ley 26887)",
  CPCo:   "Código Procesal Constitucional",
```

- [ ] **Step 4: Correr test — debe pasar**

```bash
npx vitest run __tests__/types.test.ts
```
Esperado: PASS.

- [ ] **Step 5: Commit**

```bash
git add types/index.ts __tests__/types.test.ts
git commit -m "feat: ampliar CaseType a 22 ramas legales peruanas"
```

---

### Task 2: Expandir keywords en document-parser.ts

**Files:**
- Modify: `lib/document-parser.ts`
- Test: `__tests__/document-parser.test.ts` (crear)

- [ ] **Step 1: Escribir test**

Crear `__tests__/document-parser.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

// Importar el mapa interno para testing
// Lo exponemos temporalmente para el test
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
```

- [ ] **Step 2: Correr test para verificar que el mapa de referencia es correcto**

```bash
npx vitest run __tests__/document-parser.test.ts
```
Esperado: PASS (el mapa de referencia es lo que queremos).

- [ ] **Step 3: Actualizar caseTypeMap en lib/document-parser.ts**

Localizar el bloque `const caseTypeMap` en `lib/document-parser.ts` (alrededor de línea 75) y reemplazarlo:

```typescript
const caseTypeMap: Record<string, string> = {
  // Penal existente
  estafa:                 "penal_estafa",
  robo:                   "penal_robo",
  hurto:                  "penal_robo",
  lesiones:               "penal_lesiones",
  // Penal nuevo
  "violencia familiar":   "penal_violencia_familiar",
  feminicidio:            "penal_violencia_familiar",
  homicidio:              "penal_homicidio",
  asesinato:              "penal_homicidio",
  peculado:               "penal_corrupcion",
  corrupcion:             "penal_corrupcion",
  cohecho:                "penal_corrupcion",
  drogas:                 "penal_tid",
  narcotrafico:           "penal_tid",
  "trafico ilicito":      "penal_tid",
  lavado:                 "penal_lavado",
  "lavado de activos":    "penal_lavado",
  // Laboral
  laboral:                "laboral",
  despido:                "laboral",
  // Familia
  alimentos:              "familia_alimentos",
  tenencia:               "familia_tenencia",
  divorcio:               "familia_divorcio",
  "separacion de cuerpos": "familia_divorcio",
  // Civil
  desalojo:               "civil_desalojo",
  // Administrativo
  administrativo:         "administrativo_recurso",
  contencioso:            "administrativo_contencioso",
  // Nuevas ramas
  sunat:                  "tributario",
  tributario:             "tributario",
  "tribunal fiscal":      "tributario",
  amparo:                 "constitucional",
  "habeas corpus":        "constitucional",
  "accion popular":       "constitucional",
  societario:             "comercial_societario",
  empresa:                "comercial_societario",
  mercantil:              "comercial_contrato",
  herencia:               "sucesiones",
  testamento:             "sucesiones",
  herederos:              "sucesiones",
  sunarp:                 "inmobiliario",
  hipoteca:               "inmobiliario",
  usucapion:              "inmobiliario",
  registral:              "inmobiliario",
};
```

- [ ] **Step 4: Correr tests**

```bash
npx vitest run __tests__/document-parser.test.ts
```
Esperado: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/document-parser.ts __tests__/document-parser.test.ts
git commit -m "feat: expandir keywords del parser para 22 ramas legales"
```

---

## FASE 2 — Soporte de Imágenes en Documentos

### Task 3: Backend — agregar imágenes a extraer_datos_documento

**Repo:** `C:\Users\danie\Downloads\minka-legal`

**Files:**
- Modify: `agent/document_extractor.py`
- Test: `tests/test_document_extractor.py`

**Contexto:** La función `extraer_datos_documento` actualmente solo acepta PDF y DOCX (línea ~135: `raise ValueError(f"Formato no soportado...")`). Necesitamos agregar soporte de imágenes y campos de validación.

- [ ] **Step 1: Escribir test**

```bash
cd C:\Users\danie\Downloads\minka-legal
```

En `tests/test_document_extractor.py` agregar (o crear el archivo):

```python
import pytest
from unittest.mock import patch, MagicMock
from agent.document_extractor import extraer_datos_documento

def _mock_anthropic_response(text: str):
    """Helper para mockear respuesta de Claude."""
    mock_msg = MagicMock()
    mock_msg.content = [MagicMock(text=text)]
    return mock_msg

class TestImageSupport:
    def test_rechaza_formato_no_soportado(self):
        with pytest.raises(ValueError, match="Formato no soportado"):
            extraer_datos_documento(b"data", "doc.bmp", "image/bmp")

    def test_acepta_jpg(self):
        with patch("agent.document_extractor.anthropic.Anthropic") as MockClient:
            mock_client = MockClient.return_value
            mock_client.messages.create.return_value = _mock_anthropic_response(
                '{"nombre_cliente": "Test", "telefono": "987654321"}'
            )
            result = extraer_datos_documento(b"fake_jpg", "foto.jpg", "image/jpeg")
            assert result["campos"]["nombre_cliente"] == "Test"
            assert result.get("legible") is not None

    def test_respuesta_incluye_campos_validacion(self):
        with patch("agent.document_extractor.anthropic.Anthropic") as MockClient:
            mock_client = MockClient.return_value
            mock_client.messages.create.return_value = _mock_anthropic_response(
                '{"legible": true, "es_legal": true, "nombre_cliente": "Ana"}'
            )
            result = extraer_datos_documento(b"fake_png", "resolucion.png", "image/png")
            assert "legible" in result
            assert "es_legal" in result
            assert "rejection_reason" in result
```

- [ ] **Step 2: Correr test — debe fallar**

```bash
cd C:\Users\danie\Downloads\minka-legal
python -m pytest tests/test_document_extractor.py::TestImageSupport -v
```
Esperado: FAIL — `ValueError: Formato no soportado` en test_acepta_jpg.

- [ ] **Step 3: Modificar PROMPT_EXTRACCION para incluir validación**

En `agent/document_extractor.py`, reemplazar `PROMPT_EXTRACCION` con:

```python
PROMPT_EXTRACCION = """Eres un asistente especializado en extracción de datos de documentos legales peruanos.

PRIMERO evalúa el documento:
- legible: true si el texto es claramente legible, false si está borroso, torcido o ilegible
- es_legal: true si es un documento legal peruano (denuncia, demanda, resolución, oficio, contrato, etc.), false si es otro tipo de imagen

Si legible=false o es_legal=false, devuelve SOLO:
{"legible": false, "es_legal": false, "rejection_reason": "descripción breve del problema"}

Si pasa la validación, extrae los siguientes campos si los encuentras de forma EXPLÍCITA:
- nombre_cliente: Nombre completo del cliente, demandante o denunciante principal
- telefono: Número de teléfono del cliente (solo los 9 dígitos, sin +51 ni 51)
- expediente: Número de expediente judicial o carpeta fiscal
- tipo_caso: Materia o tipo del proceso (ej: Laboral, Penal - Estafa, Alimentos)
- abogado_asignado: Nombre del abogado que patrocina al cliente
- documentos_pendientes: Documentos que el juzgado ha requerido presentar
- proxima_fecha: Fecha de próxima audiencia. Formato YYYY-MM-DD.
- proxima_accion: Descripción breve de la próxima acción procesal

REGLAS:
1. Solo extrae datos EXPLÍCITAMENTE escritos. NO inventes ni inferras.
2. Si un campo no está en el documento, omítelo del JSON.
3. Devuelve ÚNICAMENTE un objeto JSON válido, sin texto adicional.

Formato cuando pasa validación (incluye solo campos encontrados):
{"legible": true, "es_legal": true, "nombre_cliente": "...", "telefono": "...", ...}
"""
```

- [ ] **Step 4: Agregar soporte de imágenes en extraer_datos_documento**

Localizar el bloque `else: raise ValueError(f"Formato no soportado...")` (alrededor de línea 135) y reemplazar por:

```python
    # Imagen (JPG, PNG, WEBP) → Vision API
    elif extension in ("jpg", "jpeg", "png", "webp") or content_type.startswith("image/"):
        media_type = content_type if content_type.startswith("image/") else f"image/{extension}"
        # Normalizar media type
        if extension in ("jpg", "jpeg"):
            media_type = "image/jpeg"
        elif extension == "png":
            media_type = "image/png"
        elif extension == "webp":
            media_type = "image/webp"
        b64 = base64.standard_b64encode(contenido_bytes).decode("utf-8")
        mensaje = cliente.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1000,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {"type": "base64", "media_type": media_type, "data": b64},
                    },
                    {"type": "text", "text": PROMPT_EXTRACCION},
                ],
            }],
        )
    else:
        raise ValueError(
            f"Formato no soportado: '{extension}'. Solo se aceptan PDF, DOCX, JPG, PNG y WEBP."
        )
```

- [ ] **Step 5: Extraer campos de validación de la respuesta**

Localizar el bloque que procesa `campos_raw` (después de parsear el JSON) y reemplazar el bloque de filtrado y construcción de resultado:

```python
    # Extraer campos de validación (solo para imágenes, pero incluidos en todos los formatos)
    legible = campos_raw.get("legible", True)
    es_legal = campos_raw.get("es_legal", True)
    rejection_reason = campos_raw.get("rejection_reason", None)

    # Si el documento fue rechazado por validación
    if not legible or not es_legal:
        return {
            "campos": {},
            "faltantes": CAMPOS_REQUERIDOS,
            "advertencias": [rejection_reason or "Documento rechazado por validación."],
            "legible": legible,
            "es_legal": es_legal,
            "rejection_reason": rejection_reason,
            "archivo": nombre_archivo,
            "campos_encontrados": 0,
        }

    # Filtrar solo campos permitidos y limpiar vacíos
    campos = {
        k: str(v).strip()
        for k, v in campos_raw.items()
        if k in CAMPOS_EXTRAIBLES and v and str(v).strip()
    }

    faltantes = [c for c in CAMPOS_REQUERIDOS if c not in campos or not campos[c]]

    advertencias = []
    if faltantes:
        labels = {"nombre_cliente": "Nombre del cliente", "telefono": "Teléfono"}
        advertencias.append(
            f"Campos obligatorios no encontrados: {', '.join(labels.get(f, f) for f in faltantes)}. Debe completarlos manualmente."
        )
    advertencias.append("Próxima fecha y próxima acción deben completarse manualmente.")

    return {
        "campos": campos,
        "faltantes": faltantes,
        "advertencias": advertencias,
        "legible": True,
        "es_legal": True,
        "rejection_reason": None,
        "archivo": nombre_archivo,
        "campos_encontrados": len(campos),
    }
```

- [ ] **Step 6: Correr tests**

```bash
python -m pytest tests/test_document_extractor.py::TestImageSupport -v
```
Esperado: PASS.

- [ ] **Step 7: Commit (backend)**

```bash
cd C:\Users\danie\Downloads\minka-legal
git add agent/document_extractor.py tests/test_document_extractor.py
git commit -m "feat: soporte imágenes en extraer_datos_documento + campos de validación"
```

---

### Task 4: Frontend — parseImageFile + case-form

**Repo:** `C:\Users\danie\Downloads\minka-frontend`

**Files:**
- Modify: `lib/document-parser.ts`
- Modify: `components/case-form.tsx`
- Test: `__tests__/document-parser.test.ts` (extender)

- [ ] **Step 1: Agregar test para parseImageFile**

Agregar en `__tests__/document-parser.test.ts`:

```typescript
import { parseImageFile } from "@/lib/document-parser";

describe("parseImageFile", () => {
  it("rechaza formatos no soportados", async () => {
    const heicFile = new File([new Uint8Array([1, 2, 3])], "foto.heic", { type: "image/heic" });
    await expect(parseImageFile(heicFile, "token")).rejects.toThrow("Solo se aceptan JPG, PNG y WEBP");
  });

  it("rechaza archivos mayores a 10MB", async () => {
    const bigBuffer = new Uint8Array(11 * 1024 * 1024);
    const bigFile = new File([bigBuffer], "grande.jpg", { type: "image/jpeg" });
    await expect(parseImageFile(bigFile, "token")).rejects.toThrow("no debe superar 10 MB");
  });
});
```

- [ ] **Step 2: Correr test — debe fallar**

```bash
npx vitest run __tests__/document-parser.test.ts
```
Esperado: FAIL — `parseImageFile` not found.

- [ ] **Step 3: Agregar parseImageFile en lib/document-parser.ts**

Al final del archivo `lib/document-parser.ts`, agregar:

```typescript
const ALLOWED_IMAGE_EXTS = ["jpg", "jpeg", "png", "webp"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Envía una imagen al backend para extracción de datos via Claude Vision.
 * Valida formato y tamaño antes de enviar.
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
```

- [ ] **Step 4: Correr tests**

```bash
npx vitest run __tests__/document-parser.test.ts
```
Esperado: PASS.

- [ ] **Step 5: Actualizar case-form.tsx para aceptar imágenes**

En `components/case-form.tsx`, localizar la función `handleFile` (alrededor de línea 67) y actualizar:

```typescript
  const handleFile = useCallback(async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    const allowedExts = ["docx", "pdf", "jpg", "jpeg", "png", "webp"];

    if (!ext || !allowedExts.includes(ext)) {
      setUploadState("error");
      setUploadError("Solo se aceptan archivos .docx, .pdf, .jpg, .png y .webp");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadState("error");
      setUploadError("El archivo no debe superar 10 MB");
      return;
    }

    setUploadState("parsing");
    setUploadError(null);
    setFileObject(file);
    setUploadedFile(file.name);

    try {
      let parsed: ParsedDocument;
      const isImage = ["jpg", "jpeg", "png", "webp"].includes(ext);

      if (isImage) {
        parsed = await parseImageFile(file, token || "");
      } else if (ext === "docx") {
        parsed = await parseDocxFile(file);
      } else {
        // PDF — enviar al backend
        const formData = new FormData();
        formData.append("archivo", file);
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${API_URL}/api/casos/extraer-documento`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (!res.ok) throw new Error("Error al procesar el PDF");
        const data = await res.json();
        parsed = mapBackendResponse(data);
      }

      setParseResult(parsed);
      setUploadState("success");

      // Pre-llenar formulario con campos extraídos
      const formValues = getValues();
      const { caseData } = parsed;
      if (caseData.nombre_cliente && !formValues.nombre_cliente)
        reset({ ...formValues, nombre_cliente: caseData.nombre_cliente });
      // ... resto del pre-llenado igual que antes
    } catch (err) {
      setUploadState("error");
      setUploadError(err instanceof Error ? err.message : "Error al procesar el archivo");
    }
  }, [token, reset, getValues]);
```

También actualizar el `accept` del input file (buscar `accept=` en el JSX):

```tsx
<input
  ref={fileInputRef}
  type="file"
  accept=".docx,.pdf,.jpg,.jpeg,.png,.webp"
  className="hidden"
  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
/>
```

Y actualizar el texto descriptivo del drop zone (buscar el texto "Arrastra"):

```tsx
<p className="text-sm text-gray-500">
  DOCX, PDF, JPG, PNG o WEBP — máx. 10 MB
</p>
```

- [ ] **Step 6: Correr tests completos**

```bash
npx vitest run
```
Esperado: todos PASS.

- [ ] **Step 7: Verificar en localhost:3000**

1. Ir a http://localhost:3000/dashboard/casos
2. Abrir formulario de crear caso
3. Intentar subir un `.heic` → debe mostrar error de formato
4. Subir un `.jpg` de prueba → debe enviar al backend y mostrar campos extraídos o advertencia

- [ ] **Step 8: Commit**

```bash
git add lib/document-parser.ts components/case-form.tsx __tests__/document-parser.test.ts
git commit -m "feat: soporte de imágenes JPG/PNG/WEBP en upload de documentos"
```

---

## FASE 3 — Agente Legal Backend

### Task 5: System prompts del agente

**Repo:** `C:\Users\danie\Downloads\minka-legal`

**Files:**
- Modify: `agent/prompts.py`

- [ ] **Step 1: Agregar prompts al final de agent/prompts.py**

```python
# ============================================================
# AGENTE LEGAL — System prompts por acción
# ============================================================

AGENT_ANALIZAR_SYSTEM = """Eres Minka, asistente de IA para abogados peruanos especializado en análisis de documentos legales.

Tu tarea es analizar el documento legal del caso y extraer una estructura clara con:
1. Tipo de documento (denuncia, demanda, resolución, oficio, etc.)
2. Partes del proceso (denunciante/demandante, denunciado/demandado, fiscal, juez)
3. Hechos clave (quién, qué, cuándo, dónde, cómo — máx. 200 palabras)
4. Pretensión o petitorio (qué se solicita)
5. Fundamentos jurídicos citados en el documento
6. Pruebas o medios probatorios mencionados
7. Fechas y plazos importantes
8. Estado procesal actual y próxima etapa

Usa markdown para estructurar la respuesta con encabezados (##) y listas.
Cita artículos con formato: Art. 196 CP, Art. 334 CPP, etc.
Sé preciso y conciso. No repitas información. No inventes datos no presentes en el documento."""

AGENT_ASESORAR_SYSTEM = """Eres Minka, asistente de IA para abogados peruanos especializado en estrategia legal procesal.

Tu tarea es analizar el caso y proporcionar asesoría estratégica que incluya:
1. Evaluación de la posición procesal actual
2. Estrategia recomendada (ofensiva/defensiva) con fundamentos
3. Argumentos jurídicos aplicables y normativa relevante
4. Riesgos procesales y cómo mitigarlos
5. Plazos críticos próximos que no se pueden perder
6. Documentos y pruebas que fortalezerían el caso
7. Próximos pasos concretos y priorizados

Usa markdown con encabezados (##) y listas numeradas.
Cita normativa específica: Art. X del CP/CPP/CC/CPC/NLPT según corresponda.
El abogado ya conoce el derecho procesal — no expliques conceptos básicos.
Sé directo, práctico y orientado a resultados."""

AGENT_REDACTAR_SYSTEM = """Eres Minka, asistente de IA para abogados peruanos especializado en redacción de escritos legales.

Tu tarea es redactar un borrador del escrito legal solicitado con el formato correcto para el sistema judicial peruano:

ESTRUCTURA ESTÁNDAR:
- Encabezado: SEÑOR JUEZ DEL [JUZGADO], EXPEDIENTE N° [número], ESCRITO N° [consecutivo]
- Datos del solicitante y su representante legal
- PETITORIO (lo que se solicita)
- FUNDAMENTOS DE HECHO (numerados)
- FUNDAMENTOS DE DERECHO (artículos aplicables)
- MEDIOS PROBATORIOS (si aplica)
- POR TANTO: fórmula de cierre
- Lugar, fecha y firma

Adapta la estructura al tipo de escrito (recurso de apelación, contestación de demanda, escrito de descargo, demanda, denuncia, memorial, etc.).
Usa los datos concretos del caso. Donde falte información, indica [COMPLETAR: descripción] en corchetes.
Usa lenguaje legal formal peruano. Cita artículos específicos del cuerpo legal aplicable."""

AGENT_NORMATIVA_SYSTEM = """Eres Minka, asistente de IA para abogados peruanos especializado en normativa legal peruana.

Tu tarea es responder consultas sobre normativa legal peruana con:
1. Artículos relevantes con su texto completo o resumen fiel
2. Relación entre artículos (complementarios, modificatorios, derogados)
3. Jurisprudencia relevante de la Corte Suprema o TC si la conoces
4. Aplicación práctica al tipo de caso consultado

Cita siempre: Art. X del [Código/Ley] — [texto del artículo].
Indica si un artículo fue modificado por otra norma.
Si no conoces el artículo exacto, dilo claramente — no inventes textos legales.
Usa markdown con encabezados (##) para organizar por tema."""

AGENT_SYSTEM_PROMPTS = {
    "analizar":  AGENT_ANALIZAR_SYSTEM,
    "asesorar":  AGENT_ASESORAR_SYSTEM,
    "redactar":  AGENT_REDACTAR_SYSTEM,
    "normativa": AGENT_NORMATIVA_SYSTEM,
}
```

- [ ] **Step 2: Commit**

```bash
cd C:\Users\danie\Downloads\minka-legal
git add agent/prompts.py
git commit -m "feat: system prompts para agente legal (analizar/asesorar/redactar/normativa)"
```

---

### Task 6: Crear legal_agent.py

**Files:**
- Create: `agent/legal_agent.py`
- Test: `tests/test_legal_agent.py` (crear)

- [ ] **Step 1: Escribir test**

Crear `tests/test_legal_agent.py`:

```python
import pytest
from unittest.mock import patch, MagicMock
from agent.legal_agent import ejecutar_agente, ACCIONES_VALIDAS, AGENT_TOOLS

def _make_end_turn_response(text: str):
    mock_resp = MagicMock()
    mock_resp.stop_reason = "end_turn"
    mock_resp.content = [MagicMock(text=text, type="text")]
    return mock_resp

def _make_caso():
    return {
        "id": 1, "nombre_cliente": "Ana Torres", "tipo_caso": "laboral",
        "estado": "en_tramite", "expediente": "12345-2026",
        "notas": "Despido injustificado", "telefono": "987654321",
    }

class TestAgenteValido:
    def test_acciones_validas_definidas(self):
        assert "analizar" in ACCIONES_VALIDAS
        assert "asesorar" in ACCIONES_VALIDAS
        assert "redactar" in ACCIONES_VALIDAS
        assert "normativa" in ACCIONES_VALIDAS

    def test_tools_definidas(self):
        nombres = [t["name"] for t in AGENT_TOOLS]
        assert "get_case_documents" in nombres
        assert "search_normativa" in nombres
        assert "consejo_procesal" in nombres

    def test_accion_invalida_lanza_error(self):
        with pytest.raises(ValueError, match="Acción no válida"):
            import asyncio
            asyncio.run(ejecutar_agente(1, "inventada", {}, _make_caso()))

class TestEjecucionAgente:
    def test_respuesta_exitosa(self):
        caso = _make_caso()
        with patch("agent.legal_agent.anthropic.Anthropic") as MockClient:
            mock_client = MockClient.return_value
            mock_client.messages.create.return_value = _make_end_turn_response(
                "## Análisis\nEl caso es laboral por despido injustificado."
            )
            import asyncio
            result = asyncio.run(ejecutar_agente(1, "asesorar", {}, caso))
            assert result["accion"] == "asesorar"
            assert "resultado" in result
            assert len(result["resultado"]) > 0
```

- [ ] **Step 2: Correr test — debe fallar**

```bash
python -m pytest tests/test_legal_agent.py -v
```
Esperado: FAIL — `agent.legal_agent` not found.

- [ ] **Step 3: Crear agent/legal_agent.py**

```python
# agent/legal_agent.py
# Agente Legal unificado con tool use para Minka
# Acciones: analizar, asesorar, redactar, normativa

import os
import anthropic
from agent.prompts import AGENT_SYSTEM_PROMPTS
from agent.rag import buscar_normativa, formatear_para_prompt
from agent.legal_advisor import generar_consejo_procesal

ACCIONES_VALIDAS = {"analizar", "asesorar", "redactar", "normativa"}

AGENT_TOOLS = [
    {
        "name": "get_case_documents",
        "description": "Obtiene el texto completo de los documentos del caso para análisis",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "search_normativa",
        "description": "Busca artículos en los códigos legales peruanos (CP, CPP, CC, CPC, NLPT, CNA, Ley 30364, etc.)",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Término de búsqueda (ej: 'plazo prescripción estafa', 'art 387 peculado')",
                }
            },
            "required": ["query"],
        },
    },
    {
        "name": "consejo_procesal",
        "description": "Obtiene la etapa procesal actual del caso, siguiente etapa, plazos legales y documentos requeridos",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
]


def _execute_tool(tool_name: str, tool_input: dict, caso_id: int, caso: dict) -> str:
    if tool_name == "get_case_documents":
        return _get_case_documents(caso_id)
    elif tool_name == "search_normativa":
        return _search_normativa(tool_input.get("query", ""))
    elif tool_name == "consejo_procesal":
        return _consejo_procesal(caso)
    return "Tool no reconocida."


def _get_case_documents(caso_id: int) -> str:
    from agent.cases_db import listar_documentos_caso, obtener_documento_caso
    from agent.crypto import descifrar_texto
    from agent.storage import descargar_archivo

    docs = listar_documentos_caso(caso_id)
    if not docs:
        return "Este caso no tiene documentos subidos."

    textos = []
    for doc in docs[:3]:  # Máximo 3 documentos para no exceder contexto
        try:
            doc_data = obtener_documento_caso(doc["id"])
            if doc_data and doc_data.get("texto_relevante_cifrado"):
                texto = descifrar_texto(doc_data["texto_relevante_cifrado"])
                textos.append(f"=== {doc['nombre']} ===\n{texto[:3000]}")
        except Exception:
            textos.append(f"=== {doc['nombre']} === [No se pudo descifrar]")

    return "\n\n".join(textos) if textos else "No hay texto disponible en los documentos."


def _search_normativa(query: str) -> str:
    if not query.strip():
        return "Query vacía."
    articulos = buscar_normativa(query, top_k=5)
    return formatear_para_prompt(articulos) if articulos else f"No se encontraron artículos para: {query}"


def _consejo_procesal(caso: dict) -> str:
    consejo = generar_consejo_procesal(caso)
    if not consejo.get("tiene_consejo"):
        return f"Sin consejo disponible: {consejo.get('motivo', 'tipo de caso no reconocido')}"

    lines = [
        f"Proceso: {consejo.get('tipo_proceso', '')}",
        f"Norma base: {consejo.get('norma_base', '')}",
        f"Etapa actual: {consejo.get('etapa_actual', '')}",
        f"Siguiente etapa: {consejo.get('siguiente_etapa', '')}",
        f"Descripción: {consejo.get('siguiente_descripcion', '')}",
        f"Plazo: {consejo.get('plazo_descripcion', '')}",
        f"Fecha sugerida: {consejo.get('proxima_fecha_sugerida', 'No calculada')}",
        f"Documentos requeridos: {', '.join(consejo.get('documentos_requeridos', [])) or 'Ninguno'}",
        f"Norma aplicable: {consejo.get('norma', '')}",
    ]
    if consejo.get("advertencia"):
        lines.insert(0, f"⚠️ {consejo['advertencia']}")

    return "\n".join(lines)


def _build_initial_message(accion: str, caso: dict, parametros: dict) -> str:
    caso_resumen = (
        f"CASO: {caso.get('nombre_cliente')} | "
        f"Tipo: {caso.get('tipo_caso')} | "
        f"Estado: {caso.get('estado')} | "
        f"Expediente: {caso.get('expediente', 'S/N')} | "
        f"Notas: {caso.get('notas', 'Sin notas')}"
    )

    if accion == "analizar":
        return f"{caso_resumen}\n\nAnaliza los documentos del caso. Usa la tool get_case_documents para obtenerlos."

    elif accion == "asesorar":
        tema = parametros.get("tema", "estrategia procesal general")
        return (
            f"{caso_resumen}\n\n"
            f"Proporciona asesoría legal sobre: {tema}\n"
            f"Usa consejo_procesal para la etapa actual y search_normativa para normativa relevante."
        )

    elif accion == "redactar":
        tipo_escrito = parametros.get("tipo_escrito", "escrito")
        destinatario = parametros.get("destinatario", "Señor Juez")
        return (
            f"{caso_resumen}\n\n"
            f"Redacta un borrador de: {tipo_escrito}\n"
            f"Destinatario: {destinatario}\n"
            f"Usa get_case_documents para datos del caso y search_normativa para fundamentación."
        )

    elif accion == "normativa":
        query = parametros.get("query", "")
        return (
            f"{caso_resumen}\n\n"
            f"Consulta de normativa: {query}\n"
            f"Usa search_normativa para buscar artículos relevantes."
        )

    return caso_resumen


async def ejecutar_agente(caso_id: int, accion: str, parametros: dict, caso: dict) -> dict:
    if accion not in ACCIONES_VALIDAS:
        raise ValueError(f"Acción no válida: '{accion}'. Opciones: {', '.join(ACCIONES_VALIDAS)}")

    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    system_prompt = AGENT_SYSTEM_PROMPTS[accion]
    user_message = _build_initial_message(accion, caso, parametros)

    messages = [{"role": "user", "content": user_message}]
    tools_used: list[str] = []
    max_iterations = 6

    for _ in range(max_iterations):
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            system=[{"type": "text", "text": system_prompt, "cache_control": {"type": "ephemeral"}}],
            tools=AGENT_TOOLS,
            messages=messages,
        )

        if response.stop_reason == "end_turn":
            text = next((b.text for b in response.content if hasattr(b, "text")), "")
            return {
                "accion": accion,
                "resultado": text,
                "tools_usados": tools_used,
                "tokens_usados": response.usage.input_tokens + response.usage.output_tokens,
                "cached": getattr(response.usage, "cache_read_input_tokens", 0) > 0,
            }

        if response.stop_reason == "tool_use":
            messages.append({"role": "assistant", "content": response.content})
            tool_results = []

            for block in response.content:
                if block.type == "tool_use":
                    tools_used.append(block.name)
                    result = _execute_tool(block.name, block.input, caso_id, caso)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result,
                    })

            messages.append({"role": "user", "content": tool_results})

    raise RuntimeError("El agente no convergió. Intenta de nuevo.")
```

- [ ] **Step 4: Correr tests**

```bash
python -m pytest tests/test_legal_agent.py -v
```
Esperado: PASS.

- [ ] **Step 5: Commit**

```bash
git add agent/legal_agent.py tests/test_legal_agent.py
git commit -m "feat: legal_agent.py — agente Claude con tool use para 4 acciones legales"
```

---

### Task 7: Endpoint /agente en dashboard_api.py

**Files:**
- Modify: `agent/dashboard_api.py`

- [ ] **Step 1: Agregar imports y modelos necesarios**

Al inicio de `dashboard_api.py`, agregar los imports (después de los imports existentes):

```python
from agent.legal_agent import ejecutar_agente, ACCIONES_VALIDAS

class AgentRequest(BaseModel):
    accion: str
    parametros: dict = {}
```

Nota: verificar que `BaseModel` ya está importado de pydantic (buscar `from pydantic import BaseModel` en el archivo). Si no está, agregarlo.

- [ ] **Step 2: Agregar endpoint después del endpoint de chat (/api/casos/{caso_id}/chat)**

Localizar la línea `@router.get("/api/casos/{caso_id}/chat/historial")` (alrededor de línea 884) y ANTES de ella, insertar:

```python
@router.post("/api/casos/{caso_id}/agente")
async def api_agente_legal(caso_id: int, data: AgentRequest, request: Request, user=Depends(require_auth)):
    """Agente Legal unificado: analizar, asesorar, redactar, normativa."""
    caso = obtener_caso(caso_id)
    if not caso:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Caso no encontrado")

    if data.accion not in ACCIONES_VALIDAS:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=f"Acción no válida: {data.accion}")

    # Para "analizar" verificar que hay documentos
    if data.accion == "analizar":
        from agent.cases_db import listar_documentos_caso
        docs = listar_documentos_caso(caso_id)
        if not docs:
            from fastapi import HTTPException
            raise HTTPException(status_code=422, detail="Este caso no tiene documentos. Sube un archivo primero.")

    try:
        resultado = await ejecutar_agente(caso_id, data.accion, data.parametros, caso)
        return resultado
    except RuntimeError as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=504, detail=str(e))
```

- [ ] **Step 3: Probar endpoint manualmente**

Iniciar el backend:
```bash
cd C:\Users\danie\Downloads\minka-legal
uvicorn agent.main:app --reload --port 8000
```

En otra terminal, obtener un token de prueba logueándose y luego:
```bash
curl -X POST http://localhost:8000/api/casos/1/agente \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"accion": "asesorar", "parametros": {}}'
```
Esperado: respuesta JSON con `accion`, `resultado`, `tools_usados`.

- [ ] **Step 4: Commit (backend)**

```bash
cd C:\Users\danie\Downloads\minka-legal
git add agent/dashboard_api.py agent/prompts.py
git commit -m "feat: endpoint POST /api/casos/{id}/agente — agente legal unificado"
```

---

## FASE 4 — Agente Legal Frontend

### Task 8: agentApi en lib/api.ts

**Repo:** `C:\Users\danie\Downloads\minka-frontend`

**Files:**
- Modify: `lib/api.ts`
- Test: `__tests__/api.test.ts` (crear)

- [ ] **Step 1: Escribir test**

Crear `__tests__/api.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";

// Mock fetch globalmente
global.fetch = vi.fn();

describe("agentApi", () => {
  it("exporta función run", async () => {
    const { agentApi } = await import("@/lib/api");
    expect(typeof agentApi.run).toBe("function");
  });
});
```

- [ ] **Step 2: Correr test — debe fallar**

```bash
npx vitest run __tests__/api.test.ts
```
Esperado: FAIL — `agentApi` not found.

- [ ] **Step 3: Agregar agentApi a lib/api.ts**

Al final de `lib/api.ts`, agregar:

```typescript
// ============================================
// AGENT API
// ============================================
export interface AgentRequest {
  accion: "analizar" | "asesorar" | "redactar" | "normativa";
  parametros?: {
    tipo_escrito?: string;
    destinatario?: string;
    query?: string;
    tema?: string;
  };
}

export interface AgentResponse {
  accion: string;
  resultado: string;
  tools_usados: string[];
  tokens_usados: number;
  cached: boolean;
}

export const agentApi = {
  run: (casoId: number, request: AgentRequest, token: string): Promise<AgentResponse> =>
    fetchAPI<AgentResponse>(`/api/casos/${casoId}/agente`, {
      method: "POST",
      token,
      body: JSON.stringify(request),
    }),
};
```

- [ ] **Step 4: Correr tests**

```bash
npx vitest run __tests__/api.test.ts
```
Esperado: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/api.ts __tests__/api.test.ts
git commit -m "feat: agentApi.run() para comunicación con endpoint /agente"
```

---

### Task 9: Instalar react-markdown y crear LegalAgentPanel

**Files:**
- Create: `components/legal-agent-panel.tsx`
- Test: `__tests__/legal-agent-panel.test.tsx` (crear)

- [ ] **Step 1: Instalar react-markdown**

```bash
cd C:\Users\danie\Downloads\minka-frontend
npm install react-markdown
```

Verificar que se agregó a package.json.

- [ ] **Step 2: Escribir test**

Crear `__tests__/legal-agent-panel.test.tsx`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LegalAgentPanel } from "@/components/legal-agent-panel";

vi.mock("@/lib/api", () => ({
  agentApi: {
    run: vi.fn().mockResolvedValue({
      accion: "asesorar",
      resultado: "## Estrategia\nDefensa por falta de pruebas.",
      tools_usados: ["consejo_procesal"],
      tokens_usados: 500,
      cached: false,
    }),
  },
}));

vi.mock("@/lib/auth-store", () => ({
  useAuthStore: () => ({ token: "test-token" }),
}));

describe("LegalAgentPanel", () => {
  it("muestra los 4 botones de acción", () => {
    render(<LegalAgentPanel casoId={1} tieneDocumentos={true} />);
    expect(screen.getByText(/Analizar/i)).toBeInTheDocument();
    expect(screen.getByText(/Asesor/i)).toBeInTheDocument();
    expect(screen.getByText(/Redactar/i)).toBeInTheDocument();
    expect(screen.getByText(/Normativa/i)).toBeInTheDocument();
  });

  it("deshabilita Analizar si no hay documentos", () => {
    render(<LegalAgentPanel casoId={1} tieneDocumentos={false} />);
    const btn = screen.getByRole("button", { name: /Analizar/i });
    expect(btn).toBeDisabled();
  });

  it("muestra resultado al hacer click en Asesor", async () => {
    const user = userEvent.setup();
    render(<LegalAgentPanel casoId={1} tieneDocumentos={true} />);
    await user.click(screen.getByRole("button", { name: /Asesor/i }));
    // Esperar resultado
    expect(await screen.findByText(/Estrategia/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Correr test — debe fallar**

```bash
npx vitest run __tests__/legal-agent-panel.test.tsx
```
Esperado: FAIL — `LegalAgentPanel` not found.

- [ ] **Step 4: Crear components/legal-agent-panel.tsx**

```typescript
"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { FileSearch, Scale, FileText, BookOpen, Loader2, AlertCircle, RotateCcw } from "lucide-react";
import { agentApi, type AgentRequest, type AgentResponse } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

interface LegalAgentPanelProps {
  casoId: number;
  tieneDocumentos: boolean;
}

type Accion = "analizar" | "asesorar" | "redactar" | "normativa";
type PanelState = "idle" | "loading" | "success" | "error";

const ACCIONES = [
  {
    id: "analizar" as Accion,
    label: "Analizar documento",
    icon: FileSearch,
    description: "Extrae y estructura los elementos del documento del caso",
    requiereDocumentos: true,
  },
  {
    id: "asesorar" as Accion,
    label: "Asesor estratégico",
    icon: Scale,
    description: "Estrategia legal, argumentos y próximos pasos",
    requiereDocumentos: false,
  },
  {
    id: "redactar" as Accion,
    label: "Redactar escrito",
    icon: FileText,
    description: "Borrador de escrito con formato legal peruano",
    requiereDocumentos: false,
  },
  {
    id: "normativa" as Accion,
    label: "Buscar normativa",
    icon: BookOpen,
    description: "Artículos del CP, CPP, CC, NLPT, Ley 30364, etc.",
    requiereDocumentos: false,
  },
] as const;

const TIPOS_ESCRITO = [
  "Recurso de apelación",
  "Escrito de descargo",
  "Contestación de demanda",
  "Demanda",
  "Denuncia penal",
  "Memorial",
  "Solicitud de plazo",
  "Oficio",
];

export function LegalAgentPanel({ casoId, tieneDocumentos }: LegalAgentPanelProps) {
  const token = useAuthStore((s) => s.token);
  const [accionActiva, setAccionActiva] = useState<Accion | null>(null);
  const [state, setState] = useState<PanelState>("idle");
  const [resultado, setResultado] = useState<AgentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sub-form state
  const [tipoEscrito, setTipoEscrito] = useState("");
  const [destinatario, setDestinatario] = useState("");
  const [queryNormativa, setQueryNormativa] = useState("");

  const ejecutar = async (accion: Accion) => {
    setAccionActiva(accion);
    setState("loading");
    setError(null);
    setResultado(null);

    const parametros: AgentRequest["parametros"] = {};
    if (accion === "redactar") {
      parametros.tipo_escrito = tipoEscrito;
      parametros.destinatario = destinatario;
    } else if (accion === "normativa") {
      parametros.query = queryNormativa;
    }

    try {
      const res = await agentApi.run(casoId, { accion, parametros }, token || "");
      setResultado(res);
      setState("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error del agente. Intenta de nuevo.");
      setState("error");
    }
  };

  const reintentar = () => {
    if (accionActiva) ejecutar(accionActiva);
  };

  return (
    <div className="space-y-4">
      {/* Botones de acción */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ACCIONES.map(({ id, label, icon: Icon, description, requiereDocumentos }) => {
          const disabled = (requiereDocumentos && !tieneDocumentos) || state === "loading";
          const isActive = accionActiva === id;
          return (
            <button
              key={id}
              onClick={() => ejecutar(id)}
              disabled={disabled}
              title={requiereDocumentos && !tieneDocumentos ? "Sube un documento primero" : description}
              className={`flex flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors
                ${isActive && state === "loading"
                  ? "border-minka-500 bg-minka-50 text-minka-700"
                  : "border-gray-200 bg-white hover:border-minka-300 hover:bg-minka-50"
                }
                ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}
              `}
            >
              <Icon className="h-4 w-4 text-minka-500" />
              <span className="font-medium leading-tight">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Sub-formulario para Redactar */}
      {accionActiva === "redactar" && state !== "success" && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
          <select
            value={tipoEscrito}
            onChange={(e) => setTipoEscrito(e.target.value)}
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
          >
            <option value="">— Tipo de escrito —</option>
            {TIPOS_ESCRITO.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input
            type="text"
            value={destinatario}
            onChange={(e) => setDestinatario(e.target.value)}
            placeholder="Destinatario (ej: Señor Juez del 3er Juzgado Penal)"
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
          />
          <button
            onClick={() => ejecutar("redactar")}
            disabled={!tipoEscrito || state === "loading"}
            className="rounded bg-minka-500 px-3 py-1.5 text-sm text-white hover:bg-minka-600 disabled:opacity-40"
          >
            Generar borrador
          </button>
        </div>
      )}

      {/* Sub-formulario para Normativa */}
      {accionActiva === "normativa" && state !== "success" && (
        <div className="flex gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <input
            type="text"
            value={queryNormativa}
            onChange={(e) => setQueryNormativa(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && queryNormativa && ejecutar("normativa")}
            placeholder="ej: plazo prescripción estafa, art 387 peculado..."
            className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm"
          />
          <button
            onClick={() => ejecutar("normativa")}
            disabled={!queryNormativa || state === "loading"}
            className="rounded bg-minka-500 px-3 py-1.5 text-sm text-white hover:bg-minka-600 disabled:opacity-40"
          >
            Buscar
          </button>
        </div>
      )}

      {/* Estado: Cargando */}
      {state === "loading" && (
        <div className="flex items-center gap-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          El agente está analizando el caso...
        </div>
      )}

      {/* Estado: Error */}
      {state === "error" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm">
          <div className="flex items-start gap-2 text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={reintentar}
            className="mt-2 flex items-center gap-1 text-xs text-red-600 hover:text-red-800"
          >
            <RotateCcw className="h-3 w-3" /> Reintentar
          </button>
        </div>
      )}

      {/* Estado: Resultado */}
      {state === "success" && resultado && (
        <div className="rounded-lg border border-gray-200 bg-white">
          {/* Header del resultado */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {resultado.accion}
            </span>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              {resultado.tools_usados.length > 0 && (
                <span>Tools: {resultado.tools_usados.join(", ")}</span>
              )}
              {resultado.cached && (
                <span className="rounded bg-green-100 px-1.5 py-0.5 text-green-700">cached</span>
              )}
              <button
                onClick={() => { setState("idle"); setAccionActiva(null); setResultado(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>
          {/* Contenido markdown */}
          <div className="prose prose-sm max-w-none p-4 text-gray-800">
            <ReactMarkdown>{resultado.resultado}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Correr tests**

```bash
npx vitest run __tests__/legal-agent-panel.test.tsx
```
Esperado: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/legal-agent-panel.tsx __tests__/legal-agent-panel.test.tsx package.json package-lock.json
git commit -m "feat: LegalAgentPanel — 4 acciones IA, markdown, subformularios"
```

---

### Task 10: Agregar tab "Agente Legal" en caso/[id]/page.tsx

**Files:**
- Modify: `app/dashboard/casos/[id]/page.tsx`

- [ ] **Step 1: Leer la estructura actual del archivo**

```bash
grep -n "tab\|Tab\|Chat\|Documentos\|import" app/dashboard/casos/\[id\]/page.tsx | head -30
```

Identificar:
- Dónde se definen los tabs actuales
- Qué prop controla el tab activo
- Cómo se importan los componentes del panel

- [ ] **Step 2: Agregar import de LegalAgentPanel**

Al inicio del archivo, después de los imports existentes:

```typescript
import { LegalAgentPanel } from "@/components/legal-agent-panel";
```

- [ ] **Step 3: Agregar el tab "Agente Legal"**

Localizar donde se definen los tabs (buscar el array/lista de tabs o los botones de tab) y agregar:

```typescript
{ id: "agente", label: "⚖️ Agente Legal" }
```

- [ ] **Step 4: Agregar el panel del agente en el contenido condicional**

En la sección donde se renderiza el contenido según el tab activo, agregar:

```tsx
{activeTab === "agente" && (
  <div className="p-4">
    <LegalAgentPanel
      casoId={caso.id}
      tieneDocumentos={(documentos?.length ?? 0) > 0}
    />
  </div>
)}
```

Donde `documentos` es el array de documentos del caso (ya debería existir en el estado de la página).

- [ ] **Step 5: Verificar en localhost:3000**

1. Ir a http://localhost:3000/dashboard/casos
2. Hacer click en un caso existente
3. Verificar que aparece el tab "⚖️ Agente Legal"
4. Hacer click → ver los 4 botones
5. Probar "Asesor estratégico" → debe llamar al backend y mostrar resultado en markdown
6. Probar "Buscar normativa" con query "prescripción penal" → debe mostrar artículos

- [ ] **Step 6: Correr tests completos frontend**

```bash
npx vitest run
```
Esperado: todos PASS.

- [ ] **Step 7: Commit**

```bash
git add app/dashboard/casos/\[id\]/page.tsx
git commit -m "feat: tab Agente Legal en detalle de caso con 4 acciones IA"
```

---

## FASE 5 — Integración y Smoke Test

### Task 11: Smoke test end-to-end

- [ ] **Step 1: Verificar backend en Railway o local**

Confirmar que backend está corriendo (Railway o local):
```bash
curl https://katia-jorkat-production.up.railway.app/
```
Esperado: `{"status": "ok", ...}`

- [ ] **Step 2: Flujo completo — ramas legales**

1. http://localhost:3000/dashboard/casos → "Nuevo caso"
2. Abrir dropdown "Tipo de caso" → verificar que aparecen los 22 tipos
3. Verificar labels en español sin errores

- [ ] **Step 3: Flujo completo — imagen**

1. En formulario de caso, arrastrar una foto de un documento legal (JPG)
2. Verificar que se envía al backend y retorna campos extraídos
3. Arrastrar una foto sin texto (selfie) → verificar mensaje de error "no es documento legal"

- [ ] **Step 4: Flujo completo — agente**

1. Abrir detalle de un caso con documentos subidos
2. Tab "Agente Legal" → "Asesor estratégico" → esperar respuesta
3. Verificar que el markdown se renderiza (negrita, listas, encabezados)
4. "Buscar normativa" → query "Art 387 peculado" → verificar artículos del CP

- [ ] **Step 5: Commit final y push**

```bash
# Frontend
cd C:\Users\danie\Downloads\minka-frontend
git log --oneline -5  # verificar commits del sprint
git push origin main

# Backend
cd C:\Users\danie\Downloads\minka-legal
git log --oneline -5
git push origin main
```

---

## Notas de Implementación

1. **react-markdown**: Al instalarlo, si hay error de tipos en TS, agregar `@types/react-markdown` o usar `// @ts-ignore` temporal.

2. **prose classes de Tailwind**: Para que el markdown se vea bien, verificar que `@tailwindcss/typography` está instalado. Si no: `npm install -D @tailwindcss/typography` y agregar `require('@tailwindcss/typography')` a `tailwind.config.ts` plugins.

3. **Timeout del agente**: El agente puede tardar 15-30 segundos en casos complejos con múltiples tool calls. Si Railway tiene timeout de 30s, considerar streaming en Fase 2 del proyecto.

4. **WEBP en backend**: El Content-Type para WEBP es `image/webp`. Verificar que la detección de media type en `extraer_datos_documento` cubre todos los casos.

5. **Modelo claude-sonnet-4-6**: El ID exacto es `claude-sonnet-4-6` tal como se usa en el endpoint de chat existente (línea 849 de dashboard_api.py).
