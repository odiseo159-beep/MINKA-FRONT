# Multi-Documentos por Caso — Implementation Plan

> **ESTADO: COMPLETADO al 2026-04-15** — Todo deployado en Vercel + Railway.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir múltiples documentos por caso con extracción inteligente de texto, compresión + cifrado en BD, recuperación BM25 en el chat IA, y prompt caching para reducir costos de API.

**Implementado además del plan original (2026-04-15):**
- BM25 cache en memoria por `caso_id` (`agent/dashboard_api.py`)
- Soft delete para casos — `eliminar_caso` ahora hace `UPDATE SET eliminado=1` (`agent/cases_db.py`)
- Prompts extraídos a `agent/prompts.py`
- Auth sliding expiry — `POST /auth/refresh` + auto-refresh en frontend si quedan < 2h
- Migración doc legacy → nuevo sistema: `POST /api/casos/{id}/documentos/migrar-legacy` + botón "Migrar" en `DocumentosPanel`
- Fix `tieneDocumento` en detalle de caso para detectar docs en nuevo sistema
- Correcciones de seguridad: CORS origen explícito, JWT_SECRET_KEY warning, debug endpoints protegidos, webhook token validation
- SQLite indices + campo `version` para optimistic locking

**Pendiente (mañana):**
- Configurar variables de entorno en Railway: `JWT_SECRET_KEY`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `WHAPI_WEBHOOK_TOKEN`, `DEBUG_TOKEN`

**Architecture:** Nueva tabla `caso_documentos` en SQLite. Al subir cada doc, Claude extrae un JSON estructurado (hechos, partes, pruebas, fechas) filtrando relleno. El texto relevante se comprime con gzip y cifra con Fernet antes de guardarse. El chat usa BM25 para recuperar solo los fragmentos relevantes a la pregunta, y aplica prompt caching en el bloque de documentos. El frontend muestra un panel de documentos en el detalle del caso.

**Tech Stack:** FastAPI, SQLite, boto3 (R2), cryptography (Fernet), gzip, rank_bm25, Anthropic SDK (prompt caching), Next.js 14, React Query 5, TypeScript

---

## Mapa de archivos

### Backend — `C:\Users\danie\Downloads\minka-legal`

| Archivo | Acción | Responsabilidad |
|---------|--------|----------------|
| `requirements.txt` | MODIFY | Agregar `cryptography>=42.0.0` |
| `agent/crypto.py` | CREATE | gzip compress + Fernet encrypt/decrypt |
| `agent/cases_db.py` | MODIFY | Tabla `caso_documentos` + CRUD functions |
| `agent/document_extractor.py` | MODIFY | Agregar `extraer_resumen_estructurado()` |
| `agent/dashboard_api.py` | MODIFY | 4 endpoints multi-doc + chat con BM25 y prompt caching |

### Frontend — `C:\Users\danie\Downloads\minka-frontend`

| Archivo | Acción | Responsabilidad |
|---------|--------|----------------|
| `types/index.ts` | MODIFY | Agregar `CaseDocument` interface |
| `lib/api.ts` | MODIFY | Agregar `caseDocumentosApi` |
| `hooks/use-documentos.ts` | CREATE | React Query hooks para documentos |
| `components/documentos-panel.tsx` | CREATE | Lista/upload/download/delete UI |
| `app/dashboard/casos/[id]/page.tsx` | MODIFY | Integrar DocumentosPanel |

---

## Task 1: Backend — requirements.txt + crypto.py

**Files:**
- Modify: `C:\Users\danie\Downloads\minka-legal\requirements.txt`
- Create: `C:\Users\danie\Downloads\minka-legal\agent\crypto.py`

- [ ] **Step 1.1: Agregar cryptography a requirements.txt**

Agregar al final de `requirements.txt`:
```
cryptography>=42.0.0
```

- [ ] **Step 1.2: Crear agent/crypto.py**

```python
"""
crypto.py — Compresión gzip + cifrado Fernet para texto de documentos.

Variable de entorno requerida (opcional, si no está solo comprime):
  DOCUMENT_ENCRYPTION_KEY — clave Fernet base64 de 32 bytes
  
Generar clave nueva:
  python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
"""

import os
import gzip
import base64

ENCRYPTION_KEY = os.getenv("DOCUMENT_ENCRYPTION_KEY", "")


def _get_fernet():
    if not ENCRYPTION_KEY:
        return None
    from cryptography.fernet import Fernet
    key = ENCRYPTION_KEY.encode() if isinstance(ENCRYPTION_KEY, str) else ENCRYPTION_KEY
    return Fernet(key)


def compress_encrypt(text: str) -> str:
    """
    Comprime con gzip y cifra con Fernet.
    Si DOCUMENT_ENCRYPTION_KEY no está configurada, solo comprime.
    Retorna string base64 seguro para almacenar en SQLite.
    """
    compressed = gzip.compress(text.encode("utf-8"), compresslevel=9)
    f = _get_fernet()
    if f:
        result = f.encrypt(compressed)
    else:
        result = compressed
    return base64.urlsafe_b64encode(result).decode("utf-8")


def decrypt_decompress(data: str) -> str:
    """
    Descifra y descomprime. Reverso de compress_encrypt.
    Si DOCUMENT_ENCRYPTION_KEY no está configurada, asume solo comprimido.
    """
    raw = base64.urlsafe_b64decode(data.encode("utf-8"))
    f = _get_fernet()
    if f:
        try:
            raw = f.decrypt(raw)
        except Exception:
            # Fallback: datos sin cifrar (compatibilidad retroactiva)
            pass
    return gzip.decompress(raw).decode("utf-8")


def encryption_configured() -> bool:
    return bool(ENCRYPTION_KEY)
```

