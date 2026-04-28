# CLAUDE.md — Instrucciones para Claude Code

## Proyecto: Minka Frontend

Minka es un asistente de IA para abogados peruanos que mantiene informados a sus clientes sobre el estado de sus casos legales 24/7 por WhatsApp.

Este repo es el **frontend** (Next.js 14 App Router, TypeScript) que se conecta a un backend FastAPI multi-tenant en Railway.

---

## Estado actual (Abril 2026)

El proyecto ya tiene base lista para **prueba con primer abogado real** (multi-tenant, Whapi por abogado, plenos casatorios indexados, registro/login + protección de datos en backend, dashboard de Aprendizaje IA para admin).

Se acaba de completar una sesión grande de bug-fixes UX/seguridad. Lo más relevante:

- **Multi-tenancy reforzada** en backend (`fbe5e63` en `minka-legal`) y frontend (`65bc04c`): `GET /api/abogados` y `/api/estudios` ahora filtran por email del JWT; helper `_require_abogado_owner` valida ownership en mutaciones; frontend ya no muestra fallbacks hardcodeados en Configuración.
- **DateInputPE** (`28c0226`) — componente custom dd/mm/aaaa que reemplaza el `<input type="date">` nativo (Chrome ignora `lang` para el formato de display, así que requiere text input con conversión a/desde ISO).
- **Quick-edit en detalle de caso** (`899e571`, `20af826`) — pill de estado y campo de próxima fecha editables inline desde el header (sin abrir modal Editar). Pestaña Documentos separada.
- **TZ fix** (`20af826`) — `parseDate` ahora trata timestamps del backend (SQLite UTC sin sufijo) como UTC. Antes mostraba "actualizado en alrededor de 5 horas" por el offset Lima.
- **Parser de docs** (`85a9f6a`) — añadidos roles RECURRENTE/SOLICITANTE/IMPUGNANTE/ACCIONANTE/ACTOR/USUARIO para que extraiga el cliente de recursos administrativos y acciones constitucionales.
- **Tours por sesión de usuario** (`06ac562`) — `clearTourFlags()` en logout/register para que cuentas nuevas vean los tours fresh, sin heredar flags del navegador.

Ver `~/.claude/projects/.../memory/project_pending_plan.md` para el roadmap completo de pendientes.

---

## Arquitectura

```
minka-frontend/                     # Next.js 14 (App Router)
├── app/
│   ├── layout.tsx                  # Root layout (lang="es-PE")
│   ├── page.tsx                    # Landing → redirect /dashboard
│   ├── providers.tsx               # React Query
│   ├── globals.css                 # Tailwind + CSS vars
│   ├── login/page.tsx              # Login
│   ├── registro/page.tsx           # Signup (rate-limited en backend)
│   └── dashboard/
│       ├── layout.tsx              # Auth guard + sidebar
│       ├── page.tsx                # Inicio: stats + actividad
│       ├── casos/
│       │   ├── page.tsx            # Lista CRUD (filas clickeables, multi-upload con progress UI)
│       │   └── [id]/page.tsx       # Detalle: tabs (Detalle/Documentos/Agente Legal),
│       │                             status pill + próxima fecha editables inline
│       ├── calendario/page.tsx
│       ├── clientes/page.tsx
│       ├── reportes/page.tsx       # Charts + exportar PDF
│       ├── configuracion/page.tsx  # Perfil + estudio + Whapi
│       ├── notificaciones/page.tsx
│       ├── calculadora/page.tsx    # Plazos legales (días hábiles + feriados)
│       └── aprendizaje/page.tsx    # Solo admin: feedback loop / correcciones IA
├── components/
│   ├── case-form.tsx               # Form con multi-upload .docx/.pdf/.imagen
│   ├── case-card.tsx               # Mobile card
│   ├── filter-bar.tsx              # Filtros con DateInputPE
│   ├── date-input-pe.tsx           # ★ Custom dd/mm/aaaa input (reemplaza native)
│   ├── documentos-panel.tsx        # Panel multi-doc + descarga firmada R2
│   ├── legal-agent-panel.tsx       # 4 acciones IA (analizar/redactar/normativa/asesoría)
│   ├── caso-chat-panel.tsx         # Chat IA por caso
│   ├── normativa-panel.tsx         # Citas legales
│   ├── onboarding-tour.tsx         # Tour guiado por sección
│   └── ui/                         # Toast (Radix)
├── hooks/
│   ├── use-cases.ts                # React Query CRUD
│   ├── use-documentos.ts           # Multi-doc por caso
│   ├── use-sort.ts / use-pagination.ts / use-debounce.ts
├── lib/
│   ├── api.ts                      # Cliente FastAPI
│   ├── auth-store.ts               # Zustand persist + clearTourFlags()
│   ├── document-parser.ts          # Mammoth.js client-side .docx → datos
│   └── utils.ts                    # parseDate (UTC-aware), formatDate, getDateUrgencyClass
└── types/index.ts                  # Tipos + STATUS_LABELS / CASE_TYPE_LABELS / colors
```

