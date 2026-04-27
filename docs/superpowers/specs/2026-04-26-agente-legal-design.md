# Spec: Agente Legal, Ramas Ampliadas y Soporte Multimedia de Documentos

**Fecha:** 2026-04-26  
**Proyecto:** Minka Frontend + Backend (minka-legal)  
**Estado:** Aprobado

---

## 1. Resumen

Tres mejoras coordinadas para preparar Minka para la prueba real con abogados:

1. **Ramas legales ampliadas** — de 8 a 20+ tipos de caso cubriendo todo el derecho peruano
2. **Agente Legal IA** — endpoint unificado con tool use para 4 acciones estructuradas (analizar, asesorar, redactar, normativa), separado del chat libre
3. **Soporte multimedia de documentos** — DOCX (existente), PDF (existente), imágenes JPG/PNG/WEBP (nuevo) con validación en 4 criterios

---

## 2. Arquitectura General

```
FRONTEND                              BACKEND (minka-legal)
────────────────────────────────      ──────────────────────────────────────
types/index.ts                        agent/legal_agent.py       (NUEVO)
  └─ CaseType +12 tipos                 └─ POST /api/casos/:id/agente
  └─ CASE_TYPE_LABELS                   └─ accion: analizar|asesorar|
  └─ CODIGO_LABELS ampliado                       redactar|normativa
                                        └─ Tools: get_case_documents,
lib/document-parser.ts                            search_normativa,
  └─ caseTypeMap: keywords nuevas                 calculate_deadline,
  └─ parseImageFile() NUEVO                       get_jurisprudencia
  └─ PDF: sin cambios
                                      agent/prompts.py            (MEJORADO)
components/legal-agent-panel.tsx        └─ System prompts por acción
  (NUEVO)
  └─ 4 botones de acción             api/extraer_documento.py    (MEJORADO)
  └─ Subformularios por acción         └─ + imágenes via Vision API
  └─ Render markdown de respuesta      └─ + validación: legible/legal/texto
  └─ Estado: idle|loading|success|err  └─ Respuesta ampliada con advertencias

app/dashboard/casos/[id]/page.tsx     routers/casos.py            (MEJORADO)
  └─ Tab "Agente Legal"                 └─ POST /api/casos/{id}/agente

lib/api.ts
  └─ agentApi.run() NUEVO
```

**Separación de responsabilidades:**
- **Chat** = conversación libre con historial persistente, el abogado pregunta lo que quiera
- **Agente Legal** = acciones concretas con output estructurado, stateless por request

---

## 3. Ramas Legales Ampliadas

### 3.1 Nuevos tipos de caso (CaseType)

```typescript
// Tipos existentes (mantener)
"penal_estafa" | "penal_robo" | "penal_lesiones"
"laboral"
"familia_alimentos" | "familia_tenencia"
"civil_desalojo" | "civil_otro"

// Tipos nuevos
"penal_violencia_familiar"   // Ley 30364
"penal_homicidio"            // CP Art. 106-108
"penal_corrupcion"           // Peculado, colusión, cohecho
"penal_tid"                  // Tráfico ilícito de drogas
"penal_lavado"               // Lavado de activos
"administrativo_recurso"     // Recursos administrativos, silencio admin
"administrativo_contencioso" // Demandas contra el Estado
"tributario"                 // SUNAT, Tribunal Fiscal, cobranza coactiva
"constitucional"             // Hábeas corpus, amparo, acción popular
"comercial_contrato"         // Contratos mercantiles, incumplimiento
"comercial_societario"       // Constitución empresa, fusiones, liquidaciones
"sucesiones"                 // Declaratoria herederos, testamentos, partición
"inmobiliario"               // Compraventa, SUNARP, usucapión, hipotecas
```

### 3.2 Códigos legales a agregar en CODIGO_LABELS

```typescript
"L30364": "Ley 30364 - Violencia contra la Mujer e Integrantes del Grupo Familiar"
"L29497": "Ley 29497 - Nueva Ley Procesal del Trabajo"
"LPAG":   "Ley 27444 - Procedimiento Administrativo General"
"CT":     "Código Tributario"
"LGS":    "Ley General de Sociedades (Ley 26887)"
"CPCo":   "Código Procesal Constitucional"
"LCT":    "Ley de Contrataciones del Estado"
```

