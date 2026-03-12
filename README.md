# 🎯 MCCOP - Mesa de Control Comercial de Oportunidades Públicas

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Vue 3](https://img.shields.io/badge/Vue-3-green)](https://vuejs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org/)

> **Transforma el ruido de Mercado Público en decisiones comerciales inteligentes.**

MCCOP es una herramienta de inteligencia comercial que convierte miles de licitaciones públicas chilenas en una bandeja priorizada de oportunidades relevantes, permitiendo a las empresas tomar decisiones rápidas y contextualizadas.

---

## 🌟 Características Principales

### 🔍 **Sincronización Inteligente**
- **SmartSync**: Ingesta automática de licitaciones activas filtradas por rubro TI
- Integración completa con la API oficial de Mercado Público
- Manejo inteligente de rate limits y errores

### 🎯 **Motor de Scoring Avanzado**
- **Algoritmo contextual** que distingue entre "desarrollo de software" y "desarrollo comunitario"
- **23+ exclusiones automáticas** para eliminar falsos positivos (medicamentos, construcción, etc.)
- Scoring basado en **keywords personalizables** con pesos configurables
- Filtros por **rango de montos** (mínimo/máximo)

### 📊 **Dashboard Inteligente**
- Licitaciones ordenadas por **relevancia (score)**
- **Tooltips explicativos** para transparencia del scoring
- Acciones rápidas: **Postular** / **Mirar luego** / **Descartar**
- Visualización de **keywords coincidentes** en cada oportunidad
- **Calculadora automática de garantías** según normativa ChileCompra

### 🔐 **Seguridad & Multi-tenancy**
- **Row-Level Security (RLS)** en Supabase
- Autenticación completa con Supabase Auth
- Arquitectura preparada para múltiples usuarios/empresas

---

## 🛠️ Stack Tecnológico

### Frontend
- **Vue 3** (Composition API) + **Vite** 5.2
- **TypeScript** 5.2 (strict mode)
- **Tailwind CSS** 3.4 + Autoprefixer
- **Pinia** (state management)
- **Vue Router** 4 (con guards)
- **HeroIcons** para iconografía

### Backend
- **Node.js** + **Express** 5.2
- **TypeScript** 5.9 (strict mode)
- **PostgreSQL** (via Supabase)
- **Axios** para API Mercado Público
- **Zod** para validación

### Infraestructura
- **Supabase** (Database + Auth + RLS)
- **Mercado Público API** (licitaciones públicas de Chile)

---

## 📦 Instalación

### Prerrequisitos
- Node.js 20+
- npm o bun
- Cuenta de Supabase (gratuita)
- Ticket de API Mercado Público ([solicitar aquí](https://api.mercadopublico.cl/))

### 1. Clonar el repositorio
```bash
git clone https://github.com/RockHarr/MCCOP.git
cd MCCOP
```

### 2. Configurar Backend

```bash
cd backend
npm install

# Copiar variables de entorno
cp .env.example .env
```

Editar `.env` con tus credenciales:
```env
PORT=3000
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
MERCADO_PUBLICO_TICKET=tu_ticket_api
```

**Crear base de datos en Supabase:**
```bash
# Ejecutar en el SQL Editor de Supabase:
# 1. backend/supabase/schema.sql
# 2. backend/supabase/rls_policies.sql
```

### 3. Configurar Frontend

```bash
cd ../frontend
npm install

# Copiar variables de entorno
cp .env.example .env
```

Editar `.env`:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

### 4. Ejecutar el proyecto

**Backend** (terminal 1):
```bash
cd backend
npm run dev
```

**Frontend** (terminal 2):
```bash
cd frontend
npm run dev
```

La aplicación estará disponible en `http://localhost:5174`

---

## 🚀 Uso

### Primera vez

1. **Registrar usuario** en `/login`
2. **Configurar perfil** en `/settings`:
   - Nombre de empresa
   - Rango de montos objetivo (mínimo/máximo)
   - Keywords positivas (software, desarrollo, cloud, etc.)
   - Keywords negativas (construcción, medicamentos, etc.)

3. **Ejecutar sincronización inteligente** (desde backend):
```bash
npm run script:smartsync  # Descarga licitaciones TI activas (20 por defecto)
npm run script:scoring     # Evalúa oportunidades contra tu perfil
```

4. **Revisar bandeja** en `/` - Las oportunidades aparecerán ordenadas por score

### Uso diario

```bash
# Opción 1: SmartSync (recomendado - solo TI)
npm run script:smartsync && npm run script:scoring

# Opción 2: Ingesta por fecha
npm run script:ingestion && npm run script:scoring

# Opción 3: Sincronización completa (todas las activas, tarda ~30min)
npm run script:fullsync && npm run script:scoring
```

---

## 📁 Arquitectura del Proyecto

```
MCCOP/
├── backend/
│   ├── src/
│   │   ├── services/
│   │   │   ├── ingestion.ts      # Ingesta desde MP API
│   │   │   └── scoring.ts        # Motor de scoring contextual
│   │   ├── scripts/
│   │   │   ├── runSmartSync.ts   # 🆕 Sync inteligente por keywords
│   │   │   ├── runIngestion.ts   # Sync por fecha
│   │   │   ├── runFullSync.ts    # Sync completo
│   │   │   └── runScoring.ts     # Ejecutor de scoring
│   │   ├── lib/
│   │   │   ├── mercadoPublico.ts # Cliente API MP
│   │   │   └── supabase.ts       # Cliente Supabase (admin)
│   │   └── types/
│   │       └── index.ts          # Tipos TypeScript
│   └── supabase/
│       ├── schema.sql            # Estructura de BD
│       └── rls_policies.sql      # Políticas de seguridad
│
└── frontend/
    ├── src/
    │   ├── views/
    │   │   ├── DashboardView.vue    # Bandeja de oportunidades
    │   │   ├── SettingsView.vue     # Configuración con tabs
    │   │   └── LoginView.vue        # Autenticación
    │   ├── components/
    │   │   └── layout/
    │   │       └── AppLayout.vue    # Layout con header + sidebar
    │   ├── stores/
    │   │   └── auth.ts              # Estado de autenticación
    │   └── router/
    │       └── index.ts             # Rutas + guards
```

---

## 🎨 Capturas de Pantalla

### Dashboard - Bandeja de Oportunidades
Licitaciones ordenadas por relevancia con tooltips explicativos y acciones rápidas.

### Configuración - Perfil de Negocio
Gestión de montos objetivo con calculadora automática de garantías según normativa chilena.

### Configuración - Keywords
Interfaz visual para administrar palabras clave positivas y negativas con sugerencias pre-configuradas.

---

## 🗺️ Roadmap / Futuras Mejoras

### 🔥 Corto Plazo (v0.3.0)
- [ ] **Automatización con Cron Jobs**
  - Ingesta automática diaria (cron: 8:00 AM)
  - Scoring automático post-ingesta
  - Notificaciones por email de nuevas oportunidades
  
- [ ] **Filtros Avanzados en Dashboard**
  - Filtro por organismo comprador
  - Filtro por región
  - Filtro por fecha de cierre
  - Búsqueda por texto libre

- [ ] **Exportación de Datos**
  - Exportar oportunidades a Excel/CSV
  - Generar reportes PDF con oportunidades seleccionadas
  
- [ ] **Mejoras en Scoring**
  - Machine Learning para ajuste automático de pesos
  - Análisis de histórico de decisiones del usuario
  - Scoring predictivo basado en éxito histórico

### 🚀 Mediano Plazo (v0.4.0)
- [ ] **Multi-perfil**
  - Soporte para múltiples perfiles de negocio por usuario
  - Cambio rápido entre perfiles
  
- [ ] **Colaboración en Equipo**
  - Invitar colaboradores a la cuenta
  - Comentarios y notas compartidas
  - Asignación de oportunidades a miembros del equipo
  
- [ ] **Integraciones**
  - Slack: Notificaciones de nuevas oportunidades
  - Google Calendar: Agregar deadlines automáticamente
  - Trello/Notion: Exportar oportunidades como tareas

- [ ] **Dashboard de Analíticas**
  - Métricas de oportunidades revisadas vs postuladas
  - Gráficos de tendencias por tipo de licitación
  - Análisis de competidores (organismos frecuentes)

### 🌟 Largo Plazo (v1.0.0)
- [ ] **Mobile App** (React Native o Flutter)
  - Notificaciones push de oportunidades críticas
  - Acceso offline a bandeja descargada
  
- [ ] **IA Generativa**
  - Asistente IA para redactar propuestas
  - Generación automática de presupuestos base
  - Análisis de riesgo de licitación
  
- [ ] **Marketplace de Servicios**
  - Conectar con proveedores de garantías
  - Integración con plataformas de firma electrónica
  - Acceso a consultores especializados

- [ ] **API Pública**
  - Webhooks para integraciones custom
  - SDK para desarrolladores
  - Documentación OpenAPI

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una branch para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: amazing feature'`)
4. Push a la branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Convenciones de Commits
- `Add:` nuevas características
- `Fix:` corrección de bugs
- `Update:` mejoras a features existentes
- `Refactor:` cambios de código sin afectar funcionalidad
- `Docs:` cambios en documentación

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

---

## 👨‍💻 Autor

**Rockwell Harrison**
- GitHub: [@RockHarr](https://github.com/RockHarr)

---

## 🙏 Agradecimientos

- **Mercado Público Chile** por proporcionar API pública
- **Supabase** por la infraestructura BaaS
- **Vue.js & TypeScript** communities
- **Claude Sonnet 4.5** por asistencia en desarrollo (pair programming)

---

## 📞 Soporte

- **Issues**: [GitHub Issues](https://github.com/RockHarr/MCCOP/issues)
- **Documentación**: [Wiki del proyecto](https://github.com/RockHarr/MCCOP/wiki)
- **Email**: rockwell.harrison@gmail.com

---

<p align="center">
  Hecho con ❤️ en Chile 🇨🇱<br>
  <sub>Transformando licitaciones públicas en oportunidades de negocio</sub>
</p>
