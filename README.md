# CobroFlow

Sistema de gestión de cobranzas con IA integrada. Permite automatizar campañas de cobro multicanal (WhatsApp, SMS, email) con perfiles de deudores generados por IA, conversaciones en lenguaje natural y análisis en tiempo real.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | FastAPI 0.109+, Python 3.12, SQLAlchemy 2, Alembic, pgvector |
| Frontend | Angular 21, Tailwind CSS v4, Lucide Angular |
| Base de datos | PostgreSQL 15 (Supabase en desarrollo) |
| IA | Vertex AI — Gemini 2.0 Flash / 2.5 Pro, text-embedding-005 |
| Mensajería | Twilio (WhatsApp/SMS), SendGrid (email) |
| Cloud | GCP — Cloud Run, Cloud SQL, Cloud Tasks, Cloud Storage |
| Auth | JWT (python-jose), bcrypt |

---

## Estructura del monorepo

```
CobroFlow/
├── cobro-flow-backend/        # API REST (FastAPI)
│   ├── app/
│   │   ├── api/v1/endpoints/  # auth, clients, campaigns, ai_agent, dashboard...
│   │   ├── crud/              # acceso a BD por módulo
│   │   ├── models/            # SQLAlchemy ORM
│   │   ├── schemas/           # Pydantic request/response
│   │   ├── services/          # vertex_ai, vector_search, twilio, sendgrid
│   │   ├── workers/           # message_worker, campaign_worker
│   │   └── core/              # config, security
│   ├── alembic/               # migraciones de BD
│   ├── scripts/               # reset_and_seed, send_first_message
│   ├── .env.example
│   └── requirements.txt
├── cobro-flow-frontend/       # SPA Angular
│   └── src/app/
│       ├── core/              # guards, interceptors, servicios base
│       └── features/          # agente-ia, campaigns, clients, dashboard...
├── start.sh                   # levanta backend + frontend en paralelo
└── README.md
```

---

## Requisitos previos

- Python 3.12+
- Node.js 20+
- PostgreSQL 15 (o cuenta de Supabase)
- Cuenta de Google Cloud con Vertex AI habilitado
- (Opcional) Twilio y SendGrid para mensajería real

---

## Levantar el backend

```bash
cd cobro-flow-backend

# Crear entorno virtual
python -m venv venv

# Activar (Windows)
venv\Scripts\activate
# Activar (Linux/Mac)
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales reales

# Ejecutar migraciones
alembic upgrade head

# Levantar servidor (dev)
uvicorn app.main:app --reload --port 8000
```

La API queda disponible en `http://localhost:8000`.  
Documentación interactiva: `http://localhost:8000/docs`

---

## Levantar el frontend

```bash
cd cobro-flow-frontend

npm install

# Desarrollo
ng serve
# O equivalente
npm start
```

La app queda en `http://localhost:4200`.

---

## Levantar todo junto

```bash
# Desde la raíz del monorepo
bash start.sh
```

---

## Variables de entorno (backend)

Copiá `.env.example` a `.env` y completá los valores. Las principales:

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Cadena de conexión PostgreSQL |
| `SECRET_KEY` | Clave para firmar JWT — cambiala en producción |
| `GCP_PROJECT_ID` | ID del proyecto en Google Cloud |
| `VERTEX_FLASH_MODEL` | Modelo Gemini para generación rápida |
| `VERTEX_PRO_MODEL` | Modelo Gemini para razonamiento complejo |
| `VERTEX_LOCAL_VECTOR_STORE` | `true` = embeddings en PostgreSQL, `false` = Vertex AI Vector Search |
| `AI_MOCK_MODE` | `true` = respuestas hardcodeadas sin llamar a Gemini (útil en dev) |
| `TWILIO_ACCOUNT_SID` | Credencial Twilio para WhatsApp/SMS |
| `SENDGRID_API_KEY` | Credencial SendGrid para email |
| `CLOUD_TASKS_QUEUE_MESSAGES` | Nombre de la cola de Cloud Tasks para mensajes |

---

## Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/auth/login` | Autenticación, retorna JWT |
| GET | `/api/v1/clients` | Listado de clientes (multi-tenant) |
| GET | `/api/v1/dashboard/summary` | KPIs, chart de cobros, efectividad por canal |
| POST | `/api/v1/campaigns` | Crear campaña de cobro |
| POST | `/api/v1/conversations/{id}/messages` | Enviar mensaje en conversación con IA |
| POST | `/api/v1/ai-training/documents` | Subir documentos para RAG |
| POST | `/api/v1/webhooks/twilio` | Webhook para replies de WhatsApp |

---

## Migraciones de base de datos

```bash
# Crear nueva migración
alembic revision --autogenerate -m "descripcion"

# Aplicar migraciones pendientes
alembic upgrade head

# Ver historial
alembic history
```

---

## Deploy en GCP

El proyecto usa Cloud Build + Cloud Run. El archivo `cloudbuild.yaml` en el backend contiene el pipeline completo.

```bash
# Desde cobro-flow-backend/
gcloud builds submit --config cloudbuild.yaml
```

---

## Arquitectura IA

- **Generación de mensajes:** `VertexAIGenerator.generate_campaign_message()` — personaliza el mensaje por deudor y canal.
- **Perfil de deudor:** `generate_debtor_profile()` — analiza historial y genera un perfil para el agente.
- **Conversación multi-turn:** `generate_conversation_response()` — responde en lenguaje natural con contexto de RAG.
- **RAG:** documentos procesados (PDF/DOCX/CSV) → chunks → embeddings → búsqueda semántica en cada respuesta.

---

## Notas de desarrollo

- El interceptor camelCase en el frontend transforma automáticamente `snake_case` de la API a `camelCase`.
- `AI_MOCK_MODE=true` evita costos de Vertex AI durante desarrollo local.
- Supabase free tier se pausa por inactividad — reactivar desde el dashboard si no conecta.
- Para testear webhooks de Twilio en local, usá ngrok apuntando a `/api/v1/webhooks/twilio`.
