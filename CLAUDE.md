# CLAUDE.md — Instrucciones para Claude Code

## 🎯 Proyecto: Minka Frontend

Minka es un asistente de IA para abogados peruanos que mantiene informados a sus clientes sobre el estado de sus casos legales 24/7 por WhatsApp.

Este repositorio es el **frontend** (Next.js 14) que se conecta a un backend FastAPI existente.

---

## 📋 Tarea Inmediata

El desarrollador acaba de clonar el proyecto y tiene problemas con `npm run dev`. Necesitas:

1. **Diagnosticar el problema**:
   ```bash
   npm run dev
   ```
   Si hay errores, léelos cuidadosamente.

2. **Problemas comunes a revisar**:
   - Vulnerabilidades de Next.js → `npm install next@latest`
   - Dependencias faltantes → `npm install`
   - Errores de TypeScript → revisar imports y types
   - Puerto ocupado → matar proceso o usar otro puerto

3. **Verificar que compile**:
   ```bash
   npm run build
   ```

4. **Si todo funciona**, abrir http://localhost:3000

---

## 🏗️ Arquitectura del Proyecto

```
minka-frontend/           # Next.js 14 (App Router)
├── app/
│   ├── layout.tsx        # Root layout + metadata
│   ├── page.tsx          # Landing → redirect a /login o /dashboard
│   ├── providers.tsx     # React Query provider
│   ├── globals.css       # Tailwind + CSS vars
│   ├── login/
│   │   └── page.tsx      # Página de login
│   └── dashboard/
│       ├── layout.tsx    # Layout con sidebar + auth guard
│       ├── page.tsx      # Home con stats
│       ├── casos/
│       │   ├── page.tsx  # Lista de casos CRUD
│       │   └── [id]/
│       │       └── page.tsx  # Detalle de caso
│       └── calendario/
│           └── page.tsx  # Placeholder
├── components/
│   ├── sidebar.tsx
│   ├── header.tsx
│   ├── stats-cards.tsx
│   ├── case-form.tsx
│   └── ui/               # Toast notifications
├── hooks/
│   └── use-cases.ts      # React Query hooks
├── lib/
│   ├── api.ts            # Cliente API para FastAPI
│   ├── auth-store.ts     # Zustand store
│   └── utils.ts          # Helpers
└── types/
    └── index.ts          # TypeScript types
```

---

## 🔗 Conexión con Backend

El frontend se conecta a un backend FastAPI en Railway.

**Variable de entorno requerida**:
```env
NEXT_PUBLIC_API_URL=https://katia-jorkat-production.up.railway.app
```

**Endpoints que el frontend consume**:

### Auth
- `POST /auth/login` — Login con email/password → JWT token
- `GET /auth/verificar` — Verificar sesión activa
- `POST /auth/logout` — Cerrar sesión

### Casos
- `GET /api/casos` — Listar todos los casos
- `POST /api/casos` — Crear caso
- `GET /api/casos/:id` — Obtener caso por ID
- `PUT /api/casos/:id` — Actualizar caso
- `DELETE /api/casos/:id` — Eliminar caso
- `POST /api/casos/:id/notificar` — Enviar notificación WhatsApp

---

## 🎨 Stack Técnico

| Tecnología | Uso |
|------------|-----|
| Next.js 14 | Framework (App Router) |
| TypeScript | Tipado |
| Tailwind CSS | Estilos |
| Zustand | Estado global (auth) |
| React Query | Data fetching + cache |
| React Hook Form | Formularios |
| Zod | Validación |
| Radix UI | Primitivos UI (toast) |
| Lucide React | Iconos |

---

## 🔐 Flujo de Autenticación

1. Usuario ingresa email/password en `/login`
2. `POST /auth/login` → recibe JWT token
3. Token se guarda en Zustand (persistido en localStorage)
4. Cada request incluye header `Authorization: Bearer <token>`
5. En cada página de `/dashboard/*`, se verifica auth con `GET /auth/verificar`
6. Si no hay sesión válida → redirect a `/login`

---

## 📁 Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `lib/api.ts` | Funciones fetch para conectar con FastAPI |
| `lib/auth-store.ts` | Zustand store para auth state |
| `hooks/use-cases.ts` | React Query hooks para CRUD de casos |
| `types/index.ts` | Interfaces TypeScript |
| `app/dashboard/layout.tsx` | Auth guard + layout del dashboard |

---

## 🚀 Comandos

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Ejecutar build
npm start

# Lint
npm run lint
```

---

## 📖 Documentación Adicional

- **PLAN_DESARROLLO.md** — Roadmap completo del proyecto con checkboxes
- **README.md** — Instrucciones de instalación y deploy

---

## ⚠️ Notas Importantes

1. **El backend debe tener auth implementado** — Si `/auth/login` no existe, el frontend no funcionará.

2. **CORS** — El backend debe permitir requests desde `localhost:3000` y el dominio de Vercel.

3. **Colores de Minka**:
   - Primary: `#C0392B` (rojo)
   - Los colores están en `tailwind.config.ts` como `minka-500`, etc.

4. **Estados de casos**:
   ```typescript
   type CaseStatus = 
     | "nuevo" | "en_tramite" | "en_audiencia" 
     | "pendiente_documento" | "en_revision" 
     | "en_apelacion" | "resuelto" | "archivado";
   ```

---

## 🔧 Si Hay Errores

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
Revisar que los imports estén correctos. Los paths usan alias `@/`:
```typescript
import { useAuthStore } from "@/lib/auth-store";
```

### Error: Puerto 3000 ocupado
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3000
kill -9 <PID>
```

---

## 📞 Contacto

- **Proyecto**: Minka (SimplifAI)
- **Fundador**: Daniel
- **Email**: daniel@simplifai.pe
- **Backend repo**: github.com/odiseo159-beep/MINKA-legal