---

## Conexión con Backend

```env
NEXT_PUBLIC_API_URL=https://katia-jorkat-production.up.railway.app
```

**Endpoints clave**:

| Verbo | Path | Notas |
|-------|------|-------|
| POST  | `/auth/login` `/auth/register` `/auth/logout` `/auth/verificar` `/auth/refresh` | JWT con refresh sliding |
| GET   | `/api/casos` | Filtrado por abogado del JWT |
| POST/PUT/DELETE | `/api/casos[/{id}]` | IDOR-safe vía `require_caso_access` |
| POST  | `/api/casos/{id}/notificar` | WhatsApp via Whapi |
| GET   | `/api/casos/{id}/documentos` `/api/casos/{id}/documentos/{doc_id}/url` | Multi-doc + R2 signed URL |
| POST  | `/api/casos/{id}/documentos` | Upload encriptado (Fernet) → R2 |
| GET/POST/PUT/DELETE | `/api/abogados[/{id}]` | ★ Filtrado por email del JWT (multi-tenant) |
| POST  | `/api/abogados/{id}/whapi[/verificar/refresh]` | Config Whapi por abogado |
| GET/POST/PUT | `/api/estudios[/{id}]` | Filtrado por email del JWT |
| POST  | `/api/calcular-plazo` `/api/feriados` | Calculadora |
| GET   | `/api/agente/{caso_id}` `/api/agente/run` | LegalAgentPanel |

---

## Stack

| Tech | Uso |
|------|-----|
| Next.js 14.2.x | **NO** subir a 15+ — pinned |
| TypeScript 5.4 | Strict mode |
| Tailwind 3.4 | Patrón shadcn/ui CSS vars |
| Zustand 4.5 | auth-store, notification-store (persist) |
| @tanstack/react-query 5.40 | Data fetching + cache |
| react-hook-form 7.51 + zod 3.23 | Forms |
| mammoth 1.x | Parseo .docx client-side |
| Radix UI | Toast, dialog primitives |
| Lucide React | Iconos |
| recharts 3.8 | Reportes |
| date-fns 3.6 + locale es | Fechas |
| html2canvas + jsPDF | Export PDF |
| Vitest + Testing Library | Tests |

---

## Convenciones / gotchas importantes

### Multi-tenancy
- **Nunca** mostrar fallbacks hardcodeados con datos placeholder ("Daniel", "SimplifAI Legal", etc.) — terminó causando un data leak en Configuración.
- Si añades un nuevo endpoint que devuelva listas, el backend DEBE filtrar por `user.email` (rol abogado) o devolver todo (rol admin).
- En frontend, cuando cargues lista filtrada por usuario y la cuenta no tiene registro aún, pre-llenar campos del JWT (nombre/email), no de strings literales.