### 3.3 Keywords del parser para tipos nuevos

Cada tipo nuevo agrega sus keywords en `caseTypeMap` de `document-parser.ts`:

```typescript
"violencia": "penal_violencia_familiar",
"feminicidio": "penal_violencia_familiar",
"homicidio": "penal_homicidio",
"asesinato": "penal_homicidio",
"peculado": "penal_corrupcion",
"corrupcion": "penal_corrupcion",
"cohecho": "penal_corrupcion",
"drogas": "penal_tid",
"narcotráfico": "penal_tid",
"lavado": "penal_lavado",
"administrativo": "administrativo_recurso",
"contencioso": "administrativo_contencioso",
"sunat": "tributario",
"tributario": "tributario",
"amparo": "constitucional",
"habeas corpus": "constitucional",
"societario": "comercial_societario",
"empresa": "comercial_societario",
"herencia": "sucesiones",
"testamento": "sucesiones",
"sunarp": "inmobiliario",
"hipoteca": "inmobiliario",
"usucapion": "inmobiliario",
```

---

## 4. Agente Legal IA

### 4.1 Endpoint backend

```
POST /api/casos/{caso_id}/agente
Authorization: Bearer <token>

Body:
{
  "accion": "analizar" | "asesorar" | "redactar" | "normativa",
  "parametros": {
    // Para "redactar":
    "tipo_escrito": "recurso_apelacion" | "escrito_descargo" | "demanda" | "denuncia" | "memorial",
    "destinatario": string,
    // Para "normativa":
    "query": string,
    // Para "asesorar":
    "tema": string (opcional)
  }
}

Respuesta:
{
  "accion": string,
  "resultado": string,          // Markdown
  "tools_usados": string[],     // Para transparencia
  "tokens_usados": number,
  "cached": boolean
}
```

### 4.2 Tools disponibles del agente

| Tool | Descripción |
|------|-------------|
| `get_case_documents()` | Documentos descifrados del caso (BM25 cacheado) |
| `search_normativa(query)` | Busca en base de datos de códigos legales peruanos |
| `calculate_deadline(fecha, dias, tipo)` | Integra con calculadora de plazos |
| `get_jurisprudencia(tema)` | Jurisprudencia basada en conocimiento de Claude (v1); sin BD real aún — ver Sección 8 |

### 4.3 System prompts por acción (en agent/prompts.py)

- **analizar** — Extrae y estructura los elementos del documento: partes, pretensiones, fundamentos, normativa citada, plazos mencionados
- **asesorar** — Dado el caso completo, proporciona estrategia legal, argumentos aplicables, riesgos, plazos críticos, normativa relevante
- **redactar** — Genera borrador del tipo de escrito solicitado con formato legal peruano correcto, encabezados de juzgado, petitorios
- **normativa** — Responde consulta legal con citas exactas de artículos, jurisprudencia y doctrina aplicable al derecho peruano

### 4.4 Optimización: Prompt Caching

- El system prompt especializado + datos del caso se marcan con `cache_control: {"type": "ephemeral"}`
- TTL de 5 minutos — múltiples acciones sobre el mismo caso en una sesión reutilizan el cache
- Ahorro estimado: ~70% de tokens en llamadas repetidas al mismo caso

### 4.5 Componente frontend: LegalAgentPanel

```
LegalAgentPanel
├─ ActionButtons (4 botones)
│   ├─ Analizar documento → ejecuta directo si hay docs, error si no
│   ├─ Asesor estratégico → ejecuta directo con tema opcional
│   ├─ Redactar escrito → muestra subformulario (tipo + destinatario)
│   └─ Buscar normativa → muestra input de query (requerido)
├─ SubForm (condicional según acción seleccionada)
├─ ResultPanel
│   ├─ Loading state (spinner + "El agente está analizando...")
│   ├─ Success state (render markdown — instalar react-markdown, no existe aún en el proyecto)
│   └─ Error state (mensaje inline, botón reintentar)
└─ Metadata (tools usados, cached badge)
```

**Ubicación:** Tab "Agente Legal" en `app/dashboard/casos/[id]/page.tsx`, al mismo nivel que Chat y Documentos.

