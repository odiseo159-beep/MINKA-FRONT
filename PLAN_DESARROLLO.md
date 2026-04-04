# PLAN_DESARROLLO.md — Minka Roadmap

> **Última actualización**: Abril 2026
> **Estado actual**: Fase 1 — Consolidar MVP
> **Próximo milestone**: Probar conexión con backend + Deploy en Vercel

---

## 📊 Resumen del Proyecto

| Aspecto | Detalle |
|---------|---------|
| **Producto** | Asistente legal AI por WhatsApp para abogados peruanos |
| **Propuesta de valor** | Mantener clientes informados 24/7 sin trabajo manual del abogado |
| **Stack** | Next.js 14 + FastAPI + Claude AI + WhatsApp (Whapi.cloud) |
| **Modelo de negocio** | SaaS B2B (por estudio jurídico) |
| **Competencia** | Harvey AI (enterprise), Juztina (interno) — Minka es externo/cliente |

---

## 🎯 Fase 1: Consolidar MVP (Q2 2026) — 6 semanas

### 1.1 Frontend Next.js
- [x] Crear estructura Next.js 14 con App Router
- [x] Configurar Tailwind CSS + colores Minka
- [x] Crear página de login
- [x] Crear layout del dashboard (sidebar + header)
- [x] Crear página home con stats cards
- [x] Crear página de casos con tabla
- [x] Crear formulario de caso (crear/editar)
- [x] Crear página de detalle de caso
- [x] Implementar Zustand para auth state
- [x] Implementar React Query para data fetching
- [x] Crear hooks personalizados (use-cases)
- [x] Crear componentes UI (toast, form inputs)
- [x] **COMPLETADO**: Resolver errores de npm/localhost (2026-04-04: downgrade Next.js 16→14.2.35, fix tailwind config, fix TS types)
- [x] Probar conexión con backend (2026-04-04: fix tipo_caso string flexible, parseDate para formato backend)
- [x] Deploy en Vercel (2026-04-04: https://minka-front.vercel.app)

### 1.2 Autenticación Backend
- [x] Crear auth.py (JWT + bcrypt)
- [x] Crear users_db.py (modelo Usuario)
- [x] Crear auth_api.py (endpoints /auth/*)
- [x] Crear login.html (versión HTML estática)
- [x] Crear INTEGRACION_AUTH.md
- [x] Integrar auth en main.py del backend (2026-04-04: auth_router registrado, init_users_db en lifespan)
- [x] Probar login end-to-end (2026-04-04: verificado con curl, Railway devuelve JWT correctamente)
- [x] Crear usuario admin inicial (2026-04-04: auto-creado en lifespan con ADMIN_EMAIL/ADMIN_PASSWORD env vars)
- [x] Proteger endpoints /api/casos con auth (2026-04-04: Depends(require_auth) en todos los endpoints, REQUIRE_AUTH env toggle)

### 1.3 Dashboard Mejoras UX
- [x] Responsive mobile (2026-04-04: sidebar colapsable, case cards mobile, hamburger menu)
- [x] Paginación en tabla de casos (2026-04-04: 10/25/50 por página con navegación)
- [x] Filtros avanzados (2026-04-04: tipo de caso, rango de fechas, chips activos)
- [x] Ordenamiento de columnas (2026-04-04: click en headers, asc/desc/none con indicadores)
- [x] Búsqueda con debounce (2026-04-04: 300ms debounce hook)
- [x] Loading skeletons mejorados (2026-04-04: skeletons que replican layout real)
- [x] Empty states con ilustraciones (2026-04-04: SVG inline para no-cases, no-results, error)

### 1.4 Notificaciones Proactivas
- [x] Endpoint POST /api/casos/:id/notificar funcionando (2026-04-04: creado en dashboard_api.py, envía WhatsApp via Whapi)
- [x] Templates de mensajes WhatsApp (2026-04-04: template con estado, expediente, próxima fecha/acción, documentos)
- [ ] Historial de notificaciones enviadas
- [x] Toggle de notificación por caso (2026-04-04: notificar_cliente flag en CaseUpdate, botón en detalle de caso)
- [x] Notificación automática al cambiar estado (2026-04-04: envía automáticamente al actualizar caso si notificar_cliente=true)

### 1.5 Testing y Documentación
- [x] Tests unitarios (2026-04-04: Vitest + 44 tests para utils, sort, pagination, debounce)
- [ ] Tests de integración (API calls)
- [x] README actualizado (2026-04-04: estructura completa, testing, estado actual, funcionalidades)
- [ ] Video demo del producto

---

## 🎯 Fase 2: Plataforma del Abogado (Q3 2026) — 8 semanas

### 2.1 Modelo de Abogado
- [ ] Crear modelo Abogado en SQLite
  ```python
  # id, nombre, email, telefono, colegiatura, 
  # especialidades, whatsapp_numero, activo
  ```
- [ ] Crear modelo EstudioJuridico
  ```python
  # id, nombre, ruc, direccion, plan, fecha_creacion
  ```
- [ ] Relación: Caso → Abogado → Estudio
- [ ] CRUD de abogados en dashboard
- [x] Página de Clientes en dashboard (2026-04-04: extrae clientes de casos, búsqueda, cards con stats)
- [ ] Perfil de abogado (foto, bio, especialidades)
- [x] Página de Configuración (2026-04-04: perfil, estudio jurídico, notificaciones con toggles)

### 2.2 Calendario Inteligente
- [ ] Crear modelo EventoCalendario
  ```python
  # id, caso_id, abogado_id, titulo, fecha_hora,
  # tipo (audiencia/plazo/reunion/vencimiento),
  # recordatorio_dias, notificado, notas
  ```
- [x] Vista mensual del calendario (2026-04-04: CalendarView con date-fns, grid responsive, navegación mes, badges por estado)
- [x] Vista semanal (2026-04-04: toggle Mes/Semana/Día, grid 7 columnas con detalle de eventos)
- [x] Vista diaria (2026-04-04: lista detallada de eventos con links a caso)
- [x] Auto-crear eventos desde casos (próxima_fecha) (2026-04-04: agrupa casos por proxima_fecha automáticamente)
- [ ] Alertas 1/3/7 días antes
- [ ] Notificación al abogado por WhatsApp
- [ ] (Opcional) Sync con Google Calendar

### 2.3 Métricas del Dashboard
- [x] Gráfico de casos por estado (pie chart) (2026-04-04: recharts PieChart con STATUS_COLORS)
- [x] Gráfico de casos por mes (bar chart) (2026-04-04: recharts BarChart vertical por mes)
- [ ] Tiempo promedio de respuesta
- [x] Casos urgentes (próximos 7 días) (2026-04-04: lista con links a detalle de caso)
- [x] Clientes más activos (2026-04-04: top 5 clientes por número de casos en reportes)
- [ ] Exportar reportes a PDF
- [x] Gráfico de casos por tipo (bar chart horizontal) (2026-04-04: recharts BarChart)
- [x] Filtro por periodo (30d, 3m, 6m, todo) (2026-04-04: selector de periodo en reportes)

### 2.4 Comandos WhatsApp para Abogado
- [ ] Detectar número de abogado vs cliente
- [ ] Comando: "estado 12345" → info del caso
- [ ] Comando: "casos hoy" → lista de pendientes
- [ ] Comando: "actualizar 12345 en_audiencia" → cambiar estado
- [ ] Comando: "notificar 12345" → enviar update al cliente

---

## 🎯 Fase 3: Base de Conocimiento Legal (Q4 2026) — 10 semanas

### 3.1 Estructura de Conocimiento
- [ ] Crear carpeta knowledge/penal/delitos/
- [ ] Crear carpeta knowledge/penal/procesos/
- [ ] Crear carpeta knowledge/normativa/
- [ ] Crear carpeta knowledge/utils/

### 3.2 Delitos Penales (prioridad)
- [x] Estafa (Art. 196 CP) — kb_proceso_penal_estafa.json
- [ ] Robo agravado (Art. 189 CP)
- [ ] Hurto (Art. 185 CP)
- [ ] Apropiación ilícita (Art. 190 CP)
- [ ] Omisión asistencia familiar (Art. 149 CP)
- [ ] Lesiones (Art. 121-124 CP)
- [ ] Violencia familiar (Ley 30364)
- [ ] Feminicidio (Art. 108-B CP)
- [ ] Violación sexual (Art. 170 CP)
- [ ] Homicidio (Art. 106-109 CP)

### 3.3 Otros Procesos
- [x] Proceso laboral — kb_proceso_laboral.json
- [x] Alimentos — kb_proceso_familia_alimentos.json
- [x] Desalojo — kb_proceso_civil_desalojo.json
- [ ] Divorcio
- [ ] Tenencia y régimen de visitas
- [ ] Sucesiones

### 3.4 Calculadora de Plazos
- [ ] Crear feriados_peru.json (2024-2030)
- [ ] Función calcular_dias_habiles()
- [ ] Función calcular_vencimiento()
- [ ] Integrar en asesor legal del dashboard
- [ ] Alertas automáticas de plazos

### 3.5 RAG Legal (Retrieval Augmented Generation)
- [ ] Instalar ChromaDB
- [ ] Instalar sentence-transformers
- [ ] Crear embeddings de normativa
- [ ] Crear embeddings de jurisprudencia
- [ ] Búsqueda semántica en Claude prompts
- [ ] Citar fuentes en respuestas del bot

### 3.6 Scraping de Fuentes Oficiales
- [ ] Scraper El Peruano (normas nuevas)
- [ ] Scraper SPIJ (normativa vigente)
- [ ] Scraper Poder Judicial (jurisprudencia)
- [ ] Scraper Tribunal Constitucional
- [ ] Pipeline de actualización automática

---

## 🎯 Fase 4: Escalar y Monetizar (2027)

### 4.1 Multi-tenancy
- [ ] Separación de datos por estudio
- [ ] Subdominios custom (estudio.minka.pe)
- [ ] Branding personalizado por estudio
- [ ] Número WhatsApp por estudio

### 4.2 Pricing
| Plan | Precio | Límites |
|------|--------|---------|
| Starter | Gratis | 1 abogado, 50 casos, 100 msgs/mes |
| Pro | $29/mes | 5 abogados, 500 casos, msgs ilimitados, calendario |
| Enterprise | $99/mes | Ilimitado, RAG completo, API access, soporte |

### 4.3 Infraestructura
- [ ] Migrar SQLite → PostgreSQL
- [ ] Migrar Railway → AWS/GCP
- [ ] CDN para assets
- [ ] Backups automáticos
- [ ] Monitoreo (Sentry, Datadog)

### 4.4 Integraciones
- [ ] Google Calendar (2-way sync)
- [ ] Firma digital
- [ ] Generación de PDFs
- [ ] Pasarela de pagos (tasas judiciales)
- [ ] CRM legal (Clio, PracticePanther)

---

## 💰 Proyección de Costos

### MVP (actual)
| Servicio | Costo/mes |
|----------|-----------|
| Railway (backend) | ~$5 |
| Vercel (frontend) | $0 (free tier) |
| Claude API | ~$20 |
| Whapi.cloud | ~$10 |
| **Total** | **~$35/mes** |

### Producción (Fase 2+)
| Servicio | Costo/mes |
|----------|-----------|
| AWS/Railway Pro | ~$50-100 |
| PostgreSQL | ~$15-30 |
| Claude API (más uso) | ~$50-200 |
| Whapi.cloud Pro | ~$30-50 |
| Dominio + SSL | ~$5 |
| Monitoreo | ~$20-50 |
| **Total** | **~$200-500/mes** |

### Break-even
- 10 estudios en Plan Pro = $290/mes de revenue
- 5 estudios en Enterprise = $495/mes de revenue

---

## 📅 Timeline Visual

```
2026
├── Abr-May: Fase 1 (MVP consolidado)
│   ├── [AHORA] Frontend Next.js funcionando
│   ├── Auth integrado en backend
│   └── Deploy en Vercel + Railway
│
├── Jun-Ago: Fase 2 (Plataforma abogado)
│   ├── Modelo abogado/estudio
│   ├── Calendario inteligente
│   └── Métricas dashboard
│
└── Sep-Dic: Fase 3 (Knowledge base)
    ├── 10+ delitos documentados
    ├── RAG con ChromaDB
    └── Calculadora de plazos

2027
├── Q1: Fase 4 (Multi-tenant)
├── Q2: Lanzamiento público
└── Q3+: Escalar
```

---

## 🔄 Cómo Actualizar Este Archivo

Cuando completes una tarea:
1. Cambia `[ ]` a `[x]`
2. Agrega la fecha si es relevante
3. Commit: `git commit -m "docs: update PLAN_DESARROLLO - completado X"`

Cuando agregues nuevas tareas:
1. Agrégalas en la fase correspondiente
2. Mantén el formato de checkbox `- [ ]`

---

## 📞 Contacto

- **Proyecto**: Minka — SimplifAI
- **Fundador**: Daniel
- **Email**: daniel@simplifai.pe
- **Web**: simplifai.pe
