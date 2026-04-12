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
- [x] Filas de tabla clickeables (2026-04-12: click en fila → detalle del caso, stopPropagation en botones de acción)
- [x] Cards móviles clickeables (2026-04-12: click en card → detalle, hover con shadow)
- [x] Upload de documentos .docx para pre-llenar formulario (2026-04-12: mammoth.js client-side, regex extraction, drag-and-drop)

### 1.4 Notificaciones Proactivas
- [x] Endpoint POST /api/casos/:id/notificar funcionando (2026-04-04: creado en dashboard_api.py, envía WhatsApp via Whapi)
- [x] Templates de mensajes WhatsApp (2026-04-04: template con estado, expediente, próxima fecha/acción, documentos)
- [x] Historial de notificaciones enviadas (2026-04-05: Zustand store persistido, página /dashboard/notificaciones con filtros y búsqueda)
- [x] Toggle de notificación por caso (2026-04-04: notificar_cliente flag en CaseUpdate, botón en detalle de caso)
- [x] Notificación automática al cambiar estado (2026-04-04: envía automáticamente al actualizar caso si notificar_cliente=true)

### 1.5 Testing y Documentación
- [x] Tests unitarios (2026-04-04: Vitest + 44 tests para utils, sort, pagination, debounce)
- [x] Tests de integración (2026-04-05: 80 tests — api.test.ts, report-utils.test.ts, client-utils.test.ts)
- [x] README actualizado (2026-04-04: estructura completa, testing, estado actual, funcionalidades)
- [ ] Video demo del producto

---

## 🎯 Fase 2: Plataforma del Abogado (Q3 2026) — 8 semanas

### 2.1 Modelo de Abogado
- [x] Crear modelo Abogado en SQLite (2026-04-05: lawyers_db.py — id, nombre, email, telefono, whatsapp_numero, colegiatura, especialidades, activo)
- [x] Crear modelo EstudioJuridico (2026-04-05: tabla estudios — id, nombre, ruc, direccion, plan, fecha_creacion)
- [x] Relación: Caso → Abogado → Estudio (2026-04-05: columna abogado_id en casos via migration segura)
- [x] CRUD de abogados en dashboard (2026-04-05: endpoints GET/POST/PUT/DELETE /api/abogados y /api/estudios)
- [x] Página de Clientes en dashboard (2026-04-04: extrae clientes de casos, búsqueda, cards con stats)
- [x] Perfil de abogado (2026-04-07: configuracion conectada al backend GET/PUT /api/abogados + /api/estudios, skeleton de carga)
- [x] Página de Configuración (2026-04-04: perfil, estudio jurídico, notificaciones con toggles)

### 2.2 Calendario Inteligente
- [x] Crear modelo EventoCalendario (2026-04-07: events_db.py — tabla eventos_calendario, CRUD endpoints /api/eventos)
- [x] Vista mensual del calendario (2026-04-04: CalendarView con date-fns, grid responsive, navegación mes, badges por estado)
- [x] Vista semanal (2026-04-04: toggle Mes/Semana/Día, grid 7 columnas con detalle de eventos)
- [x] Vista diaria (2026-04-04: lista detallada de eventos con links a caso)
- [x] Auto-crear eventos desde casos (próxima_fecha) (2026-04-04: agrupa casos por proxima_fecha automáticamente)
- [x] Alertas 1/3/7 días antes (2026-04-07: APScheduler cron 8am Lima, envía solo en días exactos 1/3/7)
- [x] Notificación al abogado por WhatsApp (2026-04-07: enviar_alertas_eventos() via Whapi al whatsapp_numero del abogado)
- [ ] (Opcional) Sync con Google Calendar

### 2.3 Métricas del Dashboard
- [x] Gráfico de casos por estado (pie chart) (2026-04-04: recharts PieChart con STATUS_COLORS)
- [x] Gráfico de casos por mes (bar chart) (2026-04-04: recharts BarChart vertical por mes)
- [x] Tiempo promedio de respuesta (2026-04-05: avgResponseTime en reportes, card con promedio/min/max/total)
- [x] Casos urgentes (próximos 7 días) (2026-04-04: lista con links a detalle de caso)
- [x] Clientes más activos (2026-04-04: top 5 clientes por número de casos en reportes)
- [x] Exportar reportes a PDF (2026-04-04: html2canvas + jsPDF, header con branding Minka, multi-página)
- [x] Gráfico de casos por tipo (bar chart horizontal) (2026-04-04: recharts BarChart)
- [x] Filtro por periodo (30d, 3m, 6m, todo) (2026-04-04: selector de periodo en reportes)