---

## 5. Soporte Multimedia de Documentos

### 5.1 Formatos soportados

| Formato | Procesamiento | Cambio |
|---------|--------------|--------|
| `.docx` | mammoth.js client-side (sin servidor) | Sin cambios |
| `.pdf` | Backend → Claude API | Sin cambios |
| `.jpg` `.jpeg` `.png` `.webp` | Backend → Claude Vision API (se envía al servidor, a diferencia de docx) | **NUEVO** |
| `.heic` `.bmp` `.tiff` etc. | Rechazado en frontend | **NUEVO** |

### 5.2 Flujo de validación de imágenes

```
1. Frontend: valida extensión (JPG/PNG/WEBP only) → error inmediato si no
2. Frontend: valida tamaño (≤10MB, igual que PDF)
3. Backend recibe imagen → Claude Vision evalúa:
   a. ¿Es legible? (contraste, nitidez, orientación)
   b. ¿Es documento legal peruano? (denuncia, demanda, resolución, etc.)
   c. ¿Tiene texto extraíble suficiente?
4. Si falla cualquier criterio → respuesta con rejection_reason
5. Si pasa → extrae campos igual que PDF, devuelve advertencias de faltantes
```

### 5.3 Respuesta del backend (ampliada)

```json
{
  "campos": { "nombre_cliente": "...", "expediente": "...", ... },
  "faltantes": ["telefono", "tipo_caso"],
  "advertencias": ["No se encontró número de expediente"],
  "legible": true,
  "es_legal": true,
  "rejection_reason": null
}
```

### 5.4 Mensajes de error al abogado

| Condición | Mensaje |
|-----------|---------|
| Formato no soportado | "Solo se aceptan JPG, PNG, WEBP, PDF y DOCX" |
| Imagen ilegible | "La imagen no tiene suficiente calidad. Intenta con foto más clara o sube el PDF." |
| No es documento legal | "La imagen no parece ser un documento legal. Sube una denuncia, demanda, resolución u otro documento del caso." |
| Sin texto extraíble | "No se encontró texto suficiente. Puedes completar el formulario manualmente." |
| Extracción parcial | Banner amarillo: "Se encontraron X de Y campos. Completa los faltantes: [lista]" |
| Extracción completa | Banner verde con campos encontrados |

---

## 6. Manejo de Errores del Agente

| Caso | Comportamiento |
|------|---------------|
| Backend timeout (>30s) | "El agente tardó demasiado. Intenta de nuevo." + botón reintentar |
| Error Claude API | "Servicio de IA no disponible momentáneamente." |
| Sin documentos para "Analizar" | "Este caso no tiene documentos subidos. Sube un archivo primero." |
| Query normativa vacía | Botón deshabilitado |
| "Redactar" sin tipo seleccionado | Botón deshabilitado |
| Error de red | "Error de conexión. Verifica tu internet." |

Los errores del agente son siempre inline en el panel — no afectan el resto de la página del caso.

---

## 7. Archivos Modificados / Creados

### Frontend (minka-frontend)
| Archivo | Acción |
|---------|--------|
| `types/index.ts` | Modificar — +12 CaseType, labels, CODIGO_LABELS |
| `lib/document-parser.ts` | Modificar — keywords nuevas + parseImageFile() |
| `lib/api.ts` | Modificar — agentApi.run() |
| `components/legal-agent-panel.tsx` | Crear |
| `app/dashboard/casos/[id]/page.tsx` | Modificar — agregar tab Agente Legal |
| `components/case-form.tsx` | Modificar — aceptar imágenes en upload |

### Backend (minka-legal)
| Archivo | Acción |
|---------|--------|
| `agent/legal_agent.py` | Crear — agente con tool use |
| `agent/prompts.py` | Modificar — system prompts por acción |
| `api/extraer_documento.py` | Modificar — Vision API + validación |
| `routers/casos.py` | Modificar — nuevo endpoint /agente |

---

## 8. Lo que NO entra en este sprint

- Jurisprudencia real (Casaciones, PLENOS) — el tool `get_jurisprudencia` puede retornar placeholder en v1
- Exportar resultados del agente a PDF
- Historial de consultas del agente por caso
- Google Drive integration
