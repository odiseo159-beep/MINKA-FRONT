# Minka Frontend — Next.js 14

Frontend moderno para el dashboard de Minka, el asistente legal AI por WhatsApp.

## Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **State**: Zustand + React Query
- **Forms**: React Hook Form + Zod
- **UI**: Radix UI primitives + Lucide icons
- **Testing**: Vitest + React Testing Library
- **Backend**: FastAPI (Railway)

## Estructura

```
minka-frontend/
├── app/
│   ├── layout.tsx              # Root layout + metadata
│   ├── page.tsx                # Redirect a /dashboard
│   ├── globals.css             # Tailwind + CSS vars + animations
│   ├── login/page.tsx          # Página de login
│   └── dashboard/
│       ├── layout.tsx          # Layout con sidebar + mobile drawer
│       ├── page.tsx            # Home con stats y actividad
│       ├── casos/page.tsx      # Lista de casos con CRUD completo
│       ├── casos/[id]/page.tsx # Detalle de caso
│       └── calendario/page.tsx # Placeholder
├── components/
│   ├── ui/                     # Componentes base (toast)
│   ├── sidebar.tsx             # Navegación lateral (desktop)
│   ├── mobile-sidebar.tsx      # Drawer slide-in (mobile)
│   ├── header.tsx              # Header con hamburger + user menu
│   ├── stats-cards.tsx         # Tarjetas de estadísticas
│   ├── case-form.tsx           # Formulario de casos (crear/editar)
│   ├── case-card.tsx           # Vista de caso como card (mobile)
│   ├── filter-bar.tsx          # Barra de filtros avanzados + chips
│   ├── pagination.tsx          # Paginación con selector de filas
│   ├── skeletons.tsx           # Loading skeletons (tabla, cards, stats)
│   └── empty-states.tsx        # Empty states con SVG (no-cases, no-results, error)
├── hooks/
│   ├── use-cases.ts            # React Query hooks para CRUD de casos
│   ├── use-debounce.ts         # Hook genérico de debounce
│   ├── use-sort.ts             # Hook + función de sorting
│   └── use-pagination.ts       # Hook de paginación client-side
├── lib/
│   ├── api.ts                  # Cliente API para FastAPI
│   ├── auth-store.ts           # Zustand store para auth
│   └── utils.ts                # Utilidades (cn, formatters, parseDate)
├── types/
│   └── index.ts                # TypeScript types + labels + colors
└── __tests__/
    ├── lib/utils.test.ts       # Tests de utilidades
    └── hooks/                  # Tests de hooks (sort, pagination, debounce)
```

## Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local

# 3. Ejecutar en desarrollo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | URL del backend FastAPI | `https://katia-jorkat-production.up.railway.app` |

## Comandos

```bash
npm run dev        # Desarrollo (localhost:3000)
npm run build      # Build de producción
npm run lint       # ESLint
npm test           # Ejecutar tests (Vitest)
npm run test:watch # Tests en modo watch
```

## Estado actual

**Auth**: El login está temporalmente bypassed (redirect directo a /dashboard) porque el backend aún no tiene los endpoints `/auth/*` integrados. Cuando estén listos, restaurar el auth guard en `app/page.tsx` y `app/dashboard/layout.tsx`.

**Notificaciones**: El botón de notificar por WhatsApp existe en la UI, pero el endpoint `POST /api/casos/:id/notificar` aún no está implementado en el backend.

## Funcionalidades

### Dashboard Home
- 4 tarjetas de estadísticas (total, activos, resueltos, pendientes)
- Lista de casos urgentes (próxima fecha <= 7 días)
- Actividad reciente
- Acciones rápidas

### Casos
- Tabla con búsqueda debounced y filtros avanzados (estado, tipo, rango de fechas)
- Chips de filtros activos con opción de limpiar
- Ordenamiento por columnas (click en headers)
- Paginación (10/25/50 por página)
- CRUD completo (crear, editar con modal)
- Vista responsive: tabla en desktop, cards en mobile
- Notificar cliente por WhatsApp
- Estados con colores distintivos
- Fechas con indicador de urgencia
- Loading skeletons y empty states con ilustraciones SVG

### Responsive
- Sidebar colapsable en mobile (hamburger menu)
- Drawer slide-in con navegación completa
- Cards view para casos en pantallas pequeñas
- Filtros apilables en mobile

## Conexión con Backend

El frontend consume la API FastAPI en Railway:

```
GET  /api/casos           # Listar casos
POST /api/casos           # Crear caso
GET  /api/casos/:id       # Obtener caso
PUT  /api/casos/:id       # Actualizar caso
DELETE /api/casos/:id     # Eliminar caso
GET  /api/casos/stats     # Estadísticas
```

**Nota CORS**: El backend debe permitir requests desde `localhost:3000` (desarrollo) y el dominio de Vercel (producción).

## Deploy en Vercel

1. Conectar repo a Vercel
2. Configurar variable `NEXT_PUBLIC_API_URL`
3. Deploy automático en cada push

## Colores

```
Primary: #C0392B (minka-500)
```

Estados: Nuevo (azul), En trámite (amber), En audiencia (morado), Pendiente doc (amarillo), Resuelto (verde), Archivado (gris)

## Licencia

MIT — SimplifAI (simplifai.pe)