- [ ] **Step 1.3: Instalar dependencia localmente**

```bash
cd C:\Users\danie\Downloads\minka-legal
pip install "cryptography>=42.0.0"
```

- [ ] **Step 1.4: Generar clave de cifrado y agregarla al .env**

```bash
cd C:\Users\danie\Downloads\minka-legal
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Copiar el resultado y agregar al `.env` local:
```
DOCUMENT_ENCRYPTION_KEY=<clave_generada>
```

También agregar la misma clave en Railway como variable `DOCUMENT_ENCRYPTION_KEY`.

- [ ] **Step 1.5: Verificar que crypto.py funciona**

```bash
cd C:\Users\danie\Downloads\minka-legal
python -c "
from agent.crypto import compress_encrypt, decrypt_decompress
texto = 'Hecho: El denunciado sustrajo S/ 5,000 del cliente.'
cifrado = compress_encrypt(texto)
print('Cifrado:', cifrado[:50], '...')
recuperado = decrypt_decompress(cifrado)
print('OK:', recuperado == texto)
"
```

Resultado esperado: `OK: True`

- [ ] **Step 1.6: Commit**

```bash
cd C:\Users\danie\Downloads\minka-legal
git add requirements.txt agent/crypto.py
git commit -m "feat: crypto.py — compresión gzip + cifrado Fernet para texto de documentos"
```

---

## Task 2: Backend — Tabla caso_documentos en cases_db.py

**Files:**
- Modify: `C:\Users\danie\Downloads\minka-legal\agent\cases_db.py`

- [ ] **Step 2.1: Leer el archivo actual**

Leer `agent/cases_db.py` completo para entender la estructura existente (función `init_db`, patrón `_migrate_schema`, función `obtener_caso`).

- [ ] **Step 2.2: Agregar tabla caso_documentos en init_db**

Dentro de la función `init_db()` (donde se ejecutan `CREATE TABLE IF NOT EXISTS`), agregar DESPUÉS de la tabla `casos`:

```python
    conn.execute("""
        CREATE TABLE IF NOT EXISTS caso_documentos (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            caso_id     INTEGER NOT NULL,
            nombre      TEXT NOT NULL,
            tipo_archivo TEXT NOT NULL,
            key_r2      TEXT NOT NULL,
            resumen_json     TEXT,
            texto_relevante  TEXT,
            fecha_subida TEXT NOT NULL,
            FOREIGN KEY (caso_id) REFERENCES casos(id) ON DELETE CASCADE
        )
    """)
```

- [ ] **Step 2.3: Agregar funciones CRUD al final de cases_db.py**

```python
# ─────────────────────────────────────────────
# CRUD — Documentos por caso
# ─────────────────────────────────────────────

