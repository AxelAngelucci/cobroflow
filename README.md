# CobroFlow

Sistema de gestión de cobranzas con IA integrada.

## Estructura del Proyecto

```
CobroFlow/
├── cobro-flow-backend/    # API REST con FastAPI (Python)
├── cobro-flow-frontend/   # Aplicación web con Angular
└── start.sh               # Script de inicio
```

## Backend

- **Framework:** FastAPI (Python)
- **Base de datos:** PostgreSQL con SQLAlchemy
- **Migraciones:** Alembic
- **IA:** Integración con Vertex AI (Google Cloud)
- **Deploy:** Google Cloud Run + Cloud Build

### Levantar el backend

```bash
cd cobro-flow-backend

# Crear y activar el entorno virtual
python -m venv venv

# En Windows:
venv\Scripts\activate
# En Linux/Mac:
source venv/bin/activate

cp .env.example .env  # Configurar variables de entorno
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Frontend

- **Framework:** Angular
- **Estilos:** Tailwind CSS
- **Iconos:** Lucide Angular

### Levantar el frontend

```bash
cd cobro-flow-frontend
npm install
ng serve
```