### 2.4 Comandos WhatsApp para Abogado
- [x] Detectar número de abogado vs cliente (2026-04-05: lawyer_commands.py — es_abogado() busca en tabla abogados)
- [x] Comando: "estado {expediente}" → info del caso (2026-04-05)
- [x] Comando: "casos hoy" → lista de pendientes (2026-04-05)
- [x] Comando: "actualizar {expediente} {estado}" → cambiar estado (2026-04-05)
- [x] Comando: "notificar {expediente}" → enviar update al cliente (2026-04-05)
- [x] Comandos extra: "buscar {nombre}", "casos pendientes", "ayuda" (2026-04-05)

---

## 🎯 Fase 3: Base de Conocimiento Legal (Q4 2026)

> **Alcance definido**: Derecho Penal + Civil/Familia como base inicial.
> El derecho en general es demasiado amplio — se expande por ramas según demanda de abogados.
> Los scrapers son necesarios para mantener la normativa actualizada ante cambios legislativos.

### 3.1 Estructura de Conocimiento
- [x] Base consolidada en procesos_legales.json (minka-legal/knowledge/) — 16 procesos, 116 etapas
- [x] Scraper genérico multi-código (2026-04-12: scripts/scrape_normativa.py — soporta --code cp/cpc/cpp/cpp2/cep/const --all --merge-cpp --dry-run --from-file)
- [x] knowledge/normativa/codigo_penal/ (2026-04-12: 657 arts — CP completo)
- [x] knowledge/normativa/codigo_procesal_civil/ (2026-04-12: 870 arts — CPC completo)
- [x] knowledge/normativa/codigo_procesal_penal/ (2026-04-12: 597 arts — CPP completo Arts I-566 incl. sub-arts 68-A, 268-B, etc.)
- [x] knowledge/normativa/codigo_ejecucion_penal/ (2026-04-12: 162 arts — CEP completo)
- [x] knowledge/normativa/constitucion/ (2026-04-12: 212 arts — Constitución completa)
- [x] CC — Código Civil (2026-04-12: 1115 arts, lpderecho.pe)
- [x] CNA — Código Niños y Adolescentes (2026-04-12: 263 arts, lpderecho.pe)
- [x] NLPT — Ley 29497 (2026-04-12: 74 arts, lpderecho.pe — parser extendido para <p><strong> headings)
- [x] Ley 30077 — Crimen Organizado (2026-04-12: 55 arts, PDF local via pdfminer)
- [x] Ley 30364 — Violencia contra la Mujer (2026-04-12: 55 arts, SPIJ API REST con auth JWT pública)
- [ ] Carpeta knowledge/jurisprudencia/ (para RAG — fase posterior)

### 3.2 Delitos Penales ✅ (estructura inicial completa)
- [x] Estafa (Art. 196 CP) — clave "penal"
- [x] Robo agravado (Art. 189 CP) — 2026-04-07: clave "penal_robo", 8 etapas
- [x] Hurto (Art. 185-186 CP) — 2026-04-07: clave "penal_hurto", 7 etapas
- [x] Apropiación ilícita (Art. 190 CP) — 2026-04-07: clave "penal_apropiacion", 6 etapas
- [x] Omisión asistencia familiar (Art. 149 CP) — 2026-04-07: clave "penal_omision_familiar", 6 etapas
- [x] Lesiones (Art. 121-124 CP) — 2026-04-07: clave "penal_lesiones", 6 etapas
- [x] Violencia familiar (Ley 30364) — 2026-04-07: clave "penal_violencia_familiar", 6 etapas
- [x] Feminicidio (Art. 108-B CP) — 2026-04-07: clave "penal_feminicidio", 6 etapas
- [x] Violación sexual (Art. 170 CP) — 2026-04-07: clave "penal_violacion", 7 etapas
- [x] Homicidio (Art. 106-109 CP) — 2026-04-07: clave "penal_homicidio", 7 etapas
- [ ] Revisión/corrección con normativa real (pendiente documentos)

### 3.3 Procesos Civiles/Familia ✅ (estructura inicial completa)
- [x] Proceso laboral — clave "laboral"
- [x] Alimentos — clave "familia_alimentos"
- [x] Desalojo — clave "civil_desalojo"
- [x] Divorcio — 2026-04-07: clave "familia_divorcio", 7 etapas
- [x] Tenencia y régimen de visitas — 2026-04-07: clave "familia_tenencia", 5 etapas
- [x] Sucesiones — 2026-04-07: clave "civil_sucesiones", 6 etapas
- [ ] Revisión/corrección con normativa real (pendiente documentos)

