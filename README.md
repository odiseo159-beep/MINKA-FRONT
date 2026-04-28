# Minka Frontend — Next.js 14

Frontend del dashboard de Minka, asistente legal AI para abogados peruanos por WhatsApp.

> El abogado actualiza el caso. Minka avisa al cliente. 24/7, en su WhatsApp, en español.

## Stack

- **Framework**: Next.js 14.2 (App Router) — pinned, no subir a 15+
- **Lenguaje**: TypeScript 5.4
- **Styling**: Tailwind CSS 3.4
- **State**: Zustand (auth, notifications) + TanStack Query (server state)
- **Forms**: React Hook Form + Zod
- **UI**: Radix primitives + Lucide icons
- **Charts**: recharts
- **Tests**: Vitest + React Testing Library
- **Backend**: FastAPI (Railway) — repo `minka-legal`

## Instalación

```bash
npm install
cp .env.example .env.local
# Editar NEXT_PUBLIC_API_URL
npm run dev
```

[http://localhost:3000](http://localhost:3000)

## Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | URL del backend FastAPI | `https://katia-jorkat-production.up.railway.app` |

## Comandos

```bash
npm run dev        # Desarrollo (localhost:3000)
npm run build      # Build de producción
npm run lint       # ESLint
npx tsc --noEmit   # Type-check
npx vitest         # Tests unitarios
```

## Funcionalidades

### Autenticación
- Login + registro con rate limiting backend
- JWT con refresh sliding
- Auth guard en `/dashboard/*`
- Multi-tenant: cada abogado ve sólo sus casos / clientes / configuración

### Casos
- CRUD completo con vista responsive (tabla desktop, cards móvil)
- Multi-upload de documentos (.docx/.pdf/.imagen) con progress UI
- Detalle por pestañas: Detalle / Documentos / Agente Legal IA
- Quick-edit de estado y próxima fecha desde el header (sin abrir modal)
- Notificación al cliente por WhatsApp (mensaje con nombre del abogado)
- Filtros avanzados, ordenamiento por columna, paginación

### Agente Legal IA (por caso)
4 acciones que invocan el backend con contexto del caso + documentos:
- **Analizar caso** — síntesis estructurada + riesgos
- **Redactar escrito** — sub-form para tipo de escrito
- **Buscar normativa** — corpus indexado (LPAG, plenos casatorios, TC, etc.)
- **Asesoría procesal** — siguiente etapa, plazo legal, documentos a preparar

### Documentos
- Parseo .docx 100% client-side con mammoth.js (no se envía al servidor)
- Imágenes y PDF → backend con Claude Vision para extracción
- Storage en Cloudflare R2 con encriptación Fernet
- Descarga via URL firmada temporal

### Calendario
Vista mensual / semanal / diaria con eventos de los casos.

### Calculadora de plazos legales
Suma días hábiles considerando feriados peruanos. Configurable: hábiles, calendarios, naturales.

### Reportes
Charts de casos por estado, tipo, evolución mensual. Export a PDF.

### Configuración
- Perfil del abogado y datos del estudio
- Integración WhatsApp: pegar token Whapi → conectar canal → URL de webhook auto-generada
- Verificar y actualizar número (cuando re-paireas con otro WhatsApp)
- Preferencias de notificación

### Aprendizaje IA (solo admin)
Dashboard del feedback loop: correcciones del abogado sobre extracción IA, agregadas por tipo de caso y campo, usadas para mejorar prompts.

## Conexión con Backend

El frontend consume API FastAPI en Railway (volumen persistente `/app/data` para SQLite). Endpoints principales:

- `/auth/*` — login, register, verificar, refresh, logout, cambiar-password
- `/api/casos[/{id}]` — CRUD + notificar
- `/api/casos/{id}/documentos` — multi-doc + URL firmada
- `/api/abogados[/{id}]` — perfil + Whapi config (filtrado por email del JWT)
- `/api/estudios[/{id}]` — estudio jurídico
- `/api/agente/*` — Legal Agent
- `/api/calcular-plazo` `/api/feriados` — calculadora
- `/api/corrections/*` — feedback loop

CORS: el backend permite `localhost:3000` y `minka-front.vercel.app`.

## Deploy

- **Frontend**: Vercel (`minka-front.vercel.app`), auto-deploy en push a `main`
- **Backend**: Railway, repo separado `github.com/odiseo159-beep/MINKA-legal`

## Estructura

```
app/dashboard/
├── casos/{,[id]/}page.tsx    # Lista + detalle por pestañas
├── calendario/, clientes/, reportes/, calculadora/
├── notificaciones/, configuracion/
└── aprendizaje/page.tsx       # Solo admin

components/
├── case-form.tsx              # Multi-upload + progress
├── date-input-pe.tsx          # Input dd/mm/aaaa custom (Chrome ignora lang)
├── documentos-panel.tsx       # Multi-doc + R2 signed download
├── legal-agent-panel.tsx      # 4 acciones IA por caso
├── caso-chat-panel.tsx, normativa-panel.tsx
├── onboarding-tour.tsx        # Tour por sección
└── filter-bar.tsx, case-card.tsx, ...

lib/
├── api.ts                     # Cliente FastAPI
├── auth-store.ts              # Zustand persist
├── document-parser.ts         # Mammoth.js
└── utils.ts                   # parseDate UTC-aware, formatDate, etc.
```

## Identidad visual

- **Primary**: `#C0392B` (`minka-500`)
- Estados: nuevo (azul), en trámite (amber), en audiencia (morado), pendiente doc (amarillo), en apelación (índigo), resuelto (verde), archivado (gris)

## Licencia

MIT — SimplifAI ([simplifai.pe](https://simplifai.pe))
