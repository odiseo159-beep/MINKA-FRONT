# CLAUDE.md — Instrucciones para Claude Code

## Proyecto: Minka Frontend

Minka es un asistente de IA para abogados peruanos que mantiene informados a sus clientes sobre el estado de sus casos legales 24/7 por WhatsApp.

Este repositorio es el **frontend** (Next.js 14) que se conecta a un backend FastAPI existente.

---

## Prioridad actual (Abril 2026)

El proyecto está en transición de MVP a **prueba real con abogados**. Los próximos pasos son:

1. **Registro de cuentas** — No existe página de signup. Necesita endpoint `POST /auth/register` en backend primero, luego crear `app/registro/page.tsx`.
2. **Deploy de cambios pendientes** — Hay cambios locales no pusheados (upload de documentos, filas clickeables en tabla de casos). Hacer commit + push para que Vercel los despliegue.
3. **Almacenamiento de documentos** — Actualmente los docs se parsean en el navegador pero no se almacenan. Futuro: cloud storage (S3/GCS) + endpoints backend.
4. **Protección de datos** — Ley N° 29733 (Perú) + secreto profesional. Necesario antes de producción real.
5. **Integración con sistemas externos** — Google Drive, sistemas propios de estudios. Requiere OAuth + backend (Fase 3+).

---

## Arquitectura del Proyecto

```
minka-frontend/           # Next.js 14 (App Router)
├── app/
│   ├── layout.tsx        # Root layout + metadata
│   ├── page.tsx          # Landing → redirect a /dashboard
│   ├── providers.tsx     # React Query provider
│   ├── globals.css       # Tailwind + CSS vars
│   ├── login/
│   │   └── page.tsx      # Página de login (sin registro aún)
│   └── dashboard/
│       ├── layout.tsx    # Layout con sidebar + auth guard
│       ├── page.tsx      # Home con stats + actividad reciente
│       ├── casos/
│       │   ├── page.tsx  # Lista de casos CRUD (filas clickeables)
│       │   └── [id]/
│       │       └── page.tsx  # Detalle de caso
│       ├── calendario/
│       │   └── page.tsx  # Vista mensual/semanal/diaria
│       ├── clientes/
│       │   └── page.tsx  # Clientes extraídos de casos
│       ├── reportes/
│       │   └── page.tsx  # Gráficos + exportar PDF
│       ├── configuracion/
│       │   └── page.tsx  # Perfil + estudio jurídico
│       ├── notificaciones/
│       │   └── page.tsx  # Historial de notificaciones
│       └── calculadora/
│           └── page.tsx  # Calculadora de plazos legales
├── components/
│   ├── sidebar.tsx
│   ├── header.tsx
│   ├── stats-cards.tsx
│   ├── case-form.tsx     # Formulario de caso con upload de .docx
│   ├── case-card.tsx     # Card de caso (móvil, clickeable)
│   ├── filter-bar.tsx    # Filtros avanzados
│   ├── calendar-view.tsx # Calendario mensual/semanal
│   ├── pagination.tsx
│   ├── skeletons.tsx
│   ├── empty-states.tsx
│   └── ui/               # Toast notifications
├── hooks/
│   ├── use-cases.ts      # React Query hooks para CRUD
│   ├── use-sort.ts       # Ordenamiento de columnas
│   ├── use-pagination.ts # Paginación
│   └── use-debounce.ts   # Debounce para búsqueda
├── lib/
│   ├── api.ts            # Cliente API para FastAPI
│   ├── auth-store.ts     # Zustand store (auth)
│   ├── notification-store.ts # Zustand store (notificaciones)
│   ├── document-parser.ts    # Parser de .docx (mammoth.js, client-side)
│   ├── utils.ts          # Helpers generales
│   ├── calendar-utils.ts # Helpers de calendario
│   ├── client-utils.ts   # Helpers de clientes
│   └── report-utils.ts   # Helpers de reportes
└── types/
    └── index.ts          # TypeScript types + labels + colors
```

---

## Conexión con Backend

El frontend se conecta a un backend FastAPI en Railway.

**Variable de entorno requerida**:
```env
NEXT_PUBLIC_API_URL=https://katia-jorkat-production.up.railway.app
```

**Endpoints que el frontend consume**:

### Auth
- `POST /auth/login` — Login con email/password → JWT token
- `GET /auth/verificar` — Verificar sesión activa
- `GET /auth/me` — Perfil del usuario
- `POST /auth/logout` — Cerrar sesión
- `PUT /auth/cambiar-password` — Cambiar contraseña

