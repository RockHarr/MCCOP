# CHANGELOG — MCCOP

Todos los cambios notables del proyecto siguen el formato [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

---

## [0.2.1] — 2026-03-12

### Añadido

- **🆕 SmartSync Script** (`runSmartSync.ts`): Sincronización inteligente que filtra licitaciones activas por keywords TI ANTES de descargar detalles
  - Procesa solo licitaciones relevantes (ahorro de tiempo y respeto de rate limits)
  - 30+ keywords de filtrado pre-configuradas para rubro informático
- **Motor de Scoring Contextual Mejorado**:
  - 23+ exclusiones contextuales automáticas para eliminar falsos positivos
  - Distingue entre "desarrollo de software" vs "desarrollo comunitario"
  - Matching de palabras completas (regex) en vez de subcadenas
  - Filtrado por contexto con máxima prioridad
- **Header Superior con Avatar**:
  - Avatar circular con iniciales del usuario (gradiente brand)
  - Menú dropdown con información de cuenta y logout
  - Botón de configuración visible en header
- **Configuración con Tabs**:
  - Tab "Perfil de Negocio" separado de "Palabras Clave"
  - Mejor organización visual y UX
  - Inputs con estados focus mejorados
- **Tooltips Explicativos en Dashboard**:
  - Banner informativo sobre el Score
  - Tooltip interactivo en cada badge de score
  - Visualización mejorada de keywords coincidentes con íconos
- **README Profesional**:
  - Badges de tecnologías
  - Instalación paso a paso
  - Roadmap completo con 20+ mejoras futuras
  - Arquitectura documentada
  - Screenshots placeholder

### Corregido

- Falsos positivos en scoring (ej: "medicamentos" ya no coincide con keywords de TI)
- Layout de configuración más organizado y menos caótico
- Mejora en accesibilidad con tooltips y explicaciones visuales

### Publicado

- **Repositorio GitHub**: https://github.com/RockHarr/MCCOP
- Commit inicial con 7254+ líneas de código
- Branch `main` configurado
- **Deployment a Vercel**:
  - Configuración automática con `vercel.json`
  - SPA routing para Vue Router
  - Variables de entorno configuradas (Supabase)
  - Build optimizado desde directorio `frontend`

---

## [0.2.0] — 2026-03-10

### Añadido

- **Frontend Vue 3 completo** con Vite, Tailwind CSS, Pinia y Vue Router
- **Sistema de autenticación** con Supabase Auth (Login → Bandeja, guards de ruta)
- **Bandeja de Oportunidades**: listado priorizado por score, con cards de información clave
- **Controles de decisión**: Postular / Mirar luego / Descartar — se reflejan en `user_decisions` y filtran la bandeja
- **Pantalla de Configuración de Perfil** con:
  - Editor de nombre y montos mínimo/máximo
  - **Calculadora de garantías automática** según normativa ChileCompra (UTM vigente):
    - Garantía de Fiel Cumplimiento: 10% si contrato > 1.000 UTM
    - Garantía de Seriedad de Oferta: 3% si contrato > 5.000 UTM
  - Gestión visual de keywords positivas y negativas (chip/tags)
  - **26 sugerencias de keywords para el rubro TI** (software, cloud, ciberseguridad, etc.)
  - 11 exclusiones recomendadas (construcción, maquinaria pesada, etc.)
- **RLS Policies** en Supabase para acceso seguro del frontend con `anon key`
- Archivo `supabase/rls_policies.sql` para aplicar en el proyecto
- Nuevo método `getLicitacionesActivas()` en cliente de MP (`estado=Publicada`)
- Script `runFullSync.ts` para sincronización completa del catálogo activo de MP

### Corregido

- Delay de peticiones de detalle a la API de Mercado Público: de 200ms → 1500ms para evitar error `10500 peticiones simultáneas`
- Instalación de dependencias faltantes en frontend (`@supabase/supabase-js`, `@heroicons/vue`)
- Creación del archivo `.env` en frontend (no se copiaba automáticamente desde `.env.example`)
- Error de Tailwind CSS al usar `hover:bg-brand-700` dentro de `@apply` en `@layer components`

---

## [0.1.0] — 2026-03-09

### Añadido

- **Inicialización del proyecto Backend** (Node.js + Express + TypeScript)
- **Esquema de base de datos** en Supabase (`supabase/schema.sql`):
  - Tablas: `business_profiles`, `keywords`, `opportunities`, `opportunity_matches`, `user_decisions`, `notes`, `ingestion_runs`
- **Cliente de API Mercado Público** con Axios e inyección automática de ticket
- **Servicio de Ingesta** (`IngestionService.runForDate`):
  - Consulta licitaciones por fecha de publicación
  - Normaliza datos y los almacena en `opportunities` (upsert)
  - Registra corridas en `ingestion_runs` para trazabilidad
- **Motor de Scoring** (`ScoringService.evaluateProfile`):
  - Evalúa oportunidades contra perfil de negocio
  - Aplica keywords negativas (descarte inmediato) y positivas (suma de pesos)
  - Guarda resultados en `opportunity_matches`
- Scripts de prueba local: `runIngestion.ts` y `runScoring.ts`
- Archivo `.env.example` con variables requeridas

### Notas técnicas

- Backend usa `SERVICE_ROLE_KEY` para bypassar RLS en operaciones de ingesta/scoring
- Frontend usa `ANON_KEY` con RLS para seguridad de datos
