# CobroFlow - Arquitectura GCP + Vertex AI

## Documento de Arquitectura Completa

> **Versión**: 1.0
> **Fecha**: 2026-02-16
> **Stack actual**: FastAPI + PostgreSQL + Angular
> **Stack objetivo**: GCP Cloud Run + Cloud SQL + Vertex AI + Cloud Tasks + Pub/Sub

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura General GCP](#2-arquitectura-general-gcp)
3. [Capa de Datos - Cloud SQL](#3-capa-de-datos---cloud-sql)
4. [Capa de Aplicacion - Cloud Run](#4-capa-de-aplicacion---cloud-run)
5. [Motor de IA Conversacional - Vertex AI Gemini](#5-motor-de-ia-conversacional---vertex-ai-gemini)
6. [RAG - Retrieval Augmented Generation](#6-rag---retrieval-augmented-generation)
7. [Motor de Campanas Automatizadas](#7-motor-de-campanas-automatizadas)
8. [Pipeline de Entrenamiento](#8-pipeline-de-entrenamiento)
9. [Integraciones de Canales](#9-integraciones-de-canales)
10. [Seguridad y Secrets](#10-seguridad-y-secrets)
11. [Observabilidad y Monitoreo](#11-observabilidad-y-monitoreo)
12. [Costos Estimados](#12-costos-estimados)
13. [Plan de Implementacion por Fases](#13-plan-de-implementacion-por-fases)
14. [Configuracion Paso a Paso](#14-configuracion-paso-a-paso)

---

## 1. Resumen Ejecutivo

CobroFlow es una plataforma SaaS de gestion de cobranzas con agentes IA conversacionales. La plataforma permite a organizaciones crear campanas de cobranza multi-canal (WhatsApp, Email, SMS, llamadas, AI Voice) con agentes IA que conversan autonomamente con deudores, analizan sentimiento, escalan a humanos cuando es necesario, y aprenden de documentos de entrenamiento.

### Estado Actual del Backend

- **26 tablas** PostgreSQL con modelo multi-tenant (organization_id)
- **28 tipos ENUM** PostgreSQL para estados, roles, canales, sentimientos
- **80+ endpoints** REST organizados en 6 modulos (Auth, Clients, Campaigns, Communications, AI Agent, Health)
- **Sin integraciones activas**: No hay conexion real a LLMs, proveedores de mensajeria, ni storage
- **Sin jobs en background**: No hay Celery, Redis, ni colas de trabajo
- **Sin vector DB**: El campo `embedding_id` existe pero no se usa

### Objetivo

Implementar la infraestructura GCP completa para que:
1. El agente IA converse en tiempo real con deudores usando Vertex AI Gemini
2. Las campanas se ejecuten automaticamente enviando mensajes personalizados por IA
3. Los documentos de entrenamiento se procesen y vectoricen para RAG
4. Todo corra en produccion con escalabilidad, seguridad y observabilidad

---

## 2. Arquitectura General GCP

```
                                    INTERNET
                                       |
                              Cloud Load Balancer
                               (HTTPS + SSL cert)
                                       |
                    +------------------+------------------+
                    |                                     |
              Cloud Run                             Cloud Run
            (FastAPI Backend)                    (Angular Frontend)
              Auto-scaling                        Static serving
                    |
        +-----------+-----------+------------------+
        |           |           |                  |
   Cloud SQL    Vertex AI    Cloud          Cloud Storage
  (PostgreSQL)  (Gemini +    Tasks/          (Documents,
   via Auth     Embeddings   Pub/Sub          PDFs, Audio)
    Proxy       + Vector    (Campaign
        |       Search)     Engine +
        |           |       Message Queue)
   Secret       Cloud               |
   Manager     Logging        +-----+------+
  (API keys,   (Structured    |            |
   DB creds)    logs)     Twilio API   SendGrid
                          (WhatsApp,    (Email)
                           SMS, Voice)
```

### Servicios GCP Utilizados

| Servicio | Proposito | Tier Recomendado |
|----------|-----------|------------------|
| **Cloud Run** | Backend FastAPI + Frontend Angular | Min 1 instancia, max 10 |
| **Cloud SQL** | PostgreSQL 15 | db-f1-micro (dev) / db-custom-2-8192 (prod) |
| **Vertex AI - Gemini** | Conversaciones IA, generacion de mensajes | Pay-per-use |
| **Vertex AI - Embeddings** | Vectorizacion de documentos | Pay-per-use |
| **Vertex AI - Vector Search** | Busqueda semantica RAG | 1 nodo minimo |
| **Cloud Tasks** | Cola de envio de mensajes y ejecucion de campanas | Gratuito hasta 1M/mes |
| **Cloud Pub/Sub** | Webhooks entrantes (respuestas deudores) | Gratuito hasta 10GB/mes |
| **Cloud Scheduler** | Cron jobs (evaluacion de campanas, analytics) | $0.10/job/mes |
| **Cloud Storage** | Documentos training, archivos facturas, audio | Standard tier |
| **Secret Manager** | API keys, credenciales DB, JWT secret | $0.06/10K accesos |
| **Cloud Logging** | Logs estructurados del backend | 50GB gratis/mes |
| **Cloud Monitoring** | Metricas, alertas, dashboards | Gratis con GCP |
| **Artifact Registry** | Docker images del backend | Standard tier |
| **Cloud Build** | CI/CD pipeline | 120 min gratis/dia |

---

## 3. Capa de Datos - Cloud SQL

### 3.1 Instancia Cloud SQL

```
Proyecto GCP: cobroflow-prod
Region: southamerica-east1 (Buenos Aires)
Instancia: cobroflow-db-prod

Configuracion Desarrollo:
  - Tier: db-f1-micro (1 vCPU, 614 MB RAM)
  - Storage: 10 GB SSD (auto-expand)
  - PostgreSQL: 15.x
  - Backups: Diarios automaticos, retencion 7 dias
  - Alta disponibilidad: No (dev)

Configuracion Produccion:
  - Tier: db-custom-2-8192 (2 vCPU, 8 GB RAM)
  - Storage: 50 GB SSD (auto-expand, max 500 GB)
  - PostgreSQL: 15.x
  - Backups: Diarios automaticos, retencion 30 dias
  - Alta disponibilidad: Si (failover replica)
  - Maintenance window: Domingos 03:00 AM ART
  - Read replicas: 1 (para analytics pesados)
```

### 3.2 Esquema de Base de Datos Completo

#### Modulo Core (2 tablas)

```sql
-- organizations: Multi-tenant root
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    cuit VARCHAR(20),
    industry_type industry_type_enum,     -- retail|services|manufacturing|healthcare|education|technology|finance|real_estate|hospitality|other
    company_size company_size_enum,       -- micro|small|medium|large|enterprise
    monthly_collection_volume INTEGER,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- users: Autenticacion y autorizacion
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    role user_role_enum DEFAULT 'agent',  -- admin|agent|viewer
    auth_id VARCHAR(255),                 -- Para auth providers externos
    hashed_password VARCHAR(255),         -- bcrypt hash
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### Modulo Financiero (4 tablas)

```sql
-- debtors: Clientes/Deudores
CREATE TABLE debtors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    erp_id VARCHAR(100),                  -- ID externo de ERP (SAP, QuickBooks)
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    tax_id VARCHAR(50),                   -- CUIT/RFC del deudor
    risk_score INTEGER,                   -- Score 0-100
    tags TEXT[],                          -- Segmentacion: ['VIP', 'Retail']
    ai_profile_summary TEXT,              -- Resumen generado por IA del comportamiento
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- invoices: Facturas pendientes
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    debtor_id UUID REFERENCES debtors(id) NOT NULL,
    invoice_number VARCHAR(100) NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    amount NUMERIC(15,2) NOT NULL,        -- Monto original
    balance NUMERIC(15,2) NOT NULL,       -- Saldo pendiente
    currency VARCHAR(3) DEFAULT 'ARS',
    status invoice_status_enum DEFAULT 'pending',  -- pending|paid|overdue|cancelled|disputed
    file_url TEXT,                         -- URL al PDF en Cloud Storage
    erp_metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- payments: Pagos recibidos
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    debtor_id UUID REFERENCES debtors(id) NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    method VARCHAR(50),                   -- Transferencia, Cheque, etc.
    reference_number VARCHAR(100),
    proof_file_url TEXT,                  -- URL al comprobante en Cloud Storage
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- payment_allocations: Imputacion de pagos a facturas
CREATE TABLE payment_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES payments(id) NOT NULL,
    invoice_id UUID REFERENCES invoices(id) NOT NULL,
    amount_allocated NUMERIC(15,2) NOT NULL
);
```

#### Modulo Campanas (3 tablas)

```sql
-- campaigns: Campanas de cobranza
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    campaign_type campaign_type_enum,     -- preventive|friendly|assertive|legal
    is_active BOOLEAN DEFAULT true,
    strategy_config JSONB,                -- Filtros de audiencia, scheduling, config IA
    workflow_id UUID REFERENCES collection_workflows(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- strategy_config JSONB estructura esperada:
-- {
--   "audience": {
--     "min_days_overdue": 1,
--     "max_days_overdue": 30,
--     "min_debt_amount": 1000,
--     "tags": ["retail"],
--     "risk_score_min": 0,
--     "risk_score_max": 100
--   },
--   "schedule": {
--     "start_date": "2026-03-01",
--     "end_date": "2026-06-30",
--     "active_days": [1,2,3,4,5],
--     "active_hours": {"start": "09:00", "end": "18:00"},
--     "timezone": "America/Argentina/Buenos_Aires"
--   },
--   "ai_settings": {
--     "enabled": true,
--     "model": "gemini-2.0-flash",
--     "personalize_messages": true
--   }
-- }

-- campaign_stages: Etapas de escalamiento por dias
CREATE TABLE campaign_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) NOT NULL,
    name VARCHAR(100) NOT NULL,           -- "Primer Aviso", "Escalamiento", etc.
    day_start INTEGER NOT NULL,           -- Dia inicio (desde vencimiento)
    day_end INTEGER NOT NULL,             -- Dia fin
    tone_instructions TEXT,               -- Instrucciones de tono para IA en esta etapa
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- stage_actions: Acciones especificas por canal
CREATE TABLE stage_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_id UUID REFERENCES campaign_stages(id) NOT NULL,
    channel channel_type_enum NOT NULL,   -- whatsapp|email|sms|call|ai_voice
    trigger_day INTEGER NOT NULL,         -- Dia exacto para disparar
    template_id UUID REFERENCES message_templates(id),
    ai_enabled BOOLEAN DEFAULT false,     -- Si true, Gemini personaliza el mensaje
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### Modulo Comunicaciones (5 tablas)

```sql
-- message_templates: Templates reutilizables
CREATE TABLE message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    channel channel_type_enum NOT NULL,
    subject VARCHAR(500),                 -- Solo para email
    body TEXT NOT NULL,                   -- Cuerpo con variables {{debtor_name}}
    variables TEXT[],                     -- ['debtor_name', 'invoice_number', 'balance']
    status template_status_enum DEFAULT 'draft',  -- draft|active|archived
    language VARCHAR(5) DEFAULT 'es',
    times_used INTEGER DEFAULT 0,
    open_rate NUMERIC(5,2),
    click_rate NUMERIC(5,2),
    reply_rate NUMERIC(5,2),
    conversion_rate NUMERIC(5,2),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- collection_workflows: Flujos de trabajo condicionales
CREATE TABLE collection_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status workflow_status_enum DEFAULT 'draft',  -- draft|active|paused|archived
    trigger_description VARCHAR(500),
    settings JSONB,
    total_executions INTEGER DEFAULT 0,
    success_rate NUMERIC(5,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- workflow_steps: Pasos condicionales del workflow
CREATE TABLE workflow_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES collection_workflows(id) NOT NULL,
    step_order INTEGER NOT NULL,          -- UNIQUE con workflow_id
    name VARCHAR(255) NOT NULL,
    channel channel_type_enum NOT NULL,
    template_id UUID REFERENCES message_templates(id),
    delay_days INTEGER DEFAULT 0,
    delay_hours INTEGER DEFAULT 0,
    send_time VARCHAR(5),                 -- "09:00" HH:MM
    condition_type step_condition_type_enum DEFAULT 'none',
    -- Condiciones: none|previous_not_opened|previous_not_replied|previous_bounced|invoice_still_unpaid
    fallback_channel VARCHAR(20),
    ai_enabled BOOLEAN DEFAULT false,
    ai_instructions TEXT,                 -- Instrucciones especificas para Gemini
    config JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- communication_logs: Registro de toda comunicacion
CREATE TABLE communication_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    debtor_id UUID REFERENCES debtors(id) NOT NULL,
    invoice_id UUID REFERENCES invoices(id),
    campaign_id UUID REFERENCES campaigns(id),
    workflow_id UUID REFERENCES collection_workflows(id),
    workflow_step_id UUID REFERENCES workflow_steps(id),
    template_id UUID REFERENCES message_templates(id),
    sent_by_user_id UUID REFERENCES users(id),
    channel channel_type_enum NOT NULL,
    direction comm_direction_enum DEFAULT 'outbound',  -- outbound|inbound
    status comm_status_enum DEFAULT 'scheduled',
    -- Status flow: scheduled -> queued -> sending -> sent -> delivered -> opened/clicked/replied
    --                                                    -> failed/bounced
    subject VARCHAR(500),
    body TEXT,
    recipient_address VARCHAR(255),       -- Email, telefono, WhatsApp ID
    external_message_id VARCHAR(500),     -- ID del proveedor (Twilio SID, SendGrid ID)
    provider VARCHAR(50),                 -- twilio, sendgrid, etc.
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    response_body TEXT,                   -- Respuesta del deudor
    call_duration_seconds INTEGER,
    call_outcome VARCHAR(50),
    error_message TEXT,
    error_code VARCHAR(50),
    cost NUMERIC(10,4),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices criticos para performance
CREATE INDEX idx_comm_logs_org_created ON communication_logs(organization_id, created_at DESC);
CREATE INDEX idx_comm_logs_debtor ON communication_logs(debtor_id);
CREATE INDEX idx_comm_logs_campaign ON communication_logs(campaign_id);
CREATE INDEX idx_comm_logs_channel_status ON communication_logs(channel, status);

-- communication_events: Eventos del ciclo de vida
CREATE TABLE communication_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    communication_log_id UUID REFERENCES communication_logs(id) NOT NULL,
    event_type comm_event_type_enum NOT NULL,
    -- scheduled|queued|sent|delivered|opened|clicked|replied|bounced|failed
    -- |unsubscribed|complained|payment_promise|payment_made|escalated|cancelled
    occurred_at TIMESTAMPTZ NOT NULL,
    data JSONB,                           -- Datos especificos del evento
    source VARCHAR(100)                   -- webhook, polling, manual, system
);
```

#### Modulo AI Agent (12 tablas)

```sql
-- ai_agent_configs: Configuracion IA por organizacion (1:1)
CREATE TABLE ai_agent_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) UNIQUE NOT NULL,
    name VARCHAR(255) DEFAULT 'Agente IA CobroFlow',
    status agent_status_enum DEFAULT 'paused',      -- active|paused|training|error
    model_provider VARCHAR(50) DEFAULT 'vertex_ai',  -- CAMBIAR de 'openai' a 'vertex_ai'
    model_name VARCHAR(100) DEFAULT 'gemini-2.0-flash',  -- CAMBIAR de 'gpt-4o'
    temperature FLOAT DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 2048,
    auto_respond BOOLEAN DEFAULT true,
    require_approval BOOLEAN DEFAULT false,
    max_retries INTEGER DEFAULT 3,
    retry_delay_minutes INTEGER DEFAULT 30,
    settings JSONB,
    -- settings JSONB estructura:
    -- {
    --   "vertex_project": "cobroflow-prod",
    --   "vertex_location": "us-central1",
    --   "vector_search_index": "projects/xxx/locations/xxx/indexes/xxx",
    --   "vector_search_endpoint": "projects/xxx/locations/xxx/indexEndpoints/xxx",
    --   "safety_settings": {...},
    --   "grounding_config": {...}
    -- }
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ai_agent_personalities: Personalidad y comportamiento
CREATE TABLE ai_agent_personalities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_config_id UUID REFERENCES ai_agent_configs(id) UNIQUE NOT NULL,
    tone agent_tone_enum DEFAULT 'professional',  -- professional|friendly|firm|empathetic
    greeting_template TEXT,
    farewell_template TEXT,
    system_prompt TEXT,                    -- System prompt completo para Gemini
    language VARCHAR(5) DEFAULT 'es',
    formality_level INTEGER DEFAULT 3,    -- 1 (informal) a 5 (muy formal)
    empathy_level INTEGER DEFAULT 3,      -- 1 (directo) a 5 (muy empatico)
    forbidden_topics TEXT[],              -- Temas prohibidos
    custom_instructions TEXT,             -- Instrucciones adicionales
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ai_conversations: Conversaciones activas deudor <-> agente
CREATE TABLE ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    debtor_id UUID REFERENCES debtors(id) NOT NULL,
    agent_config_id UUID REFERENCES ai_agent_configs(id) NOT NULL,
    channel channel_type_enum NOT NULL,
    status conversation_status_enum DEFAULT 'active',  -- active|resolved|escalated|expired
    overall_sentiment message_sentiment_enum,           -- positive|neutral|negative
    escalated_to_user_id UUID REFERENCES users(id),
    escalation_reason escalation_reason_enum,
    resolution_summary TEXT,
    total_messages INTEGER DEFAULT 0,
    first_response_time_ms INTEGER,
    resolution_time_ms INTEGER,
    metadata JSONB,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_conv_org_status ON ai_conversations(organization_id, status);
CREATE INDEX idx_ai_conv_org_debtor ON ai_conversations(organization_id, debtor_id);
CREATE INDEX idx_ai_conv_org_created ON ai_conversations(organization_id, created_at DESC);

-- ai_conversation_messages: Mensajes individuales
CREATE TABLE ai_conversation_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES ai_conversations(id) NOT NULL,
    role message_role_enum NOT NULL,      -- agent|client|system
    content TEXT NOT NULL,
    sentiment message_sentiment_enum,     -- positive|neutral|negative
    confidence_score FLOAT,               -- 0.0 a 1.0
    tokens_used INTEGER,
    cost NUMERIC(10,6),
    metadata JSONB,
    -- metadata JSONB estructura:
    -- {
    --   "model_used": "gemini-2.0-flash",
    --   "rag_sources": ["doc_id_1", "doc_id_2"],
    --   "rag_scores": [0.95, 0.87],
    --   "safety_ratings": {...},
    --   "grounding_metadata": {...},
    --   "intent_detected": "payment_inquiry",
    --   "entities_extracted": {"amount": 15000, "date": "2026-03-01"}
    -- }
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_msg_conv_created ON ai_conversation_messages(conversation_id, created_at);

-- ai_training_documents: Base de conocimiento
CREATE TABLE ai_training_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    agent_config_id UUID REFERENCES ai_agent_configs(id) NOT NULL,
    name VARCHAR(500) NOT NULL,
    file_path VARCHAR(1000),              -- gs://cobroflow-training-docs/org_id/filename
    file_type VARCHAR(50),                -- pdf, docx, txt, csv, xlsx, json
    file_size_bytes INTEGER,
    content_text TEXT,                     -- Texto extraido (plain text o via Document AI)
    embedding_id VARCHAR(500),            -- ID en Vertex AI Vector Search
    status training_doc_status_enum DEFAULT 'pending',  -- pending|processing|processed|failed
    chunk_count INTEGER DEFAULT 0,
    error_message TEXT,
    uploaded_by_user_id UUID REFERENCES users(id),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_docs_org_status ON ai_training_documents(organization_id, status);

-- ai_business_rules: Reglas de negocio para el agente
CREATE TABLE ai_business_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    agent_config_id UUID REFERENCES ai_agent_configs(id) NOT NULL,
    rule_text TEXT NOT NULL,
    priority rule_priority_enum DEFAULT 'medium',  -- high|medium|low
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ai_conversation_examples: Ejemplos Q&A (few-shot learning)
CREATE TABLE ai_conversation_examples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    agent_config_id UUID REFERENCES ai_agent_configs(id) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100),                -- consulta_pago, reclamo, info_factura, etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ai_training_sessions: Sesiones de entrenamiento
CREATE TABLE ai_training_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    agent_config_id UUID REFERENCES ai_agent_configs(id) NOT NULL,
    status training_session_status_enum DEFAULT 'running',  -- running|completed|failed
    description TEXT,
    documents_processed INTEGER DEFAULT 0,
    rules_applied INTEGER DEFAULT 0,
    examples_added INTEGER DEFAULT 0,
    accuracy_before FLOAT,
    accuracy_after FLOAT,
    error_message TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ai_agent_analytics: Metricas diarias agregadas
CREATE TABLE ai_agent_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    channel channel_type_enum,
    total_conversations INTEGER DEFAULT 0,
    resolved_conversations INTEGER DEFAULT 0,
    escalated_conversations INTEGER DEFAULT 0,
    total_messages_sent INTEGER DEFAULT 0,
    total_messages_received INTEGER DEFAULT 0,
    avg_response_time_ms INTEGER,
    avg_resolution_time_ms INTEGER,
    positive_sentiment_count INTEGER DEFAULT 0,
    neutral_sentiment_count INTEGER DEFAULT 0,
    negative_sentiment_count INTEGER DEFAULT 0,
    payments_collected_count INTEGER DEFAULT 0,
    payments_collected_amount NUMERIC(15,2) DEFAULT 0,
    payment_promises_count INTEGER DEFAULT 0,
    total_tokens_used INTEGER DEFAULT 0,
    total_cost NUMERIC(10,4) DEFAULT 0,
    satisfaction_score FLOAT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, date, channel)
);

CREATE INDEX idx_ai_analytics_org_date ON ai_agent_analytics(organization_id, date DESC);

-- ai_agent_escalation_rules: Reglas de escalamiento
CREATE TABLE ai_agent_escalation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_config_id UUID REFERENCES ai_agent_configs(id) NOT NULL,
    reason escalation_reason_enum NOT NULL,
    condition_config JSONB,
    -- condition_config ejemplos:
    -- Para negative_sentiment:  {"threshold": 0.8, "consecutive_count": 2}
    -- Para high_debt:           {"min_amount": 500000, "currency": "ARS"}
    -- Para repeated_failure:    {"max_failed_promises": 3}
    -- Para agent_uncertainty:   {"confidence_threshold": 0.4}
    assign_to_user_id UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ai_agent_channel_configs: Configuracion por canal
CREATE TABLE ai_agent_channel_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_config_id UUID REFERENCES ai_agent_configs(id) NOT NULL,
    channel channel_type_enum NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    max_messages_per_conversation INTEGER DEFAULT 50,
    greeting_message TEXT,
    settings JSONB,
    -- settings JSONB por canal:
    -- WhatsApp: {"business_phone_id": "...", "waba_id": "...", "api_version": "v18.0"}
    -- Email:    {"from_email": "cobros@empresa.com", "from_name": "Cobranzas", "reply_to": "..."}
    -- SMS:      {"from_number": "+5411...", "max_segments": 3}
    -- Call:     {"from_number": "+5411...", "max_duration_seconds": 300, "voice": "es-AR-Wavenet-B"}
    -- AI Voice: {"tts_model": "es-AR-Wavenet-B", "stt_model": "chirp", "voice_agent_id": "..."}
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(agent_config_id, channel)
);

-- ai_agent_operating_hours: Horario de operacion
CREATE TABLE ai_agent_operating_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_config_id UUID REFERENCES ai_agent_configs(id) NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    is_active BOOLEAN DEFAULT true,
    start_time VARCHAR(5) DEFAULT '09:00',
    end_time VARCHAR(5) DEFAULT '18:00',
    timezone VARCHAR(50) DEFAULT 'America/Argentina/Buenos_Aires',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(agent_config_id, day_of_week)
);
```

### 3.3 Conexion desde Cloud Run

```python
# app/db/session.py - Configuracion para Cloud SQL con Auth Proxy

# Opcion A: Cloud SQL Auth Proxy (recomendado para Cloud Run)
# El proxy corre como sidecar en Cloud Run y expone un socket Unix
DATABASE_URL = "postgresql://user:pass@/dbname?host=/cloudsql/PROJECT:REGION:INSTANCE"

# Opcion B: IP privada con VPC Connector
DATABASE_URL = "postgresql://user:pass@PRIVATE_IP:5432/dbname"

# Pool settings para Cloud Run (conexiones efimeras)
engine = create_engine(
    DATABASE_URL,
    pool_size=5,          # Conexiones permanentes
    max_overflow=10,      # Conexiones extra bajo carga
    pool_recycle=1800,    # Reciclar conexiones cada 30 min
    pool_pre_ping=True,   # Verificar conexion antes de usar
    pool_timeout=30,      # Timeout para obtener conexion del pool
)
```

---

## 4. Capa de Aplicacion - Cloud Run

### 4.1 Estructura del Servicio Backend

```
cloud-run-backend/
├── Dockerfile
├── requirements.txt
├── app/
│   ├── main.py                    # FastAPI app
│   ├── core/
│   │   ├── config.py              # Settings (GCP env vars)
│   │   └── security.py            # JWT auth
│   ├── services/                   # NUEVO: Servicios de negocio
│   │   ├── vertex_ai.py           # Cliente Vertex AI Gemini
│   │   ├── vector_search.py       # RAG con Vector Search
│   │   ├── campaign_engine.py     # Orquestador de campanas
│   │   ├── message_sender.py      # Envio multi-canal
│   │   ├── training_pipeline.py   # Pipeline de entrenamiento
│   │   ├── sentiment_analyzer.py  # Analisis de sentimiento
│   │   ├── document_processor.py  # Procesamiento de docs
│   │   └── analytics_aggregator.py # Agregador de metricas
│   ├── workers/                    # NUEVO: Handlers de Cloud Tasks
│   │   ├── campaign_worker.py     # Procesa acciones de campana
│   │   ├── message_worker.py      # Envia mensajes individuales
│   │   ├── training_worker.py     # Procesa documentos
│   │   └── analytics_worker.py    # Agrega metricas diarias
│   ├── webhooks/                   # NUEVO: Webhooks entrantes
│   │   ├── twilio_webhook.py      # WhatsApp/SMS/Call inbound
│   │   ├── sendgrid_webhook.py    # Email events
│   │   └── pubsub_push.py        # Pub/Sub push handler
│   ├── api/v1/endpoints/          # Existente: REST endpoints
│   ├── models/                    # Existente: SQLAlchemy models
│   ├── crud/                      # Existente: CRUD operations
│   └── schemas/                   # Existente: Pydantic schemas
```

### 4.2 Dockerfile para Cloud Run

```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Instalar dependencias del sistema (para psycopg2)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Cloud Run usa PORT env var
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "2"]
```

### 4.3 Nuevas Dependencias (requirements.txt)

```
# --- Existentes ---
fastapi>=0.109.0
uvicorn[standard]>=0.27.0
pydantic>=2.5.0
pydantic-settings>=2.1.0
email-validator>=2.1.0
sqlalchemy>=2.0.0
psycopg2-binary>=2.9.9
alembic>=1.13.0
python-jose[cryptography]>=3.3.0
bcrypt>=4.0.0
python-dotenv>=1.0.0

# --- NUEVAS: GCP + Vertex AI ---
google-cloud-aiplatform>=1.60.0     # Vertex AI SDK (Gemini, Embeddings, Vector Search)
google-cloud-storage>=2.14.0        # Cloud Storage para documentos
google-cloud-tasks>=2.16.0          # Cloud Tasks para jobs asincrono
google-cloud-pubsub>=2.19.0         # Pub/Sub para webhooks
google-cloud-secret-manager>=2.18.0 # Secret Manager
google-cloud-logging>=3.9.0         # Cloud Logging estructurado
google-auth>=2.27.0                 # Auth para servicios GCP

# --- NUEVAS: Procesamiento ---
langchain-text-splitters>=0.0.1     # Chunking de documentos
tiktoken>=0.6.0                     # Conteo de tokens
python-multipart>=0.0.6             # Upload de archivos
aiohttp>=3.9.0                      # HTTP async para webhooks
```

### 4.4 Variables de Entorno para GCP

```bash
# === Aplicacion ===
APP_NAME=CobroFlow
APP_VERSION=1.0.0
DEBUG=false
API_V1_PREFIX=/api/v1

# === Base de Datos (Cloud SQL) ===
DB_HOST=/cloudsql/cobroflow-prod:southamerica-east1:cobroflow-db
DB_PORT=5432
DB_NAME=cobroflow
DB_USER=cobroflow-app
DB_PASSWORD=secret://projects/cobroflow-prod/secrets/db-password/versions/latest

# === Seguridad ===
SECRET_KEY=secret://projects/cobroflow-prod/secrets/jwt-secret/versions/latest
ACCESS_TOKEN_EXPIRE_MINUTES=60
ALGORITHM=HS256

# === GCP General ===
GCP_PROJECT_ID=cobroflow-prod
GCP_REGION=southamerica-east1
GCP_LOCATION_AI=us-central1          # Vertex AI no disponible en southamerica aun

# === Vertex AI ===
VERTEX_AI_MODEL=gemini-2.0-flash-001
VERTEX_AI_MODEL_PRO=gemini-2.5-pro-preview-06-05
VERTEX_AI_EMBEDDING_MODEL=text-embedding-005
VERTEX_AI_TEMPERATURE=0.7
VERTEX_AI_MAX_TOKENS=2048

# === Vector Search ===
VECTOR_SEARCH_INDEX_ENDPOINT=projects/cobroflow-prod/locations/us-central1/indexEndpoints/INDEX_EP_ID
VECTOR_SEARCH_INDEX_ID=INDEX_ID
VECTOR_SEARCH_DEPLOYED_INDEX_ID=DEPLOYED_INDEX_ID

# === Cloud Storage ===
GCS_BUCKET_TRAINING_DOCS=cobroflow-training-docs
GCS_BUCKET_INVOICES=cobroflow-invoices
GCS_BUCKET_AUDIO=cobroflow-audio

# === Cloud Tasks ===
CLOUD_TASKS_QUEUE_MESSAGES=projects/cobroflow-prod/locations/southamerica-east1/queues/message-sending
CLOUD_TASKS_QUEUE_CAMPAIGNS=projects/cobroflow-prod/locations/southamerica-east1/queues/campaign-execution
CLOUD_TASKS_QUEUE_TRAINING=projects/cobroflow-prod/locations/southamerica-east1/queues/training-pipeline
CLOUD_TASKS_SERVICE_URL=https://cobroflow-backend-xxxxx-uc.a.run.app

# === Proveedores de Mensajeria ===
TWILIO_ACCOUNT_SID=secret://projects/cobroflow-prod/secrets/twilio-sid/versions/latest
TWILIO_AUTH_TOKEN=secret://projects/cobroflow-prod/secrets/twilio-token/versions/latest
TWILIO_WHATSAPP_NUMBER=+14155238886
TWILIO_SMS_NUMBER=+5411XXXXXXXX
TWILIO_VOICE_NUMBER=+5411XXXXXXXX

SENDGRID_API_KEY=secret://projects/cobroflow-prod/secrets/sendgrid-key/versions/latest
SENDGRID_FROM_EMAIL=cobros@cobroflow.com

# === CORS ===
CORS_ORIGINS=["https://app.cobroflow.com"]
```

---

## 5. Motor de IA Conversacional - Vertex AI Gemini

### 5.1 Servicio Principal: `app/services/vertex_ai.py`

```python
"""
Servicio de IA conversacional usando Vertex AI Gemini.

Responsabilidades:
1. Generar respuestas del agente en conversaciones con deudores
2. Analizar sentimiento de mensajes entrantes
3. Detectar intenciones (pago, reclamo, consulta, etc.)
4. Generar mensajes personalizados para campanas
5. Generar resumen de perfil de deudor (ai_profile_summary)
"""

import vertexai
from vertexai.generative_models import GenerativeModel, Part, Content

# Inicializacion
vertexai.init(project=GCP_PROJECT_ID, location=GCP_LOCATION_AI)

# Modelos disponibles
MODELS = {
    "fast": GenerativeModel("gemini-2.0-flash-001"),     # Conversaciones rapidas
    "pro": GenerativeModel("gemini-2.5-pro-preview-06-05"),  # Casos complejos
}
```

### 5.2 Flujo de Conversacion Completo

```
MENSAJE ENTRANTE DEL DEUDOR
           |
           v
[1] RECIBIR MENSAJE
    - Webhook Twilio/Meta -> Pub/Sub -> Backend
    - Identificar deudor por telefono/email
    - Buscar o crear AIConversation
           |
           v
[2] VERIFICAR OPERACION
    - Horario de operacion activo?
    - Canal habilitado?
    - Agente en status=ACTIVE?
    - Max mensajes no excedido?
    - Si NO -> respuesta automatica "fuera de horario"
           |
           v
[3] CONSTRUIR CONTEXTO RAG
    - Buscar en Vector Search con el mensaje del deudor
    - Obtener top-K documentos relevantes (K=5)
    - Obtener reglas de negocio activas (ordenadas por sort_order)
    - Obtener ejemplos de conversacion activos (por categoria)
           |
           v
[4] CONSTRUIR PROMPT COMPLETO
    System Prompt:
    ┌──────────────────────────────────────────────────────┐
    │ IDENTIDAD:                                           │
    │ - Nombre: {agent_config.name}                        │
    │ - Tono: {personality.tone}                           │
    │ - Idioma: {personality.language}                      │
    │ - Formalidad: {personality.formality_level}/5         │
    │ - Empatia: {personality.empathy_level}/5              │
    │ - Instrucciones custom: {personality.custom_instructions}│
    │ - Temas prohibidos: {personality.forbidden_topics}    │
    │                                                      │
    │ CONTEXTO DEL DEUDOR:                                 │
    │ - Nombre: {debtor.name}                              │
    │ - Deuda total: ${sum(invoices.balance)}               │
    │ - Facturas vencidas: {overdue_count}                 │
    │ - Risk score: {debtor.risk_score}/100                │
    │ - Perfil IA: {debtor.ai_profile_summary}             │
    │ - Tags: {debtor.tags}                                │
    │ - Historial pagos: {recent_payments}                 │
    │                                                      │
    │ REGLAS DE NEGOCIO (OBLIGATORIAS):                    │
    │ 1. [HIGH] {rule_1.rule_text}                         │
    │ 2. [MEDIUM] {rule_2.rule_text}                       │
    │ 3. [LOW] {rule_3.rule_text}                          │
    │                                                      │
    │ DOCUMENTOS RELEVANTES (RAG):                         │
    │ [Doc: Politica de cobranza] {chunk_text_1}           │
    │ [Doc: Preguntas frecuentes] {chunk_text_2}           │
    │                                                      │
    │ EJEMPLOS DE RESPUESTA:                               │
    │ Cliente: "{example_1.question}"                       │
    │ Agente: "{example_1.answer}"                         │
    │                                                      │
    │ INSTRUCCIONES DE TONO (CAMPANA):                     │
    │ {campaign_stage.tone_instructions}                    │
    │                                                      │
    │ FORMATO DE RESPUESTA:                                │
    │ Responde SOLO en JSON:                               │
    │ {                                                    │
    │   "response": "texto de respuesta al deudor",        │
    │   "sentiment": "positive|neutral|negative",          │
    │   "confidence": 0.0-1.0,                             │
    │   "intent": "payment|dispute|info|complaint|other",  │
    │   "should_escalate": false,                          │
    │   "escalation_reason": null,                         │
    │   "payment_promise": null,                           │
    │   "internal_notes": "notas internas"                 │
    │ }                                                    │
    └──────────────────────────────────────────────────────┘

    Historial de conversacion:
    - Ultimo N mensajes de ai_conversation_messages
           |
           v
[5] LLAMAR GEMINI
    - model.generate_content(prompt)
    - Medir latencia (first_response_time_ms)
    - Parsear JSON de respuesta
    - Contar tokens (usage_metadata)
    - Calcular costo
           |
           v
[6] PROCESAR RESPUESTA
    - Guardar mensaje del deudor (role=client, sentiment, confidence)
    - Guardar respuesta del agente (role=agent, tokens_used, cost)
    - Actualizar conversation.total_messages
    - Actualizar conversation.overall_sentiment
           |
           v
[7] EVALUAR ESCALAMIENTO
    - Para cada escalation_rule activa:
      - negative_sentiment: sentiment==negative AND confidence > threshold?
      - high_debt: debtor total_balance > min_amount?
      - repeated_failure: payment_promises incumplidas > max?
      - client_request: intent=="escalation_request"?
      - agent_uncertainty: confidence < threshold?
    - Si match:
      - conversation.status = ESCALATED
      - conversation.escalated_to_user_id = rule.assign_to_user_id
      - conversation.escalation_reason = rule.reason
      - Notificar al usuario asignado
           |
           v
[8] ENVIAR RESPUESTA
    - Via el canal original (WhatsApp/SMS/Email)
    - Registrar en communication_logs
    - Crear communication_event(type=sent)
```

### 5.3 Generacion de Mensajes para Campanas

```
CAMPAIGN ENGINE dispara StageAction
           |
           v
[1] EVALUAR SI ai_enabled=true
    - Si false: usar template directo con variable replacement
    - Si true: continuar con generacion IA
           |
           v
[2] CONSTRUIR PROMPT DE GENERACION
    ┌──────────────────────────────────────────────────────┐
    │ Genera un mensaje de cobranza para enviar por        │
    │ {action.channel} al deudor {debtor.name}.            │
    │                                                      │
    │ CONTEXTO:                                            │
    │ - Tipo de campana: {campaign.campaign_type}           │
    │ - Etapa actual: {stage.name} (dias {day_start}-{day_end})│
    │ - Tono requerido: {stage.tone_instructions}          │
    │ - Template base: {template.body}                     │
    │                                                      │
    │ DATOS DEL DEUDOR:                                    │
    │ - Nombre: {debtor.name}                              │
    │ - Deuda total: ${total_balance}                       │
    │ - Facturas vencidas: {details}                       │
    │ - Dias de mora: {days_overdue}                       │
    │ - Perfil: {debtor.ai_profile_summary}                │
    │ - Historial: {last_communications}                   │
    │                                                      │
    │ REGLAS:                                              │
    │ - Maximo {max_chars} caracteres para {channel}       │
    │ - No mencionar datos de otros clientes               │
    │ - {business_rules}                                   │
    │                                                      │
    │ Genera SOLO el texto del mensaje, sin explicaciones.  │
    └──────────────────────────────────────────────────────┘
           |
           v
[3] LLAMAR GEMINI 2.0 FLASH
    - Temperatura baja (0.3) para consistencia
    - Max tokens segun canal:
      - WhatsApp: 500 tokens
      - SMS: 160 chars (1 segmento)
      - Email: 2000 tokens
      - Call script: 1000 tokens
           |
           v
[4] ENVIAR POR CANAL
    - Crear communication_log
    - Encolar en Cloud Tasks -> message_worker
```

### 5.4 Modelos Gemini: Cuando Usar Cada Uno

| Escenario | Modelo | Razon |
|-----------|--------|-------|
| Respuesta conversacional normal | `gemini-2.0-flash` | Baja latencia (<1s), bajo costo |
| Deuda alta (>$500K ARS) | `gemini-2.5-pro` | Mayor razonamiento, menos errores |
| Negociacion de plan de pagos | `gemini-2.5-pro` | Requiere calculo y persuasion |
| Generacion de mensaje campana | `gemini-2.0-flash` | Tarea simple, alto volumen |
| Analisis de sentimiento batch | `gemini-2.0-flash` | Alto volumen, baja complejidad |
| Generacion de perfil de deudor | `gemini-2.5-pro` | Analisis complejo de historial |
| Resumen de conversacion | `gemini-2.0-flash` | Tarea de extraccion simple |

### 5.5 Safety Settings para Cobranzas

```python
from vertexai.generative_models import HarmCategory, HarmBlockThreshold

SAFETY_SETTINGS = {
    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
}
# NOTA: En cobranzas, el modelo puede generar contenido que parece "presion".
# Ajustar HARASSMENT a MEDIUM para permitir mensajes firmes pero profesionales.
```

---

## 6. RAG - Retrieval Augmented Generation

### 6.1 Arquitectura del Vector Search

```
                    INGESTION (Training Pipeline)
                              |
    +-------------------------+-------------------------+
    |                         |                         |
[Documentos]           [Reglas de Negocio]      [Ejemplos Q&A]
    |                         |                         |
    v                         v                         v
 Chunking              Formatear como            Formatear como
 (500 tokens)          documentos de texto       pares Q&A
    |                         |                         |
    +-------------------------+-------------------------+
                              |
                              v
                    Vertex AI Embeddings
                    (text-embedding-005)
                    Dimension: 768
                              |
                              v
                    Vertex AI Vector Search
                    (Approximate Nearest Neighbor)
                    ┌─────────────────────────────┐
                    │  Index: cobroflow-rag-index  │
                    │  Endpoint: rag-endpoint      │
                    │                             │
                    │  Metadata filters:           │
                    │  - organization_id (string)  │
                    │  - doc_type (string)         │
                    │    "document"|"rule"|"example"│
                    │  - category (string)         │
                    │  - priority (string)         │
                    │  - is_active (bool)          │
                    └─────────────────────────────┘


                    RETRIEVAL (En cada conversacion)
                              |
    Mensaje del deudor -----> Embedding (text-embedding-005)
                              |
                              v
                    Vector Search Query
                    - top_k: 10
                    - filter: organization_id == "org_xxx"
                    - filter: is_active == true
                              |
                              v
                    Resultados rankeados por similaridad
                    - doc_chunk_1 (score: 0.95)
                    - rule_2 (score: 0.91)
                    - example_5 (score: 0.88)
                    - doc_chunk_3 (score: 0.82)
                    - ...
                              |
                              v
                    Top-5 insertados en el prompt de Gemini
```

### 6.2 Configuracion del Vector Search Index

```python
# Crear el indice
from google.cloud import aiplatform

index = aiplatform.MatchingEngineIndex.create_tree_ah_index(
    display_name="cobroflow-rag-index",
    contents_delta_uri=f"gs://{GCS_BUCKET_TRAINING_DOCS}/embeddings/",
    dimensions=768,                      # text-embedding-005 output dim
    approximate_neighbors_count=150,
    distance_measure_type="DOT_PRODUCT_DISTANCE",
    shard_size="SHARD_SIZE_SMALL",       # Para < 100K vectores
    description="CobroFlow RAG index para documentos, reglas y ejemplos",
)

# Crear endpoint
index_endpoint = aiplatform.MatchingEngineIndexEndpoint.create(
    display_name="cobroflow-rag-endpoint",
    public_endpoint_enabled=True,        # Accesible desde Cloud Run
)

# Deploy el indice en el endpoint
index_endpoint.deploy_index(
    index=index,
    deployed_index_id="cobroflow_rag_deployed",
    display_name="cobroflow-rag-deployed",
    machine_type="e2-standard-2",        # Minimo para dev
    min_replica_count=1,
    max_replica_count=2,                 # Auto-scale en prod
)
```

### 6.3 Proceso de Chunking de Documentos

```python
"""
Estrategia de chunking para diferentes tipos de documento:

PDF/DOCX/TXT:
  - Chunk size: 500 tokens (~375 palabras)
  - Overlap: 50 tokens
  - Separadores: parrafos > oraciones > palabras

CSV/XLSX:
  - Cada fila como un chunk independiente
  - Header incluido en cada chunk como contexto
  - Maximo 500 tokens por chunk

JSON:
  - Cada objeto de primer nivel como chunk
  - Aplanar objetos anidados

Reglas de Negocio:
  - Cada regla es un chunk individual
  - Metadata: priority, is_active, sort_order
  - Formato: "REGLA [{priority}]: {rule_text}"

Ejemplos Q&A:
  - Cada par Q&A es un chunk
  - Metadata: category, is_active
  - Formato: "PREGUNTA: {question}\nRESPUESTA: {answer}"
"""

from langchain_text_splitters import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50,
    length_function=lambda t: len(tiktoken.encoding_for_model("gpt-4").encode(t)),
    separators=["\n\n", "\n", ". ", " ", ""],
)
```

### 6.4 Metadata en Cada Vector

```json
{
  "id": "chunk_uuid_123",
  "organization_id": "org_uuid_456",
  "source_id": "doc_uuid_789",
  "source_type": "document",
  "source_name": "Politica de Cobranza 2026",
  "chunk_index": 3,
  "total_chunks": 12,
  "category": "politica",
  "priority": "high",
  "is_active": true,
  "created_at": "2026-02-16T10:00:00Z"
}
```

---

## 7. Motor de Campanas Automatizadas

### 7.1 Arquitectura del Campaign Engine

```
Cloud Scheduler                    Cloud Tasks
(cron: "0 * * * *")              (Queue: campaign-execution)
     |                                  |
     v                                  v
[Evaluate Campaigns]            [Execute Single Action]
  Cloud Run handler               Cloud Run handler
  /workers/campaign               /workers/message
     |                                  |
     | Para cada campana activa:        | Para cada accion:
     | 1. Filtrar deudores elegibles    | 1. Generar contenido (IA o template)
     | 2. Calcular stage actual         | 2. Resolver variables del template
     | 3. Determinar acciones pendientes| 3. Enviar por canal
     | 4. Crear Cloud Tasks             | 4. Registrar en communication_logs
     |    para cada accion              | 5. Crear communication_event
     v                                  v
  Cloud Tasks                    Twilio / SendGrid / etc.
  (una task por accion)
```

### 7.2 Cloud Scheduler: Cron Jobs

```yaml
# Job 1: Evaluacion de campanas (cada hora)
name: evaluate-campaigns
schedule: "0 * * * *"                    # Cada hora en punto
timezone: America/Argentina/Buenos_Aires
target:
  uri: https://CLOUD_RUN_URL/api/v1/workers/campaigns/evaluate
  http_method: POST
  headers:
    X-CloudScheduler-Token: "{SCHEDULER_SECRET}"
  body: "{}"
retry_config:
  retry_count: 3
  max_retry_duration: 300s

# Job 2: Agregacion de analytics (cada dia a las 02:00)
name: aggregate-analytics
schedule: "0 2 * * *"
timezone: America/Argentina/Buenos_Aires
target:
  uri: https://CLOUD_RUN_URL/api/v1/workers/analytics/aggregate
  http_method: POST
  headers:
    X-CloudScheduler-Token: "{SCHEDULER_SECRET}"

# Job 3: Expirar conversaciones inactivas (cada 6 horas)
name: expire-conversations
schedule: "0 */6 * * *"
timezone: America/Argentina/Buenos_Aires
target:
  uri: https://CLOUD_RUN_URL/api/v1/workers/conversations/expire
  http_method: POST
  headers:
    X-CloudScheduler-Token: "{SCHEDULER_SECRET}"

# Job 4: Actualizar estados de facturas vencidas (cada dia a las 00:30)
name: update-overdue-invoices
schedule: "30 0 * * *"
timezone: America/Argentina/Buenos_Aires
target:
  uri: https://CLOUD_RUN_URL/api/v1/workers/invoices/update-overdue
  http_method: POST
  headers:
    X-CloudScheduler-Token: "{SCHEDULER_SECRET}"
```

### 7.3 Cloud Tasks: Colas de Trabajo

```yaml
# Cola de envio de mensajes
queue: message-sending
  rate_limits:
    max_dispatches_per_second: 10        # 10 mensajes/segundo
    max_concurrent_dispatches: 20        # 20 en paralelo
  retry_config:
    max_attempts: 5
    min_backoff: 10s
    max_backoff: 600s                    # Max 10 min entre reintentos
    max_doublings: 4

# Cola de ejecucion de campanas
queue: campaign-execution
  rate_limits:
    max_dispatches_per_second: 5
    max_concurrent_dispatches: 10
  retry_config:
    max_attempts: 3
    min_backoff: 30s
    max_backoff: 300s

# Cola de pipeline de entrenamiento
queue: training-pipeline
  rate_limits:
    max_dispatches_per_second: 2         # Documentos son pesados
    max_concurrent_dispatches: 3
  retry_config:
    max_attempts: 3
    min_backoff: 60s
    max_backoff: 600s
```

### 7.4 Logica de Evaluacion de Campana

```python
"""
Pseudocodigo del Campaign Engine:

Para cada organizacion con campanas activas:
  Para cada campana donde is_active=True:
    1. Obtener audiencia (deudores elegibles):
       - Filtrar por strategy_config.audience:
         - days_overdue entre min y max
         - debt_amount entre min y max
         - tags match
         - risk_score entre min y max
       - Excluir deudores que ya recibieron comunicacion hoy
       - Excluir deudores con conversacion IA activa (status=ACTIVE)

    2. Para cada deudor elegible:
       a. Calcular dias de mora: TODAY - invoice.due_date
       b. Determinar stage actual: WHERE day_start <= dias_mora <= day_end
       c. Si no hay stage aplicable: skip

       d. Para cada action en stage.actions:
          - Si trigger_day != dias_mora: skip (ya paso o no toca hoy)
          - Verificar si ya se envio esta accion a este deudor (dedup)
          - Verificar horario de operacion del canal

          - Crear Cloud Task:
            {
              "organization_id": "...",
              "campaign_id": "...",
              "stage_id": "...",
              "action_id": "...",
              "debtor_id": "...",
              "channel": "whatsapp",
              "template_id": "...",
              "ai_enabled": true,
              "tone_instructions": "...",
              "scheduled_for": "2026-02-16T10:00:00-03:00"
            }
"""
```

---

## 8. Pipeline de Entrenamiento

### 8.1 Flujo Completo del Training Pipeline

```
Boton "Iniciar Entrenamiento" (Frontend)
           |
           v
POST /ai-agent/training/sessions
    - Crear AITrainingSession(status=RUNNING)
    - Encolar Cloud Task: training-pipeline
           |
           v
Cloud Task -> /workers/training/process
           |
    +------+------+------+
    |      |      |      |
    v      v      v      v
  STEP 1  STEP 2  STEP 3  STEP 4
  Docs    Rules   Examples Validate

STEP 1: Procesar Documentos Pendientes
  - SELECT FROM ai_training_documents WHERE status='pending' AND org_id=X
  - Para cada documento:
    a. Si file_path existe:
       - Descargar de Cloud Storage
       - Si PDF: extraer texto con Document AI (opcional) o PyPDF
       - Si DOCX: extraer con python-docx
       - Guardar en content_text
    b. Chunking del content_text (500 tokens, 50 overlap)
    c. Para cada chunk:
       - Generar embedding via Vertex AI text-embedding-005
       - Agregar metadata (org_id, doc_id, chunk_index, etc.)
    d. Batch upsert en Vector Search index
    e. Actualizar documento:
       - status = 'processed'
       - chunk_count = N
       - embedding_id = "{index_id}:{doc_id}"
       - processed_at = NOW()
    f. Si error:
       - status = 'failed'
       - error_message = str(error)
  - Actualizar session.documents_processed

STEP 2: Procesar Reglas de Negocio
  - SELECT FROM ai_business_rules WHERE is_active=true AND org_id=X
  - Para cada regla:
    a. Formatear: "REGLA [{priority}]: {rule_text}"
    b. Generar embedding
    c. Metadata: {source_type: "rule", priority, sort_order}
  - Batch upsert en Vector Search
  - Actualizar session.rules_applied

STEP 3: Procesar Ejemplos de Conversacion
  - SELECT FROM ai_conversation_examples WHERE is_active=true AND org_id=X
  - Para cada ejemplo:
    a. Formatear: "PREGUNTA: {question}\nRESPUESTA ESPERADA: {answer}"
    b. Generar embedding
    c. Metadata: {source_type: "example", category}
  - Batch upsert en Vector Search
  - Actualizar session.examples_added

STEP 4: Validacion (Opcional)
  - Seleccionar 5 ejemplos aleatorios como test queries
  - Para cada test query:
    a. Generar embedding del question
    b. Buscar en Vector Search (top-5)
    c. Verificar que el ejemplo original aparezca en top-3
    d. Generar respuesta con Gemini usando RAG
    e. Comparar respuesta con answer esperado (similarity score)
  - Calcular accuracy promedio
  - Actualizar session.accuracy_after

FINAL:
  - session.status = 'completed'
  - session.completed_at = NOW()
  - Si hubo errores parciales: session.error_message = "X de Y docs fallaron"
```

### 8.2 Almacenamiento en Cloud Storage

```
gs://cobroflow-training-docs/
├── {organization_id}/
│   ├── raw/                          # Archivos originales
│   │   ├── politica_cobranza.pdf
│   │   ├── faq_clientes.docx
│   │   └── tarifas_2026.csv
│   ├── processed/                    # Texto extraido
│   │   ├── politica_cobranza.txt
│   │   ├── faq_clientes.txt
│   │   └── tarifas_2026.txt
│   └── embeddings/                   # JSONs para Vector Search batch
│       ├── batch_2026-02-16.json     # Formato JSONL para batch upsert
│       └── ...

gs://cobroflow-invoices/
├── {organization_id}/
│   └── {debtor_id}/
│       ├── factura_001.pdf
│       └── factura_002.pdf

gs://cobroflow-audio/
├── {organization_id}/
│   └── calls/
│       ├── {conversation_id}_recording.wav
│       └── ...
```

---

## 9. Integraciones de Canales

### 9.1 WhatsApp (via Twilio o Meta Cloud API)

```
OUTBOUND (Agente -> Deudor):
  Cloud Tasks -> message_worker -> Twilio API
  POST https://api.twilio.com/2010-04-01/Accounts/{SID}/Messages.json
  {
    "To": "whatsapp:+5411XXXXXXXX",
    "From": "whatsapp:+14155238886",
    "Body": "{mensaje_generado_por_gemini}"
  }

INBOUND (Deudor -> Agente):
  Twilio Webhook -> POST https://CLOUD_RUN_URL/webhooks/twilio/whatsapp
  {
    "From": "whatsapp:+5411XXXXXXXX",
    "Body": "Hola, quiero consultar mi deuda",
    "MessageSid": "SM..."
  }
  -> Identificar deudor por phone
  -> Buscar/crear AIConversation
  -> Procesar con Vertex AI Gemini (flujo seccion 5.2)
  -> Responder via Twilio
```

### 9.2 Email (via SendGrid)

```
OUTBOUND:
  Cloud Tasks -> message_worker -> SendGrid API
  POST https://api.sendgrid.com/v3/mail/send
  {
    "personalizations": [{"to": [{"email": "deudor@email.com"}]}],
    "from": {"email": "cobros@cobroflow.com", "name": "CobroFlow"},
    "subject": "{subject_generado}",
    "content": [{"type": "text/html", "value": "{body_generado}"}]
  }

INBOUND:
  SendGrid Inbound Parse -> POST https://CLOUD_RUN_URL/webhooks/sendgrid/inbound
  -> Parsear email entrante
  -> Identificar deudor por email
  -> Procesar con Vertex AI

TRACKING:
  SendGrid Event Webhook -> POST https://CLOUD_RUN_URL/webhooks/sendgrid/events
  -> Actualizar communication_logs (delivered, opened, clicked, bounced)
  -> Crear communication_events
```

### 9.3 SMS (via Twilio)

```
OUTBOUND:
  Igual que WhatsApp pero sin prefijo "whatsapp:"
  Limite: 160 chars por segmento, configurar max_segments en channel_config

INBOUND:
  Twilio Webhook -> POST https://CLOUD_RUN_URL/webhooks/twilio/sms
  -> Mismo flujo que WhatsApp
```

### 9.4 Llamadas de Voz (via Twilio + Vertex AI)

```
OUTBOUND (AI Voice):
  1. Cloud Tasks -> message_worker -> Twilio Voice API
  2. Twilio llama al deudor
  3. Al contestar: Twilio hace request a webhook
     POST https://CLOUD_RUN_URL/webhooks/twilio/voice/connect
  4. Backend genera TwiML con <Gather> para Speech-to-Text
  5. Loop conversacional:
     a. Deudor habla -> Twilio STT -> texto
     b. Texto -> Vertex AI Gemini -> respuesta
     c. Respuesta -> Vertex AI TTS (es-AR-Wavenet-B) -> audio
     d. Audio -> Twilio <Say> o <Play>
     e. Repetir hasta resolucion o max_duration

CONFIGURACION TTS/STT:
  - STT: Google Cloud Speech-to-Text (modelo: chirp, idioma: es-AR)
  - TTS: Google Cloud Text-to-Speech (voz: es-AR-Wavenet-B)
  - Alternativa: Twilio <Gather> con speechModel="phone_call"
```

### 9.5 Tabla Resumen de Canales

| Canal | Provider | Outbound | Inbound | Tracking | Costo Aprox/msg |
|-------|----------|----------|---------|----------|-----------------|
| WhatsApp | Twilio/Meta | API REST | Webhook | Delivery status | $0.005-0.05 |
| Email | SendGrid | API REST | Inbound Parse | Open/Click/Bounce | $0.0001 |
| SMS | Twilio | API REST | Webhook | Delivery status | $0.01-0.08 |
| Call | Twilio Voice | API REST | Webhook stream | Duration/outcome | $0.02/min |
| AI Voice | Twilio + Vertex | API REST | Webhook + STT | Duration/outcome | $0.05/min |

---

## 10. Seguridad y Secrets

### 10.1 Secret Manager

```bash
# Crear secrets
gcloud secrets create jwt-secret --replication-policy="automatic"
echo -n "super-secret-jwt-key-256-bits" | gcloud secrets versions add jwt-secret --data-file=-

gcloud secrets create db-password --replication-policy="automatic"
echo -n "strong-db-password" | gcloud secrets versions add db-password --data-file=-

gcloud secrets create twilio-sid --replication-policy="automatic"
echo -n "AC..." | gcloud secrets versions add twilio-sid --data-file=-

gcloud secrets create twilio-token --replication-policy="automatic"
echo -n "auth_token_here" | gcloud secrets versions add twilio-token --data-file=-

gcloud secrets create sendgrid-key --replication-policy="automatic"
echo -n "SG.xxx" | gcloud secrets versions add sendgrid-key --data-file=-
```

### 10.2 IAM Roles para Cloud Run Service Account

```bash
# Crear service account
gcloud iam service-accounts create cobroflow-backend \
    --display-name="CobroFlow Backend"

SA=cobroflow-backend@cobroflow-prod.iam.gserviceaccount.com

# Cloud SQL Client
gcloud projects add-iam-policy-binding cobroflow-prod \
    --member="serviceAccount:$SA" \
    --role="roles/cloudsql.client"

# Vertex AI User
gcloud projects add-iam-policy-binding cobroflow-prod \
    --member="serviceAccount:$SA" \
    --role="roles/aiplatform.user"

# Cloud Storage Object Admin (para training docs)
gcloud projects add-iam-policy-binding cobroflow-prod \
    --member="serviceAccount:$SA" \
    --role="roles/storage.objectAdmin"

# Cloud Tasks Enqueuer
gcloud projects add-iam-policy-binding cobroflow-prod \
    --member="serviceAccount:$SA" \
    --role="roles/cloudtasks.enqueuer"

# Secret Manager Accessor
gcloud projects add-iam-policy-binding cobroflow-prod \
    --member="serviceAccount:$SA" \
    --role="roles/secretmanager.secretAccessor"

# Cloud Logging Writer
gcloud projects add-iam-policy-binding cobroflow-prod \
    --member="serviceAccount:$SA" \
    --role="roles/logging.logWriter"

# Pub/Sub Publisher (para webhooks)
gcloud projects add-iam-policy-binding cobroflow-prod \
    --member="serviceAccount:$SA" \
    --role="roles/pubsub.publisher"
```

### 10.3 Seguridad de Red

```
VPC: cobroflow-vpc
  Subnet: cobroflow-subnet (10.0.0.0/24)
  Region: southamerica-east1

Cloud SQL:
  - Private IP habilitada
  - Public IP deshabilitada (prod)
  - SSL requerido

Cloud Run:
  - VPC Connector para acceder a Cloud SQL via IP privada
  - Ingress: Allow all (con Cloud Load Balancer al frente)
  - Egress: Via VPC connector

Firewall Rules:
  - Allow Cloud Run -> Cloud SQL (port 5432) via VPC
  - Allow Cloud Run -> Internet (para Twilio, SendGrid, Vertex AI)
  - Deny all other internal traffic
```

---

## 11. Observabilidad y Monitoreo

### 11.1 Cloud Logging Estructurado

```python
import google.cloud.logging
from google.cloud.logging_v2.handlers import StructuredLogHandler

client = google.cloud.logging.Client()
handler = StructuredLogHandler()

# Logs estructurados con contexto
logger.info("Mensaje enviado", extra={
    "json_fields": {
        "organization_id": str(org_id),
        "debtor_id": str(debtor_id),
        "channel": "whatsapp",
        "campaign_id": str(campaign_id),
        "message_length": len(message),
        "tokens_used": 150,
        "latency_ms": 450,
        "model": "gemini-2.0-flash",
    }
})
```

### 11.2 Metricas Custom en Cloud Monitoring

```yaml
Metricas a monitorear:

# Performance
- vertex_ai_latency_ms (histograma por modelo)
- vertex_ai_tokens_per_request (histograma)
- messages_sent_total (counter por canal)
- messages_failed_total (counter por canal + error_code)

# Negocio
- conversations_active (gauge por org)
- conversations_escalated_total (counter por razon)
- campaign_actions_executed_total (counter por campana)
- payments_collected_total (counter)
- payments_collected_amount (counter en ARS)

# Costos
- vertex_ai_cost_total (counter en USD)
- twilio_cost_total (counter en USD)
- sendgrid_cost_total (counter en USD)

Alertas:
- Error rate > 5% en cualquier canal -> PagerDuty
- Vertex AI latency p99 > 5s -> Warning
- Cloud SQL connections > 80% pool -> Warning
- Escalation rate > 30% -> Review alert
- Training pipeline failure -> Critical
```

### 11.3 Dashboard en Cloud Monitoring

```
Dashboard: CobroFlow Operations

Panel 1: AI Agent Health
  - Conversaciones activas (gauge)
  - Tasa de resolucion (% ultimas 24h)
  - Tasa de escalamiento (% ultimas 24h)
  - Sentimiento promedio (positivo/neutral/negativo %)

Panel 2: Campaign Performance
  - Mensajes enviados hoy (por canal)
  - Tasa de entrega (%)
  - Tasa de apertura email (%)
  - Tasa de respuesta (%)

Panel 3: Vertex AI
  - Requests/segundo
  - Latencia p50/p95/p99
  - Tokens consumidos (input/output)
  - Costo acumulado hoy

Panel 4: Infrastructure
  - Cloud Run instances activas
  - Cloud SQL CPU/Memory/Connections
  - Cloud Tasks queue depth
  - Error rate por endpoint
```

---

## 12. Costos Estimados

### 12.1 Escenario: 100 organizaciones, 5000 deudores activos/mes

| Servicio | Uso Estimado | Costo Mensual USD |
|----------|-------------|-------------------|
| **Cloud Run** | 2 instancias, 1 vCPU, 512MB | ~$30 |
| **Cloud SQL** | db-custom-2-8192, 50GB SSD | ~$120 |
| **Vertex AI Gemini Flash** | 10M input + 5M output tokens | ~$2.50 |
| **Vertex AI Gemini Pro** | 500K input + 250K output tokens | ~$2.50 |
| **Vertex AI Embeddings** | 2M tokens/mes (training) | ~$0.05 |
| **Vertex AI Vector Search** | 1 nodo e2-standard-2 | ~$100 |
| **Cloud Storage** | 10 GB (docs + audio) | ~$0.20 |
| **Cloud Tasks** | 500K tasks/mes | Gratis |
| **Cloud Scheduler** | 4 jobs | ~$0.40 |
| **Cloud Pub/Sub** | 100K mensajes | Gratis |
| **Secret Manager** | 5 secrets, 10K accesos | ~$0.30 |
| **Cloud Logging** | 10 GB/mes | Gratis (50GB free) |
| **Twilio WhatsApp** | 50K mensajes | ~$2,500 |
| **Twilio SMS** | 20K mensajes | ~$400 |
| **SendGrid** | 100K emails | ~$20 |
| **Cloud Build** | CI/CD | Gratis (120 min/dia) |
| **Networking/LB** | Load Balancer + SSL | ~$20 |
| **TOTAL GCP** | | **~$275/mes** |
| **TOTAL con providers** | | **~$3,195/mes** |

### 12.2 Optimizacion de Costos

```
1. Vector Search es el costo fijo mas alto (~$100/mes).
   Alternativa: Usar pgvector extension en Cloud SQL (gratis)
   - Agregar extension pgvector a PostgreSQL
   - Crear tabla embeddings con columna vector(768)
   - Usar indice IVFFlat o HNSW para busqueda
   - AHORRO: ~$100/mes
   - TRADEOFF: Menor performance en >1M vectores

2. Gemini Flash es muy barato. Para 10M tokens = ~$1.
   No hay necesidad de optimizar tokens agresivamente.

3. Cloud Run: Usar min-instances=0 en dev para no pagar idle.
   En prod: min-instances=1 para evitar cold starts.

4. Cloud SQL: Usar conexiones de lectura contra replica
   para queries de analytics pesados.
```

---

## 13. Plan de Implementacion por Fases

### FASE 1: Infraestructura Base (Semana 1-2)

```
Objetivo: Backend funcionando en GCP con database

Tareas:
[ ] Crear proyecto GCP "cobroflow-prod"
[ ] Habilitar APIs: Cloud Run, Cloud SQL, Secret Manager, Artifact Registry
[ ] Crear Cloud SQL PostgreSQL 15
[ ] Migrar base de datos (alembic upgrade head)
[ ] Configurar Secret Manager con secrets
[ ] Crear Dockerfile para backend
[ ] Deploy backend en Cloud Run
[ ] Configurar Cloud SQL Auth Proxy como sidecar
[ ] Configurar Custom Domain + SSL
[ ] Verificar todos los endpoints existentes funcionan

Archivos a modificar:
- app/core/config.py (agregar GCP settings)
- app/db/session.py (Cloud SQL connection string)
- Dockerfile (nuevo)
- cloudbuild.yaml (nuevo)
- .env.production (nuevo)
```

### FASE 2: Motor IA Conversacional (Semana 3-4)

```
Objetivo: Agente IA responde conversaciones usando Vertex AI Gemini

Tareas:
[ ] Habilitar Vertex AI API
[ ] Crear app/services/vertex_ai.py
[ ] Implementar flujo de conversacion (seccion 5.2)
[ ] Integrar con endpoints existentes:
    - POST /ai-agent/conversations/{id}/messages -> usar Gemini para generar respuesta
[ ] Implementar analisis de sentimiento en cada mensaje
[ ] Implementar logica de escalamiento
[ ] Cambiar defaults: model_provider='vertex_ai', model_name='gemini-2.0-flash'
[ ] Actualizar personality.system_prompt con template de cobranzas
[ ] Tests de conversacion end-to-end

Archivos nuevos:
- app/services/vertex_ai.py
- app/services/sentiment_analyzer.py

Archivos a modificar:
- app/crud/ai_agent.py (integrar Gemini en create_message)
- app/api/v1/endpoints/ai_agent.py (endpoint de mensajes)
- app/models/ai_agent.py (defaults de model_provider/model_name)
- requirements.txt (google-cloud-aiplatform)
```

### FASE 3: RAG + Training Pipeline (Semana 5-6)

```
Objetivo: Documentos se procesan y se usan como contexto en conversaciones

Opcion A - Vertex AI Vector Search ($100/mes):
[ ] Crear Vector Search Index + Endpoint
[ ] Crear app/services/vector_search.py
[ ] Implementar chunking de documentos
[ ] Implementar embedding generation
[ ] Implementar upsert en Vector Search
[ ] Integrar RAG en flujo de conversacion

Opcion B - pgvector en Cloud SQL (gratis):
[ ] Habilitar extension pgvector en Cloud SQL
[ ] Crear tabla embeddings con columna vector(768)
[ ] Crear indices HNSW para busqueda
[ ] Implementar embedding generation via Vertex AI
[ ] Implementar busqueda por cosine similarity
[ ] Integrar RAG en flujo de conversacion

Para ambas opciones:
[ ] Crear app/services/training_pipeline.py
[ ] Crear app/services/document_processor.py
[ ] Implementar Cloud Task para training async
[ ] Crear app/workers/training_worker.py
[ ] Conectar boton "Iniciar Entrenamiento" con pipeline real
[ ] Tests de RAG quality

Archivos nuevos:
- app/services/vector_search.py
- app/services/training_pipeline.py
- app/services/document_processor.py
- app/workers/training_worker.py

Archivos a modificar:
- app/services/vertex_ai.py (agregar RAG context)
- app/crud/ai_agent.py (training session updates)
- requirements.txt (langchain-text-splitters, tiktoken)
```

### FASE 4: Motor de Campanas (Semana 7-8)

```
Objetivo: Campanas se ejecutan automaticamente enviando mensajes

Tareas:
[ ] Habilitar Cloud Tasks API + Cloud Scheduler API
[ ] Crear colas de Cloud Tasks (messages, campaigns, training)
[ ] Crear Cloud Scheduler jobs (evaluate-campaigns, aggregate-analytics)
[ ] Crear app/services/campaign_engine.py
[ ] Crear app/services/message_sender.py
[ ] Crear app/workers/campaign_worker.py
[ ] Crear app/workers/message_worker.py
[ ] Implementar logica de evaluacion de campanas
[ ] Implementar generacion de mensajes IA para campanas
[ ] Implementar variable replacement en templates
[ ] Implementar deduplicacion (no enviar 2 veces al mismo deudor)
[ ] Implementar respeto de horarios de operacion
[ ] Tests de campana end-to-end

Archivos nuevos:
- app/services/campaign_engine.py
- app/services/message_sender.py
- app/workers/campaign_worker.py
- app/workers/message_worker.py

Archivos a modificar:
- app/api/v1/endpoints/ai_agent.py (workers endpoints)
- requirements.txt (google-cloud-tasks, google-cloud-scheduler)
```

### FASE 5: Integracion de Canales (Semana 9-10)

```
Objetivo: Mensajes se envian y reciben por WhatsApp, Email, SMS

Tareas:
[ ] Configurar cuenta Twilio (WhatsApp Business, SMS, Voice)
[ ] Configurar cuenta SendGrid (verificar dominio)
[ ] Crear app/webhooks/twilio_webhook.py
[ ] Crear app/webhooks/sendgrid_webhook.py
[ ] Implementar envio WhatsApp via Twilio
[ ] Implementar envio Email via SendGrid
[ ] Implementar envio SMS via Twilio
[ ] Implementar recepcion WhatsApp (webhook -> conversacion IA)
[ ] Implementar recepcion Email (inbound parse -> conversacion IA)
[ ] Implementar recepcion SMS (webhook -> conversacion IA)
[ ] Implementar tracking de eventos (delivery, open, click, bounce)
[ ] Registrar todo en communication_logs + communication_events
[ ] Tests de integracion con cada canal

Archivos nuevos:
- app/webhooks/twilio_webhook.py
- app/webhooks/sendgrid_webhook.py

Archivos a modificar:
- app/services/message_sender.py (implementar envio real)
- app/main.py (registrar webhook routes)
- requirements.txt (twilio, sendgrid)
```

### FASE 6: Observabilidad + Produccion (Semana 11-12)

```
Objetivo: Sistema monitoreado, alertas configuradas, listo para produccion

Tareas:
[ ] Configurar Cloud Logging estructurado
[ ] Crear metricas custom en Cloud Monitoring
[ ] Crear dashboards operacionales
[ ] Configurar alertas (error rate, latencia, escalaciones)
[ ] Implementar health checks detallados
[ ] Configurar backups automaticos de Cloud SQL
[ ] Implementar rate limiting en endpoints publicos
[ ] Security audit: revisar CORS, JWT expiry, input validation
[ ] Load testing con datos simulados
[ ] Documentar runbooks operacionales
[ ] Deploy final en produccion

Archivos nuevos:
- app/services/analytics_aggregator.py
- app/workers/analytics_worker.py
- monitoring/dashboards.json
- monitoring/alerts.yaml

Archivos a modificar:
- app/main.py (logging setup)
- app/api/v1/endpoints/health.py (detailed health checks)
```

---

## 14. Configuracion Paso a Paso

### 14.1 Setup Inicial del Proyecto GCP

```bash
# 1. Crear proyecto
gcloud projects create cobroflow-prod --name="CobroFlow Production"
gcloud config set project cobroflow-prod

# 2. Habilitar billing (requiere cuenta de facturacion vinculada)
gcloud billing accounts list
gcloud billing projects link cobroflow-prod --billing-account=BILLING_ACCOUNT_ID

# 3. Habilitar APIs necesarias
gcloud services enable \
    run.googleapis.com \
    sqladmin.googleapis.com \
    aiplatform.googleapis.com \
    storage.googleapis.com \
    cloudtasks.googleapis.com \
    cloudscheduler.googleapis.com \
    secretmanager.googleapis.com \
    cloudbuild.googleapis.com \
    artifactregistry.googleapis.com \
    compute.googleapis.com \
    vpcaccess.googleapis.com \
    pubsub.googleapis.com \
    logging.googleapis.com \
    monitoring.googleapis.com

# 4. Crear service account
gcloud iam service-accounts create cobroflow-backend \
    --display-name="CobroFlow Backend Service Account"

# 5. Asignar roles (ver seccion 10.2 para lista completa)
```

### 14.2 Setup Cloud SQL

```bash
# 1. Crear instancia
gcloud sql instances create cobroflow-db \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=southamerica-east1 \
    --storage-type=SSD \
    --storage-size=10GB \
    --storage-auto-increase \
    --backup-start-time=03:00 \
    --availability-type=zonal \
    --network=default

# 2. Crear base de datos
gcloud sql databases create cobroflow --instance=cobroflow-db

# 3. Crear usuario
gcloud sql users create cobroflow-app \
    --instance=cobroflow-db \
    --password="STRONG_PASSWORD_HERE"

# 4. (Opcional) Habilitar pgvector
gcloud sql connect cobroflow-db --user=postgres
# Dentro de psql:
# CREATE EXTENSION IF NOT EXISTS vector;

# 5. Correr migraciones
# Desde tu maquina local con Cloud SQL Auth Proxy:
cloud-sql-proxy cobroflow-prod:southamerica-east1:cobroflow-db &
alembic upgrade head
```

### 14.3 Setup Cloud Storage

```bash
# 1. Crear buckets
gcloud storage buckets create gs://cobroflow-training-docs \
    --location=southamerica-east1 \
    --default-storage-class=STANDARD \
    --uniform-bucket-level-access

gcloud storage buckets create gs://cobroflow-invoices \
    --location=southamerica-east1 \
    --default-storage-class=STANDARD \
    --uniform-bucket-level-access

gcloud storage buckets create gs://cobroflow-audio \
    --location=southamerica-east1 \
    --default-storage-class=STANDARD \
    --uniform-bucket-level-access

# 2. Configurar lifecycle (borrar audio despues de 90 dias)
cat > lifecycle.json << 'EOF'
{
  "rule": [
    {
      "action": {"type": "Delete"},
      "condition": {"age": 90}
    }
  ]
}
EOF
gcloud storage buckets update gs://cobroflow-audio --lifecycle-file=lifecycle.json
```

### 14.4 Setup Cloud Tasks

```bash
# 1. Crear colas
gcloud tasks queues create message-sending \
    --location=southamerica-east1 \
    --max-dispatches-per-second=10 \
    --max-concurrent-dispatches=20 \
    --max-attempts=5 \
    --min-backoff=10s \
    --max-backoff=600s

gcloud tasks queues create campaign-execution \
    --location=southamerica-east1 \
    --max-dispatches-per-second=5 \
    --max-concurrent-dispatches=10 \
    --max-attempts=3 \
    --min-backoff=30s \
    --max-backoff=300s

gcloud tasks queues create training-pipeline \
    --location=southamerica-east1 \
    --max-dispatches-per-second=2 \
    --max-concurrent-dispatches=3 \
    --max-attempts=3 \
    --min-backoff=60s \
    --max-backoff=600s
```

### 14.5 Setup Cloud Scheduler

```bash
# 1. Evaluar campanas cada hora
gcloud scheduler jobs create http evaluate-campaigns \
    --location=southamerica-east1 \
    --schedule="0 * * * *" \
    --time-zone="America/Argentina/Buenos_Aires" \
    --uri="https://CLOUD_RUN_URL/api/v1/workers/campaigns/evaluate" \
    --http-method=POST \
    --oidc-service-account-email=cobroflow-backend@cobroflow-prod.iam.gserviceaccount.com

# 2. Agregar analytics diariamente a las 02:00
gcloud scheduler jobs create http aggregate-analytics \
    --location=southamerica-east1 \
    --schedule="0 2 * * *" \
    --time-zone="America/Argentina/Buenos_Aires" \
    --uri="https://CLOUD_RUN_URL/api/v1/workers/analytics/aggregate" \
    --http-method=POST \
    --oidc-service-account-email=cobroflow-backend@cobroflow-prod.iam.gserviceaccount.com

# 3. Expirar conversaciones cada 6 horas
gcloud scheduler jobs create http expire-conversations \
    --location=southamerica-east1 \
    --schedule="0 */6 * * *" \
    --time-zone="America/Argentina/Buenos_Aires" \
    --uri="https://CLOUD_RUN_URL/api/v1/workers/conversations/expire" \
    --http-method=POST \
    --oidc-service-account-email=cobroflow-backend@cobroflow-prod.iam.gserviceaccount.com

# 4. Actualizar facturas vencidas diariamente
gcloud scheduler jobs create http update-overdue-invoices \
    --location=southamerica-east1 \
    --schedule="30 0 * * *" \
    --time-zone="America/Argentina/Buenos_Aires" \
    --uri="https://CLOUD_RUN_URL/api/v1/workers/invoices/update-overdue" \
    --http-method=POST \
    --oidc-service-account-email=cobroflow-backend@cobroflow-prod.iam.gserviceaccount.com
```

### 14.6 Deploy en Cloud Run

```bash
# 1. Build y push imagen
gcloud builds submit --tag southamerica-east1-docker.pkg.dev/cobroflow-prod/cobroflow/backend:latest

# 2. Deploy
gcloud run deploy cobroflow-backend \
    --image=southamerica-east1-docker.pkg.dev/cobroflow-prod/cobroflow/backend:latest \
    --region=southamerica-east1 \
    --platform=managed \
    --service-account=cobroflow-backend@cobroflow-prod.iam.gserviceaccount.com \
    --add-cloudsql-instances=cobroflow-prod:southamerica-east1:cobroflow-db \
    --set-env-vars="GCP_PROJECT_ID=cobroflow-prod,GCP_REGION=southamerica-east1,GCP_LOCATION_AI=us-central1" \
    --set-secrets="DB_PASSWORD=db-password:latest,SECRET_KEY=jwt-secret:latest,TWILIO_ACCOUNT_SID=twilio-sid:latest,TWILIO_AUTH_TOKEN=twilio-token:latest,SENDGRID_API_KEY=sendgrid-key:latest" \
    --min-instances=1 \
    --max-instances=10 \
    --memory=1Gi \
    --cpu=1 \
    --timeout=300 \
    --concurrency=80 \
    --port=8080 \
    --allow-unauthenticated
```

### 14.7 Setup Vertex AI Vector Search (si se elige Opcion A)

```bash
# 1. Crear el index (requiere al menos un archivo de embeddings inicial)
# Primero crear un archivo placeholder:
echo '{"id":"init","embedding":[0.0,...768 zeros...]}' > init.json
gcloud storage cp init.json gs://cobroflow-training-docs/embeddings/init.json

# 2. Crear index via SDK de Python (ver seccion 6.2)
# Esto se hace programaticamente en el training pipeline

# 3. Crear endpoint
# Esto tambien se hace programaticamente

# NOTA: La primera creacion de index + deploy toma ~30 minutos
```

### 14.8 Setup pgvector (si se elige Opcion B - recomendada para empezar)

```sql
-- Conectar a Cloud SQL y ejecutar:

-- 1. Habilitar extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Crear tabla de embeddings
CREATE TABLE rag_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    source_type VARCHAR(20) NOT NULL,     -- 'document', 'rule', 'example'
    source_id UUID NOT NULL,              -- ID del documento/regla/ejemplo
    source_name VARCHAR(500),
    chunk_index INTEGER DEFAULT 0,
    chunk_text TEXT NOT NULL,
    embedding vector(768) NOT NULL,       -- text-embedding-005 = 768 dims
    metadata JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Crear indice HNSW para busqueda rapida
CREATE INDEX idx_rag_embeddings_hnsw ON rag_embeddings
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- 4. Crear indice parcial por organizacion (critico para multi-tenant)
CREATE INDEX idx_rag_embeddings_org ON rag_embeddings(organization_id)
    WHERE is_active = true;

-- 5. Query de busqueda (ejemplo):
-- SELECT chunk_text, 1 - (embedding <=> query_embedding) AS similarity
-- FROM rag_embeddings
-- WHERE organization_id = 'xxx' AND is_active = true
-- ORDER BY embedding <=> query_embedding
-- LIMIT 5;
```

---

> **Nota**: Este documento es una guia de arquitectura. Los snippets de codigo son pseudocodigo/ejemplos ilustrativos. La implementacion real requerira adaptacion al codebase existente de CobroFlow.