### Casos
- `GET /api/casos` — Listar todos los casos
- `POST /api/casos` — Crear caso
- `GET /api/casos/:id` — Obtener caso por ID
- `PUT /api/casos/:id` — Actualizar caso
- `DELETE /api/casos/:id` — Eliminar caso
- `POST /api/casos/:id/notificar` — Enviar notificación WhatsApp

### Abogados y Estudios
- `GET/POST/PUT /api/abogados` — CRUD abogados
- `GET/POST/PUT /api/estudios` — CRUD estudios jurídicos

### Calculadora
- `POST /api/calcular-plazo` — Calcular fecha de vencimiento
- `GET /api/feriados` — Listar feriados de Perú

---

## Stack Técnico

| Tecnología | Uso |
|------------|-----|
| Next.js 14.2.35 | Framework (App Router) — NO actualizar a 15+ por ahora |
| TypeScript 5.4 | Tipado |
| Tailwind CSS 3.4 | Estilos (patrón shadcn/ui CSS vars) |
| Zustand 4.5 | Estado global (auth, notificaciones) |
| React Query 5.40 | Data fetching + cache |
| React Hook Form 7.51 | Formularios |
| Zod 3.23 | Validación |
| mammoth 1.x | Parseo de .docx en el navegador |
| Radix UI | Primitivos UI (dialog, toast, select) |
| Lucide React | Iconos |
| recharts 3.8 | Gráficos |
| date-fns 3.6 | Manejo de fechas + timezone |
| html2canvas + jsPDF | Exportar reportes a PDF |
| Vitest + Testing Library | Tests unitarios e integración |

---

## Flujo de Autenticación

1. Usuario ingresa email/password en `/login`
2. `POST /auth/login` → recibe JWT token
3. Token se guarda en Zustand (persistido en localStorage)
4. Cada request incluye header `Authorization: Bearer <token>`
5. En cada página de `/dashboard/*`, se verifica auth con `GET /auth/verificar`
6. Si no hay sesión válida → redirect a `/login`

**Nota**: No hay registro de usuarios. Se crean desde backend (admin).

---

## Upload de Documentos (nuevo)

El formulario de crear caso permite subir `.docx` para pre-llenar campos automáticamente.

- **Archivo**: `lib/document-parser.ts`
- **Librería**: mammoth.js (parseo 100% client-side, no se envía nada al servidor)
- **Extrae**: nombre_cliente, teléfono, expediente, tipo_caso, estado, notas, documentos_pendientes
- **Formatos soportados**: denuncias penales, demandas civiles, resoluciones fiscales
- **Patrones regex**: busca DENUNCIANTE/DEMANDANTE, DNI, celular, delito/materia, expediente judicial, carpeta fiscal, medios probatorios

---

## Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `lib/api.ts` | Funciones fetch para conectar con FastAPI |
| `lib/auth-store.ts` | Zustand store para auth state |
| `lib/document-parser.ts` | Parser de .docx → datos de caso |
| `hooks/use-cases.ts` | React Query hooks para CRUD de casos |
| `types/index.ts` | Interfaces TypeScript + labels + colores |
| `app/dashboard/layout.tsx` | Auth guard + layout del dashboard |
| `components/case-form.tsx` | Formulario de caso con upload |

---

## Comandos

```bash
npm run dev       # Desarrollo (localhost:3000)
npm run build     # Build de producción
npm start         # Ejecutar build
npm run lint      # Lint
npx vitest        # Tests
```

---

## Notas Importantes

1. **Next.js 14.2.35** — No actualizar. Se decidió mantener en 14.x.
2. **CORS** — El backend debe permitir requests desde `localhost:3000` y `minka-front.vercel.app`.
3. **Colores de Minka**: Primary `#C0392B` (rojo), configurado en `tailwind.config.ts` como `minka-500`.
4. **Estados de casos**: `nuevo | en_tramite | en_audiencia | pendiente_documento | en_revision | en_apelacion | resuelto | archivado`
5. **Tipos de caso**: `penal_estafa | penal_robo | penal_lesiones | laboral | familia_alimentos | familia_tenencia | civil_desalojo | civil_otro`
6. **Deploy**: Frontend en Vercel (`minka-front.vercel.app`), Backend en Railway.
7. **Backend repo**: `github.com/odiseo159-beep/MINKA-legal` (local: `C:\Users\danie\Downloads\minka-legal`)

---

## Si Hay Errores

### Error: "Module not found"
```bash
npm install
```

### Error: "NEXT_PUBLIC_API_URL undefined"
```bash
cp .env.example .env.local
# Editar .env.local con la URL del backend
```

### Error: TypeScript
Los paths usan alias `@/`:
```typescript
import { useAuthStore } from "@/lib/auth-store";
```

### Error: Puerto 3000 ocupado
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```
