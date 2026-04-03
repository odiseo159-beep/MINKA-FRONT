# Minka Frontend — Next.js 14

Frontend moderno para el dashboard de Minka, el asistente legal AI por WhatsApp.

## 🚀 Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **State**: Zustand + React Query
- **Forms**: React Hook Form + Zod
- **UI**: Radix UI primitives + Lucide icons
- **Backend**: FastAPI (Railway)

## 📁 Estructura

```
minka-frontend/
├── app/
│   ├── layout.tsx          # Root layout + metadata
│   ├── page.tsx             # Landing (redirect)
│   ├── login/page.tsx       # Página de login
│   └── dashboard/
│       ├── layout.tsx       # Dashboard layout (sidebar + header)
│       ├── page.tsx         # Home con stats y actividad
│       └── casos/page.tsx   # Lista de casos con CRUD
├── components/
│   ├── ui/                  # Componentes base (toast, etc.)
│   ├── sidebar.tsx          # Navegación lateral
│   ├── header.tsx           # Header con user menu
│   ├── stats-cards.tsx      # Tarjetas de estadísticas
│   └── case-form.tsx        # Formulario de casos
├── hooks/
│   └── use-cases.ts         # React Query hooks para casos
├── lib/
│   ├── api.ts               # Cliente API para FastAPI
│   ├── auth-store.ts        # Zustand store para auth
│   └── utils.ts             # Utilidades (cn, formatters)
└── types/
    └── index.ts             # TypeScript types
```

## 🛠️ Instalación

```bash
# 1. Clonar e instalar
cd minka-frontend
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con la URL de tu backend

# 3. Ejecutar en desarrollo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## 🔧 Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | URL del backend FastAPI | `https://tu-backend.railway.app` |

## 📦 Deploy en Vercel

1. Conectar repo a Vercel
2. Configurar variable de entorno `NEXT_PUBLIC_API_URL`
3. Deploy automático en cada push

```bash
# O manualmente
npm run build
vercel --prod
```

## 🔐 Autenticación

El frontend se conecta al backend FastAPI para autenticación:

- `POST /auth/login` → Recibe JWT token
- `GET /auth/verificar` → Valida sesión
- `POST /auth/logout` → Cierra sesión

El token se almacena en Zustand (persistido en localStorage) y se envía como `Authorization: Bearer <token>` en cada request.

## 📱 Funcionalidades

### Dashboard Home
- 4 tarjetas de estadísticas
- Lista de casos urgentes (próxima fecha ≤ 7 días)
- Actividad reciente
- Acciones rápidas

### Casos
- Tabla con búsqueda y filtros
- CRUD completo (crear, editar)
- Notificar cliente por WhatsApp
- Estados con colores distintivos
- Fechas con indicador de urgencia

### Próximamente
- 📅 Calendario de eventos
- 👥 Gestión de clientes
- 📊 Reportes y métricas
- ⚙️ Configuración

## 🎨 Colores de Minka

```css
--minka-500: #C0392B;  /* Primary */
--minka-600: #A93226;  /* Primary dark */
```

Estados de casos:
- 🔵 Nuevo: `bg-blue-100`
- 🟠 En trámite: `bg-amber-100`
- 🟣 En audiencia: `bg-purple-100`
- 🟡 Pendiente doc: `bg-yellow-100`
- 🟢 Resuelto: `bg-green-100`
- ⚫ Archivado: `bg-gray-100`

## 🤝 Conexión con Backend

El frontend asume que el backend FastAPI tiene estos endpoints:

```
POST /auth/login
POST /auth/logout
GET  /auth/verificar
GET  /api/casos
POST /api/casos
PUT  /api/casos/:id
DELETE /api/casos/:id
POST /api/casos/:id/notificar
```

## 📝 Desarrollo

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Lint
npm run lint
```

## 📄 Licencia

MIT — SimplifAI (simplifai.pe)