def crear_documento_caso(
    caso_id: int,
    nombre: str,
    tipo_archivo: str,
    key_r2: str,
    resumen_json: str = "",
    texto_relevante: str = "",
) -> dict:
    """Inserta un documento en caso_documentos y retorna el registro creado."""
    from datetime import datetime, timezone
    fecha = datetime.now(timezone.utc).isoformat()
    with _get_conn() as conn:
        cur = conn.execute(
            """INSERT INTO caso_documentos
               (caso_id, nombre, tipo_archivo, key_r2, resumen_json, texto_relevante, fecha_subida)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (caso_id, nombre, tipo_archivo, key_r2, resumen_json, texto_relevante, fecha),
        )
        conn.commit()
        return obtener_documento_caso(cur.lastrowid)


def listar_documentos_caso(caso_id: int) -> list:
    """Lista todos los documentos de un caso, ordenados por fecha_subida desc."""
    with _get_conn() as conn:
        rows = conn.execute(
            """SELECT id, caso_id, nombre, tipo_archivo, key_r2,
                      resumen_json, texto_relevante, fecha_subida
               FROM caso_documentos
               WHERE caso_id = ?
               ORDER BY fecha_subida DESC""",
            (caso_id,),
        ).fetchall()
    cols = ["id", "caso_id", "nombre", "tipo_archivo", "key_r2",
            "resumen_json", "texto_relevante", "fecha_subida"]
    return [dict(zip(cols, r)) for r in rows]


def obtener_documento_caso(doc_id: int) -> dict | None:
    """Obtiene un documento por su ID."""
    with _get_conn() as conn:
        row = conn.execute(
            """SELECT id, caso_id, nombre, tipo_archivo, key_r2,
                      resumen_json, texto_relevante, fecha_subida
               FROM caso_documentos WHERE id = ?""",
            (doc_id,),
        ).fetchone()
    if not row:
        return None
    cols = ["id", "caso_id", "nombre", "tipo_archivo", "key_r2",
            "resumen_json", "texto_relevante", "fecha_subida"]
    return dict(zip(cols, row))


def eliminar_documento_caso(doc_id: int) -> bool:
    """Elimina un documento por su ID. Retorna True si existía."""
    with _get_conn() as conn:
        cur = conn.execute("DELETE FROM caso_documentos WHERE id = ?", (doc_id,))
        conn.commit()
        return cur.rowcount > 0
```

- [ ] **Step 2.4: Verificar que la tabla se crea**

```bash
cd C:\Users\danie\Downloads\minka-legal
python -c "
from agent.cases_db import init_db, crear_documento_caso, listar_documentos_caso, eliminar_documento_caso
init_db()
doc = crear_documento_caso(1, 'denuncia.pdf', 'application/pdf', 'casos/1/abc123.pdf', '', '')
print('Creado:', doc)
docs = listar_documentos_caso(1)
print('Lista:', len(docs), 'docs')
ok = eliminar_documento_caso(doc['id'])
print('Eliminado:', ok)
"
```

Resultado esperado: tres líneas sin errores.

- [ ] **Step 2.5: Commit**

```bash
git add agent/cases_db.py
git commit -m "feat: tabla caso_documentos + CRUD en cases_db"
```

---

## Task 3: Backend — Extracción estructurada en document_extractor.py

**Files:**
- Modify: `C:\Users\danie\Downloads\minka-legal\agent\document_extractor.py`

- [ ] **Step 3.1: Agregar PROMPT_RESUMEN_ESTRUCTURADO al final de las constantes**

Agregar después de `PROMPT_EXTRACCION`:

```python
PROMPT_RESUMEN_ESTRUCTURADO = """Eres un asistente legal especializado en derecho peruano.
Analiza el documento adjunto y extrae ÚNICAMENTE información que aparezca de forma EXPLÍCITA.
NO inventes, NO asumas, NO infieras lo que no está escrito.

Devuelve ÚNICAMENTE un objeto JSON válido con esta estructura exacta (omite campos null):
{
  "tipo_documento": "denuncia_penal|demanda_civil|resolucion|oficio|contrato|audiencia|otro",
  "partes": {
    "demandante_denunciante": "nombre completo o null",
    "demandado_denunciado": "nombre completo o null",
    "fiscal": "nombre o null",
    "juez": "nombre o null"
  },
  "hechos_clave": "resumen de los hechos principales en 2 a 3 párrafos concisos",
  "pretension": "qué se reclama o solicita (1 oración)",
  "fundamentos_juridicos": ["art. X del CP", "..."],
  "pruebas_evidencia": ["prueba 1", "prueba 2"],
  "fechas_importantes": [{"fecha": "YYYY-MM-DD o texto si no hay formato claro", "descripcion": "..."}],
  "montos": [{"monto": "S/ X", "concepto": "..."}],
  "resolucion_fallo": "resolución o fallo si existe, o null",
  "expediente": "número exacto si existe, o null"
}

Reglas:
1. Solo extrae lo explícitamente escrito. Si un campo no está, omítelo del JSON.
2. hechos_clave: incluye quién, qué, cuándo, dónde, cómo. Máximo 300 palabras.
3. Si el documento es muy corto o ilegible, devuelve {"tipo_documento": "otro", "hechos_clave": "Documento sin contenido procesable"}.
4. Sin texto adicional, sin markdown, sin bloques de código. Solo el JSON.
"""
```

- [ ] **Step 3.2: Agregar la función extraer_resumen_estructurado**

Agregar al final del archivo `document_extractor.py`:

```python
def extraer_resumen_estructurado(
    contenido_bytes: bytes,
    nombre_archivo: str,
    content_type: str,
) -> tuple[dict, str]:
    """
    Extrae un resumen estructurado del documento usando Claude.
    Retorna (resumen_dict, texto_relevante_str).
    
    - resumen_dict: JSON con partes, hechos, pruebas, fechas, etc.
    - texto_relevante_str: concatenación de los campos más relevantes como texto plano
                           para búsqueda BM25 posterior.
    """
    import json as _json

    ext = nombre_archivo.lower().rsplit(".", 1)[-1] if "." in nombre_archivo else ""

    # Preparar contenido según tipo de archivo
    if ext == "docx":
        texto = _leer_docx_como_texto(contenido_bytes)
        content_for_claude = [
            {
                "type": "text",
                "text": f"Documento legal (DOCX convertido a texto):\n\n{texto[:12000]}",
            }
        ]
    elif content_type.startswith("image/") or ext in ("jpg", "jpeg", "png"):
        b64 = base64.standard_b64encode(contenido_bytes).decode("utf-8")
        content_for_claude = [
            {
                "type": "image",
                "source": {"type": "base64", "media_type": content_type, "data": b64},
            },
            {"type": "text", "text": "Analiza este documento legal."},
        ]
    else:
        # PDF: enviar como base64
        b64 = base64.standard_b64encode(contenido_bytes).decode("utf-8")
        content_for_claude = [
            {
                "type": "document",
                "source": {"type": "base64", "media_type": "application/pdf", "data": b64},
            },
            {"type": "text", "text": "Analiza este documento legal."},
        ]

    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",  # Haiku: rápido y barato para extracción
            max_tokens=1500,
            system=PROMPT_RESUMEN_ESTRUCTURADO,
            messages=[{"role": "user", "content": content_for_claude}],
        )
        raw = response.content[0].text.strip()
        # Limpiar posible markdown
        if raw.startswith("```"):
            raw = re.sub(r"^```[a-z]*\n?", "", raw)
            raw = re.sub(r"\n?```$", "", raw)
        resumen = _json.loads(raw)
    except Exception as e:
        print(f"[Extracción estructurada] ⚠️ Error: {e}")
        resumen = {"tipo_documento": "otro", "hechos_clave": "No se pudo procesar el documento."}

    # Construir texto_relevante para BM25 (solo campos textuales importantes)
    partes = resumen.get("partes", {})
    partes_str = " ".join(v for v in partes.values() if v)
    pruebas = " ".join(resumen.get("pruebas_evidencia", []))
    fundamentos = " ".join(resumen.get("fundamentos_juridicos", []))
    fechas = " ".join(
        f"{f.get('fecha', '')} {f.get('descripcion', '')}"
        for f in resumen.get("fechas_importantes", [])
    )
    texto_relevante = "\n".join(filter(None, [
        resumen.get("hechos_clave", ""),
        resumen.get("pretension", ""),
        partes_str,
        pruebas,
        fundamentos,
        fechas,
        resumen.get("resolucion_fallo", "") or "",
    ]))

    return resumen, texto_relevante
```

- [ ] **Step 3.3: Verificar función con un archivo de prueba**

```bash
cd C:\Users\danie\Downloads\minka-legal
python -c "
import os
os.environ['ANTHROPIC_API_KEY'] = open('.env').read().split('ANTHROPIC_API_KEY=')[1].split()[0]
from agent.document_extractor import extraer_resumen_estructurado
# Usar un PDF de prueba pequeño
with open('tests/sample.pdf', 'rb') as f:
    contenido = f.read()
resumen, texto = extraer_resumen_estructurado(contenido, 'sample.pdf', 'application/pdf')
print('Tipo:', resumen.get('tipo_documento'))
print('Texto relevante (primeros 200 chars):', texto[:200])
" 2>/dev/null || echo "Sin archivo de prueba — verificar manualmente al integrar"
```

- [ ] **Step 3.4: Commit**

```bash
git add agent/document_extractor.py
git commit -m "feat: extraer_resumen_estructurado — extracción inteligente con Claude Haiku"
```

---

## Task 4: Backend — Endpoints multi-doc + chat actualizado en dashboard_api.py

**Files:**
- Modify: `C:\Users\danie\Downloads\minka-legal\agent\dashboard_api.py`

- [ ] **Step 4.1: Agregar imports nuevos al bloque de imports del archivo**

Al inicio de `dashboard_api.py`, agregar dentro de los imports existentes:

```python
import json
import gzip
from agent.crypto import compress_encrypt, decrypt_decompress
from agent.cases_db import (
    listar_casos, obtener_caso, crear_caso, actualizar_caso, eliminar_caso,
    crear_documento_caso, listar_documentos_caso,
    obtener_documento_caso, eliminar_documento_caso,
)
```

(Reemplazar el bloque de imports de `agent.cases_db` actual con este nuevo que incluye las funciones de documentos.)

- [ ] **Step 4.2: Agregar helper _obtener_contexto_documentos antes del endpoint /chat**

Insertar antes de la función `api_chat_caso`:

```python
def _chunk_text(text: str, chunk_size: int = 300, overlap: int = 30) -> list[str]:
    """Divide texto en chunks de chunk_size palabras con overlap."""
    words = text.split()
    if len(words) <= chunk_size:
        return [text]
    chunks = []
    step = chunk_size - overlap
    for i in range(0, len(words), step):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
        if i + chunk_size >= len(words):
            break
    return chunks


def _bm25_search(corpus: list[str], query: str, top_k: int = 3) -> list[str]:
    """BM25 sobre una lista de textos. Retorna los top_k más relevantes."""
    from rank_bm25 import BM25Okapi
    if not corpus or not query:
        return corpus[:top_k]
    tokenized = [doc.lower().split() for doc in corpus]
    bm25 = BM25Okapi(tokenized)
    scores = bm25.get_scores(query.lower().split())
    ranked = sorted(range(len(corpus)), key=lambda i: scores[i], reverse=True)
    return [corpus[i] for i in ranked[:top_k] if scores[i] > 0]


def _obtener_contexto_documentos(caso_id: int, pregunta: str) -> str:
    """
    Construye el contexto de documentos para el chat:
    - Resúmenes estructurados de todos los docs (siempre incluidos, compactos)
    - Fragmentos BM25-relevantes del texto de los docs (según la pregunta)
    Límite total: ~8000 palabras.
    """
    documentos = listar_documentos_caso(caso_id)
    if not documentos:
        return ""

    summaries = []
    all_chunks = []

    for doc in documentos:
        nombre = doc.get("nombre", "documento")

        # Resumen estructurado
        if doc.get("resumen_json"):
            try:
                resumen = json.loads(decrypt_decompress(doc["resumen_json"]))
                tipo = resumen.get("tipo_documento", "")
                hechos = resumen.get("hechos_clave", "")
                pretension = resumen.get("pretension", "")
                partes = resumen.get("partes", {})
                partes_str = ", ".join(f"{k}: {v}" for k, v in partes.items() if v)
                pruebas = "; ".join(resumen.get("pruebas_evidencia", [])[:5])
                fechas = "; ".join(
                    f"{f.get('fecha')} ({f.get('descripcion')})"
                    for f in resumen.get("fechas_importantes", [])[:3]
                )
                resolucion = resumen.get("resolucion_fallo") or ""
                summary_lines = [f"[{nombre}] Tipo: {tipo}"]
                if partes_str:
                    summary_lines.append(f"Partes: {partes_str}")
                if hechos:
                    summary_lines.append(f"Hechos: {hechos[:500]}")
                if pretension:
                    summary_lines.append(f"Pretensión: {pretension}")
                if pruebas:
                    summary_lines.append(f"Pruebas: {pruebas}")
                if fechas:
                    summary_lines.append(f"Fechas: {fechas}")
                if resolucion:
                    summary_lines.append(f"Resolución: {resolucion[:300]}")
                summaries.append("\n".join(summary_lines))
            except Exception:
                summaries.append(f"[{nombre}]: documento adjunto")

        # Texto para BM25
        if doc.get("texto_relevante"):
            try:
                texto = decrypt_decompress(doc["texto_relevante"])
                chunks = _chunk_text(texto, chunk_size=250, overlap=25)
                all_chunks.extend(chunks)
            except Exception:
                pass

    # BM25 sobre chunks
    relevant_chunks = _bm25_search(all_chunks, pregunta, top_k=4) if all_chunks else []

    parts = []
    if summaries:
        parts.append("DOCUMENTOS DEL CASO:\n" + "\n\n".join(summaries))
    if relevant_chunks:
        parts.append("FRAGMENTOS RELEVANTES DE DOCUMENTOS:\n" + "\n---\n".join(relevant_chunks))

    return "\n\n".join(parts)
```

- [ ] **Step 4.3: Actualizar el endpoint /chat para usar multi-doc + prompt caching**

Reemplazar el bloque `# 4. Texto del documento...` y `# 6. System prompt final` y `# 7. Llamar a Claude` con el siguiente código:

```python
    # 4. Contexto de documentos (multi-doc con BM25)
    bloque_doc = _obtener_contexto_documentos(caso_id, pregunta)
    
    # Backward compat: si no hay docs nuevos pero hay documento_texto legacy
    if not bloque_doc:
        doc_texto = (caso.get("documento_texto") or "").strip()
        if doc_texto:
            truncado = doc_texto[:6000]
            if len(doc_texto) > 6000:
                truncado += "\n[... documento truncado ...]"
            bloque_doc = f"DOCUMENTO DEL CASO (texto extraído):\n{truncado}"

    # 5. Bloque de consejo procesal (sin cambios)
    bloque_consejo = ""
    if consejo.get("tiene_consejo"):
        bloque_consejo = f"""
ESTADO PROCESAL ACTUAL:
- Proceso: {consejo.get('tipo_proceso', '')}
- Etapa actual: {consejo.get('etapa_actual', '')}
- Siguiente etapa: {consejo.get('siguiente_etapa', '')}
- Descripción: {consejo.get('siguiente_descripcion', '')}
- Plazo legal: {consejo.get('plazo_descripcion', '')}
- Fecha límite sugerida: {consejo.get('proxima_fecha_sugerida', 'No calculada')}
- Documentos a preparar: {', '.join(consejo.get('documentos_requeridos', [])) or 'No especificados'}
- Norma aplicable: {consejo.get('norma', '')}"""
        if consejo.get("advertencia"):
            bloque_consejo += f"\n- ADVERTENCIA: {consejo['advertencia']}"

    # 6. System prompt en dos partes para prompt caching
    static_system = """Eres Minka, asistente de IA para abogados peruanos. Tu función es responder preguntas del abogado sobre su caso de forma precisa, práctica y fundamentada en el derecho peruano.

Instrucciones de formato (MUY IMPORTANTE):
- Responde en texto plano, sin markdown de ningún tipo
- Prohibido usar #, ##, **, *, --, ---, |, >, emojis ni símbolos decorativos
- Usa párrafos separados por línea en blanco para organizar la respuesta
- Si necesitas enumerar, usa números simples: 1. 2. 3.
- Sé conciso y directo, sin introducciones largas ni resúmenes al final
- Cita artículos legales en texto plano: "Art. 196 del CP" o "Art. 334 del CPP"
- Si hay advertencia de plazo vencido, mencionarla al inicio
- No inventes información que no esté en el contexto"""

    dynamic_context = f"""{ctx_caso}
{bloque_consejo}
{bloque_doc}
{bloque_normativa}"""

    # 7. Llamar a Claude con prompt caching en el contexto del caso
    anthropic_client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    try:
        response = await anthropic_client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            system=[
                {"type": "text", "text": static_system},
                {
                    "type": "text",
                    "text": dynamic_context,
                    "cache_control": {"type": "ephemeral"},
                },
            ],
            messages=[{"role": "user", "content": pregunta}],
        )
        respuesta = response.content[0].text
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al consultar IA: {str(e)}")

    return {"respuesta": respuesta}
```

- [ ] **Step 4.4: Agregar los 4 nuevos endpoints de documentos**

Insertar DESPUÉS del bloque de `# Endpoints — Almacenamiento de documentos (R2)` existente (después de `api_eliminar_documento`) y ANTES de `# Endpoint — Extracción de documento con Claude`:

```python
# ─────────────────────────────────────────────
# Endpoints — Multi-documentos por caso
# ─────────────────────────────────────────────

@router.get("/api/casos/{caso_id}/documentos")
def api_listar_documentos(caso_id: int, request: Request, user=Depends(require_auth)):
    """Lista todos los documentos subidos para un caso (sin texto, solo metadata)."""
    caso = obtener_caso(caso_id)
    if not caso:
        raise HTTPException(status_code=404, detail="Caso no encontrado")
    docs = listar_documentos_caso(caso_id)
    # No exponer resumen_json ni texto_relevante en el listado
    return [
        {
            "id": d["id"],
            "caso_id": d["caso_id"],
            "nombre": d["nombre"],
            "tipo_archivo": d["tipo_archivo"],
            "fecha_subida": d["fecha_subida"],
        }
        for d in docs
    ]


@router.post("/api/casos/{caso_id}/documentos")
async def api_subir_documento_caso(
    caso_id: int,
    archivo: UploadFile = File(...),
    request: Request = None,
    user=Depends(require_auth),
):
    """
    Sube un documento al caso:
    1. Sube el archivo original a R2
    2. Extrae resumen estructurado con Claude Haiku
    3. Comprime + cifra el resumen y texto relevante
    4. Guarda metadata en caso_documentos
    """
    if not r2_configured():
        raise HTTPException(status_code=503, detail="El almacenamiento de documentos no está configurado.")

    caso = obtener_caso(caso_id)
    if not caso:
        raise HTTPException(status_code=404, detail="Caso no encontrado")

    MAX_MB = 10
    contenido = await archivo.read()
    if len(contenido) > MAX_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"El archivo supera los {MAX_MB}MB permitidos.")

    ext = (archivo.filename or "").lower().rsplit(".", 1)[-1]
    if ext not in ("pdf", "doc", "docx"):
        raise HTTPException(status_code=415, detail="Solo se aceptan archivos PDF y DOCX.")

    content_type = archivo.content_type or "application/octet-stream"
    nombre = archivo.filename or f"documento.{ext}"

    # 1. Subir a R2
    try:
        key = upload_document(contenido, nombre, content_type, caso_id)
    except Exception as e:
        print(f"[Multi-doc] ❌ Error R2: {e}")
        raise HTTPException(status_code=500, detail="No se pudo subir el archivo.")

    # 2. Extracción inteligente con Claude Haiku
    from agent.document_extractor import extraer_resumen_estructurado
    try:
        resumen_dict, texto_relevante_str = extraer_resumen_estructurado(
            contenido, nombre, content_type
        )
        resumen_json_enc = compress_encrypt(json.dumps(resumen_dict, ensure_ascii=False))
        texto_enc = compress_encrypt(texto_relevante_str) if texto_relevante_str else ""
    except Exception as e:
        print(f"[Multi-doc] ⚠️ Error extracción: {e}")
        resumen_json_enc = ""
        texto_enc = ""

    # 3. Guardar en BD
    doc = crear_documento_caso(
        caso_id=caso_id,
        nombre=nombre,
        tipo_archivo=content_type,
        key_r2=key,
        resumen_json=resumen_json_enc,
        texto_relevante=texto_enc,
    )

    return {
        "id": doc["id"],
        "caso_id": doc["caso_id"],
        "nombre": doc["nombre"],
        "tipo_archivo": doc["tipo_archivo"],
        "fecha_subida": doc["fecha_subida"],
    }


@router.get("/api/casos/{caso_id}/documentos/{doc_id}")
def api_obtener_url_doc(
    caso_id: int, doc_id: int, request: Request, user=Depends(require_auth)
):
    """Genera una URL firmada temporal (1 hora) para descargar un documento específico."""
    if not r2_configured():
        raise HTTPException(status_code=503, detail="El almacenamiento no está configurado.")
    doc = obtener_documento_caso(doc_id)
    if not doc or doc["caso_id"] != caso_id:
        raise HTTPException(status_code=404, detail="Documento no encontrado.")
    try:
        url = generate_presigned_url(doc["key_r2"], expires_seconds=3600)
    except Exception as e:
        raise HTTPException(status_code=500, detail="No se pudo generar el enlace.")
    return {"url": url, "nombre": doc["nombre"], "tipo": doc["tipo_archivo"]}


@router.delete("/api/casos/{caso_id}/documentos/{doc_id}")
def api_eliminar_doc(
    caso_id: int, doc_id: int, request: Request, user=Depends(require_auth)
):
    """Elimina un documento de R2 y de la BD."""
    if not r2_configured():
        raise HTTPException(status_code=503, detail="El almacenamiento no está configurado.")
    doc = obtener_documento_caso(doc_id)
    if not doc or doc["caso_id"] != caso_id:
        raise HTTPException(status_code=404, detail="Documento no encontrado.")
    delete_document(doc["key_r2"])
    eliminar_documento_caso(doc_id)
    return {"ok": True, "id": doc_id}
```

- [ ] **Step 4.5: Reiniciar el servidor backend local y verificar endpoints**

```bash
cd C:\Users\danie\Downloads\minka-legal
uvicorn agent.main:app --reload --port 8000
```

Verificar que no hay errores de importación en la consola.

- [ ] **Step 4.6: Commit**

```bash
git add agent/dashboard_api.py
git commit -m "feat: multi-doc endpoints + chat con BM25 y prompt caching"
```

---

## Task 5: Frontend — Tipos y API

**Files:**
- Modify: `C:\Users\danie\Downloads\minka-frontend\types\index.ts`
- Modify: `C:\Users\danie\Downloads\minka-frontend\lib\api.ts`

- [ ] **Step 5.1: Agregar CaseDocument a types/index.ts**

Insertar DESPUÉS de la interfaz `Case`:

```typescript
export interface CaseDocument {
  id: number;
  caso_id: number;
  nombre: string;
  tipo_archivo: string;
  fecha_subida: string;
}
```

- [ ] **Step 5.2: Agregar caseDocumentosApi a lib/api.ts**

Insertar DESPUÉS del bloque `// DOCUMENT EXTRACTION API` existente:

```typescript
// ============================================
// MULTI-DOCUMENTOS POR CASO
// ============================================
import type { CaseDocument } from "@/types";

export const caseDocumentosApi = {
  list: async (casoId: number, token?: string): Promise<CaseDocument[]> => {
    return fetchAPI<CaseDocument[]>(`/api/casos/${casoId}/documentos`, { token });
  },

  upload: async (casoId: number, file: File, token?: string): Promise<CaseDocument> => {
    const formData = new FormData();
    formData.append("archivo", file);
    return fetchUpload<CaseDocument>(`/api/casos/${casoId}/documentos`, formData, token);
  },

  getUrl: async (
    casoId: number,
    docId: number,
    token?: string,
  ): Promise<{ url: string; nombre: string; tipo: string }> => {
    return fetchAPI(`/api/casos/${casoId}/documentos/${docId}`, { token });
  },

  delete: async (casoId: number, docId: number, token?: string): Promise<void> => {
    await fetchAPI(`/api/casos/${casoId}/documentos/${docId}`, {
      method: "DELETE",
      token,
    });
  },
};
```

Nota: quitar el `import type { CaseDocument }` de arriba — ya está exportado en el mismo archivo types/index.ts y api.ts no necesita importarlo explícitamente. El tipo se usa solo en la firma de retorno, TypeScript lo infiere.

Corrección del Step 5.2: NO agregar el import de CaseDocument dentro de api.ts (es un archivo JS/TS sin imports de ese tipo necesarios ya que fetchAPI infiere el tipo genérico). El código correcto es:

```typescript
// ============================================
// MULTI-DOCUMENTOS POR CASO
// ============================================
export const caseDocumentosApi = {
  list: async (casoId: number, token?: string) => {
    return fetchAPI<{ id: number; caso_id: number; nombre: string; tipo_archivo: string; fecha_subida: string }[]>(
      `/api/casos/${casoId}/documentos`,
      { token }
    );
  },

  upload: async (casoId: number, file: File, token?: string) => {
    const formData = new FormData();
    formData.append("archivo", file);
    return fetchUpload<{ id: number; caso_id: number; nombre: string; tipo_archivo: string; fecha_subida: string }>(
      `/api/casos/${casoId}/documentos`,
      formData,
      token
    );
  },

  getUrl: async (casoId: number, docId: number, token?: string): Promise<{ url: string; nombre: string; tipo: string }> => {
    return fetchAPI(`/api/casos/${casoId}/documentos/${docId}`, { token });
  },

  delete: async (casoId: number, docId: number, token?: string): Promise<void> => {
    await fetchAPI(`/api/casos/${casoId}/documentos/${docId}`, {
      method: "DELETE",
      token,
    });
  },
};
```

- [ ] **Step 5.3: Commit**

```bash
cd C:\Users\danie\Downloads\minka-frontend
git add types/index.ts lib/api.ts
git commit -m "feat: CaseDocument type + caseDocumentosApi"
```

---

## Task 6: Frontend — Hook use-documentos.ts

**Files:**
- Create: `C:\Users\danie\Downloads\minka-frontend\hooks\use-documentos.ts`

- [ ] **Step 6.1: Crear hooks/use-documentos.ts**

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { caseDocumentosApi } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

export function useDocumentosCaso(casoId: number) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["documentos", casoId],
    queryFn: () => caseDocumentosApi.list(casoId, token || undefined),
    enabled: casoId > 0,
  });
}

export function useUploadDocumento(casoId: number) {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => caseDocumentosApi.upload(casoId, file, token || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentos", casoId] });
    },
  });
}

export function useDeleteDocumento(casoId: number) {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (docId: number) => caseDocumentosApi.delete(casoId, docId, token || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentos", casoId] });
    },
  });
}
```

- [ ] **Step 6.2: Commit**

```bash
git add hooks/use-documentos.ts
git commit -m "feat: use-documentos hooks (list, upload, delete)"
```

---

## Task 7: Frontend — DocumentosPanel component

**Files:**
- Create: `C:\Users\danie\Downloads\minka-frontend\components\documentos-panel.tsx`

- [ ] **Step 7.1: Crear components/documentos-panel.tsx**

```tsx
"use client";

import { useRef, useCallback, useState } from "react";
import { Upload, FileText, Download, Trash2, Loader2, AlertCircle } from "lucide-react";
import { useDocumentosCaso, useUploadDocumento, useDeleteDocumento } from "@/hooks/use-documentos";
import { caseDocumentosApi } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { useToast } from "@/components/ui/use-toast";

interface DocumentosPanelProps {
  casoId: number;
}

function formatFecha(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function getFileIcon(tipo: string): string {
  if (tipo.includes("pdf")) return "PDF";
  if (tipo.includes("word") || tipo.includes("docx") || tipo.includes("doc")) return "DOC";
  return "DOC";
}

export function DocumentosPanel({ casoId }: DocumentosPanelProps) {
  const { data: documentos, isLoading } = useDocumentosCaso(casoId);
  const uploadDoc = useUploadDocumento(casoId);
  const deleteDoc = useDeleteDocumento(casoId);
  const token = useAuthStore((s) => s.token);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!ext || !["pdf", "doc", "docx"].includes(ext)) {
        toast({ title: "Formato no soportado", description: "Solo se aceptan PDF y DOCX.", variant: "destructive" });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "Archivo muy grande", description: "El archivo no debe superar 10MB.", variant: "destructive" });
        return;
      }
      try {
        await uploadDoc.mutateAsync(file);
        toast({ title: "Documento subido", description: `${file.name} procesado y guardado.` });
      } catch {
        toast({ title: "Error", description: "No se pudo subir el documento.", variant: "destructive" });
      }
    },
    [uploadDoc, toast]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDownload = async (docId: number, nombre: string) => {
    setDownloadingId(docId);
    try {
      const { url } = await caseDocumentosApi.getUrl(casoId, docId, token || undefined);
      const a = document.createElement("a");
      a.href = url;
      a.download = nombre;
      a.target = "_blank";
      a.click();
    } catch {
      toast({ title: "Error", description: "No se pudo obtener el enlace de descarga.", variant: "destructive" });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (docId: number, nombre: string) => {
    if (!confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteDoc.mutateAsync(docId);
      toast({ title: "Documento eliminado", description: nombre });
    } catch {
      toast({ title: "Error", description: "No se pudo eliminar el documento.", variant: "destructive" });
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-minka-500" />
          <h2 className="text-lg font-semibold text-gray-900">Documentos del caso</h2>
          {documentos && documentos.length > 0 && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {documentos.length}
            </span>
          )}
        </div>
      </div>

      {/* Zona de upload */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => !uploadDoc.isPending && fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-4 text-center cursor-pointer mb-4
          transition-colors duration-200
          ${uploadDoc.isPending ? "opacity-50 cursor-not-allowed" : ""}
          ${isDragging
            ? "border-minka-500 bg-minka-50"
            : "border-gray-200 hover:border-minka-400 hover:bg-gray-50"
          }
        `}
      >
        {uploadDoc.isPending ? (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Procesando con IA...
          </div>
        ) : (
          <>
            <Upload className="w-5 h-5 mx-auto mb-1 text-gray-400" />
            <p className="text-sm text-gray-500">
              <span className="font-medium text-minka-600">Agregar documento</span>
              {" "}o arrastra aquí
            </p>
            <p className="text-xs text-gray-400 mt-0.5">PDF, DOCX · máx. 10MB</p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
        />
      </div>

      {/* Lista de documentos */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : !documentos || documentos.length === 0 ? (
        <div className="text-center py-4 text-sm text-gray-400">
          <AlertCircle className="w-5 h-5 mx-auto mb-1 text-gray-300" />
          Sin documentos adjuntos
        </div>
      ) : (
        <div className="space-y-2">
          {documentos.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-bold text-minka-600 bg-minka-50 px-1.5 py-0.5 rounded flex-shrink-0">
                  {getFileIcon(doc.tipo_archivo)}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{doc.nombre}</p>
                  <p className="text-xs text-gray-400">{formatFecha(doc.fecha_subida)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                <button
                  onClick={() => handleDownload(doc.id, doc.nombre)}
                  disabled={downloadingId === doc.id}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                  title="Descargar"
                >
                  {downloadingId === doc.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Download className="w-4 h-4" />
                  }
                </button>
                <button
                  onClick={() => handleDelete(doc.id, doc.nombre)}
                  disabled={deleteDoc.isPending}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 7.2: Commit**

```bash
git add components/documentos-panel.tsx hooks/use-documentos.ts
git commit -m "feat: DocumentosPanel — lista, upload, download, delete con BM25 context"
```

---

## Task 8: Frontend — Integrar DocumentosPanel en la página de detalle

**Files:**
- Modify: `C:\Users\danie\Downloads\minka-frontend\app\dashboard\casos\[id]\page.tsx`

- [ ] **Step 8.1: Agregar import del panel**

Al inicio del archivo `app/dashboard/casos/[id]/page.tsx`, agregar junto a los imports existentes:

```typescript
import { DocumentosPanel } from "@/components/documentos-panel";
```

- [ ] **Step 8.2: Reemplazar el bloque "Documento almacenado" por DocumentosPanel**

Encontrar el bloque existente (aproximadamente líneas 200-225):

```tsx
          {/* Documento almacenado */}
          {caso.documento_url && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              ...
            </div>
          )}
```

Reemplazarlo con:

```tsx
          {/* Documentos del caso (multi-doc) */}
          <DocumentosPanel casoId={caso.id} />
```

- [ ] **Step 8.3: Eliminar el estado y función de descarga legacy que ya no se usan**

Eliminar estas líneas del componente (ya no son necesarias):
```typescript
  const [downloadingDoc, setDownloadingDoc] = useState(false);
```
```typescript
  const handleDownloadDocument = async () => { ... };
```
Y el import de `Download` de lucide-react si ya no se usa en otro lugar (verificar si hay más usos antes de eliminar).

- [ ] **Step 8.4: Verificar en el navegador**

Abrir `http://localhost:3000/dashboard/casos` → entrar a cualquier caso → verificar que aparece el panel "Documentos del caso" con zona de upload.

Subir un PDF o DOCX de prueba y verificar:
1. Aparece "Procesando con IA..." mientras Claude extrae
2. El documento aparece en la lista con nombre y fecha
3. El botón de descarga genera un link
4. El botón de eliminar remueve el doc de la lista

- [ ] **Step 8.5: Commit final**

```bash
cd C:\Users\danie\Downloads\minka-frontend
git add app/dashboard/casos/[id]/page.tsx components/documentos-panel.tsx hooks/use-documentos.ts types/index.ts lib/api.ts
git commit -m "feat: multi-documentos por caso — upload, extracción IA, BM25, prompt caching"
```

---

## Task 9: Deploy

- [ ] **Step 9.1: Push backend a Railway**

```bash
cd C:\Users\danie\Downloads\minka-legal
git push origin main
```

Verificar en Railway que el redeploy termina sin errores.

- [ ] **Step 9.2: Push frontend a Vercel**

```bash
cd C:\Users\danie\Downloads\minka-frontend
git push origin main
```

Verificar en `https://minka-front.vercel.app` que el panel de documentos aparece correctamente.

- [ ] **Step 9.3: Agregar DOCUMENT_ENCRYPTION_KEY a Railway**

En Railway → Variables del servicio backend → agregar:
```
DOCUMENT_ENCRYPTION_KEY=<la clave generada en Task 1>
```

Railway redespliega automáticamente.

- [ ] **Step 9.4: Prueba end-to-end en producción**

1. Ir a `https://minka-front.vercel.app/dashboard/casos`
2. Entrar a un caso
3. Subir un documento real (denuncia, demanda o resolución)
4. Verificar que aparece en la lista
5. Ir al chat del caso y hacer una pregunta relacionada con el documento subido
6. Verificar que la respuesta refleja el contenido del documento

---

## Resumen de cambios por repositorio

### Backend (minka-legal) — 4 commits
1. `crypto.py` + requirements
2. `cases_db.py` — tabla caso_documentos
3. `document_extractor.py` — extracción estructurada
4. `dashboard_api.py` — endpoints + chat actualizado

### Frontend (minka-frontend) — 3 commits
1. `types/index.ts` + `lib/api.ts`
2. `hooks/use-documentos.ts` + `components/documentos-panel.tsx`
3. `app/dashboard/casos/[id]/page.tsx`