### Fechas
- **Siempre** usar `<DateInputPE>` (`components/date-input-pe.tsx`) en lugar de `<input type="date">`. El nativo de Chrome muestra mm/dd/yyyy en SO en inglés ignorando `lang="es-PE"`. El `lang` queda en `<html>` por temas de accesibilidad pero NO controla el formato del date input.
- API interna sigue siendo ISO `yyyy-mm-dd` — el componente convierte a/desde dd/mm/aaaa.
- Backend devuelve timestamps UTC sin sufijo (SQLite `CURRENT_TIMESTAMP`). `parseDate` les añade `Z` para que `parseISO` los lea como UTC. Fechas date-only (`yyyy-mm-dd` sin tiempo) se dejan parsear como medianoche local — no rompas esto o `proxima_fecha` se mostrará 1 día atrás en Lima.

### Tours
- Las claves localStorage de tours (`minka_tour_*` y `minka_onboarding_done`) son **por device, no por cuenta**. `clearTourFlags()` se llama en `register` y `logout`, NO en `login` (que vuelvas a tu propia cuenta no debería resetearte).

### Modal de caso
- Header debe ser `sticky top-0 bg-white z-10` — sin esto el header se va al hacer scroll en formularios largos y aparece el "bloque blanco".
- Ancho `max-w-2xl` (no `lg`) para que el textarea de "Documentos pendientes" tenga espacio.
- Al subir múltiples archivos, mostrar progress UI dentro del modal (`uploadStatus.phase` = `creating` | `uploading`); bloquear cierre durante upload (X/overlay/Esc).
- Token Whapi puede expirar a mitad del loop de uploads — leer `useAuthStore.getState().token` cada iteración.

### Documentos pendientes (display)
- El backend a veces devuelve el texto con marcadores numerados ("2.- ", "3.- ") pegados sin saltos de línea. Usar `formatDocumentosPendientes` (en `app/dashboard/casos/[id]/page.tsx`) que inserta `\n` antes sin romper años (`\d{4}` lookbehind dual-regex).

### Casos peruanos
- Roles del actor en docs legales: DENUNCIANTE/AGRAVIADO (penal), DEMANDANTE/ACTOR (civil/familia/contencioso), RECURRENTE/IMPUGNANTE (administrativo), SOLICITANTE (no contencioso), ACCIONANTE (constitucional), USUARIO (INDECOPI/OSIPTEL). Todos están en `lib/document-parser.ts:clientPatterns`.
- Estados: `nuevo | en_tramite | en_audiencia | pendiente_documento | en_revision | en_apelacion | resuelto | archivado`
- Tipos: ver `types/index.ts:CASE_TYPE_LABELS` (24 categorías cubriendo penal/civil/familia/laboral/admin/constitucional/comercial/sucesiones/inmobiliario/tributario)

---

## Comandos

```bash
npm run dev       # localhost:3000
npm run build
npm run lint
npx vitest        # tests
npx tsc --noEmit  # type-check sin emitir
```

---

## Deploy

- **Frontend**: Vercel (`minka-front.vercel.app`) — auto-deploy en push a `main`
- **Backend**: Railway con volumen `/app/data` (5GB EU-West) para SQLite persistente. Var `DATABASE_PATH=/app/data/agentkit.db`.
- **Backend repo**: `github.com/odiseo159-beep/MINKA-legal` (local: `C:\Users\danie\Downloads\minka-legal`).

---

## Referencias

- Memory: `~/.claude/projects/C--Users-danie-Downloads-minka-frontend/memory/`
  - `MEMORY.md` — índice
  - `project_minka_status.md` — fase actual
  - `project_pending_plan.md` — roadmap detallado P0/P1/P2/P3
  - `security_findings_2026_04.md` — auditoría
- Knowledge vault: `C:/Users/danie/knowledge-vault/` (cross-project graph)