### 3.4 Calculadora de Plazos ✅
- [x] Crear feriados_peru.json (2026-04-07)
- [x] Función calcular_dias_habiles() (2026-04-07)
- [x] Endpoint POST /api/calcular-plazo, GET /api/feriados (2026-04-07)
- [x] Integrar en dashboard (2026-04-07: /dashboard/calculadora)
- [x] Alertas automáticas de plazos (2026-04-12: enviar_alertas_plazos() — cron 8:05 AM, alerta 1/3/7 días hábiles antes de proxima_fecha, WhatsApp al abogado del caso)

### 3.5 RAG Legal — Retrieval Augmented Generation
> Depende de tener la normativa cargada (3.1)
- [x] Instalar ChromaDB + sentence-transformers en backend (2026-04-12)
- [x] Procesar y chunkar documentos de normativa (2026-04-12: 3,830 arts tras dedup)
- [x] Crear embeddings y cargar en ChromaDB (2026-04-12: scripts/index_normativa.py — paraphrase-multilingual-MiniLM-L12-v2)
- [x] Integrar búsqueda semántica en Claude prompts (2026-04-12: agent/rag.py + brain.py — top-5 arts inyectados en system prompt)
- [x] Citar artículos/fuentes en respuestas del bot (2026-04-12: formatear_para_prompt() con citacion + texto truncado a 400 chars)

### 3.6 Scraping — Actualización Automática de Normativa
> Necesario para mantener vigencia ante cambios legislativos
> Fuentes prioritarias: El Peruano (normas nuevas) y SPIJ (texto vigente consolidado)
- [ ] Definir estrategia: ¿SPIJ API oficial vs scraping web?
- [ ] Scraper El Peruano — normas nuevas publicadas
- [ ] Scraper SPIJ — versión vigente de cada código
- [ ] Scraper Poder Judicial — jurisprudencia (fase posterior)
- [ ] Pipeline: scraping → procesamiento → actualización ChromaDB automática

---

## 🎯 Fase 3.5: Preparar para Prueba con Abogados (Q4 2026)

> **Objetivo**: Hacer el sistema lo suficientemente realista para que un abogado lo pruebe con casos reales.

### 3.5.1 Registro de Cuentas
- [ ] Crear endpoint `POST /auth/register` en backend FastAPI
- [ ] Crear página `app/registro/page.tsx` en frontend
- [ ] Flujo: email + password + datos del abogado (nombre, colegiatura)
- [ ] Validación de email + password seguro
- [ ] Email de confirmación (opcional, puede ser manual al inicio)

### 3.5.2 Almacenamiento de Documentos
- [ ] Definir proveedor de cloud storage (S3/GCS/Cloudflare R2)
- [ ] Crear endpoints backend para upload/download de archivos
- [ ] Vincular documentos a casos (tabla documentos_caso)
- [ ] Límites de almacenamiento por plan
- [ ] Visor de documentos en el detalle del caso

### 3.5.3 Integración con Sistemas Externos
- [ ] Google Drive: OAuth 2.0 + API de Google Drive
- [ ] Importar documentos desde Google Drive al caso
- [ ] (Futuro) Conexión con sistemas propios de estudios de abogados

### 3.5.4 Protección de Datos
- [ ] Cumplimiento Ley N° 29733 (Protección de Datos Personales, Perú)
- [ ] Política de privacidad en la plataforma
- [ ] Consentimiento informado de clientes
- [ ] Encriptación de datos sensibles en reposo
- [ ] Secreto profesional del abogado: segregación de datos por estudio
- [ ] Términos y condiciones de uso

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
├── Abr: Fase 1 (MVP consolidado) ✅
│   ├── Frontend Next.js funcionando + Deploy Vercel
│   ├── Auth integrado en backend + Deploy Railway
│   └── Upload de documentos .docx para crear casos
│
├── Abr-May: Fase 2 (Plataforma abogado) ✅
│   ├── Modelo abogado/estudio + CRUD
│   ├── Calendario inteligente con alertas
│   └── Métricas dashboard + reportes PDF
│
├── Abr: Fase 3 (Knowledge base) ✅
│   ├── 16 procesos legales + 10 delitos documentados
│   ├── RAG con ChromaDB (3,830 artículos)
│   └── Calculadora de plazos + alertas automáticas
│
├── [AHORA] Fase 3.5 (Prueba con abogados)
│   ├── Registro de cuentas (backend + frontend)
│   ├── Almacenamiento de documentos (cloud storage)
│   ├── Protección de datos (Ley 29733)
│   └── Integración Google Drive (futuro)
│
2027
├── Q1: Fase 4 (Multi-tenant + monetización)
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
