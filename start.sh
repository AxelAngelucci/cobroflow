#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/cobro-flow-backend"
FRONTEND_DIR="$ROOT_DIR/cobro-flow-frontend"

RUN_BACK=false
RUN_FRONT=false
FORCE_LOCAL=false

for arg in "$@"; do
    case "$arg" in
        --back)  RUN_BACK=true ;;
        --front) RUN_FRONT=true ;;
        :local)  FORCE_LOCAL=true ;;
        --local) FORCE_LOCAL=true ;;
        --help|-h)
            echo "Uso: ./start.sh [--back] [--front] [:local | --local]"
            echo ""
            echo "  Sin flags    → levanta backend y frontend"
            echo "  --back       → solo backend"
            echo "  --front      → solo frontend"
            echo "  :local       → fuerza base de datos local (APP_ENV=local)"
            echo ""
            echo "  Auto-detección de entorno:"
            echo "    K_SERVICE seteado  → production (GCP Cloud SQL)"
            echo "    Sin K_SERVICE      → local PostgreSQL"
            exit 0
            ;;
        *)
            echo "Argumento desconocido: $arg  (usa --help para ayuda)"
            exit 1
            ;;
    esac
done

# Si no se especificó back ni front, levanta ambos
if ! $RUN_BACK && ! $RUN_FRONT; then
    RUN_BACK=true
    RUN_FRONT=true
fi

# Forzar APP_ENV=local si se pasa :local / --local
if $FORCE_LOCAL; then
    export APP_ENV=local
    echo "[env] Forzando APP_ENV=local → PostgreSQL local"
fi

cleanup() {
    echo ""
    echo "Deteniendo servicios..."
    kill $PID_BACK $PID_FRONT 2>/dev/null || true
    wait $PID_BACK $PID_FRONT 2>/dev/null || true
    echo "Servicios detenidos."
    exit 0
}

trap cleanup SIGINT SIGTERM

# Detectar path de activación del venv (Unix: bin/activate, Windows: Scripts/activate)
if $RUN_BACK; then
    echo "Iniciando backend..."
    cd "$BACKEND_DIR"

    if [ -f "venv/bin/activate" ]; then
        source venv/bin/activate
    elif [ -f "venv/Scripts/activate" ]; then
        source venv/Scripts/activate
    else
        echo "ERROR: venv no encontrado en $BACKEND_DIR/venv"
        exit 1
    fi

    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
    PID_BACK=$!
fi

if $RUN_FRONT; then
    echo "Iniciando frontend..."
    cd "$FRONTEND_DIR"
    npm start &
    PID_FRONT=$!
fi

echo ""
echo "========================================"
echo "  CobroFlow corriendo"
$RUN_BACK  && echo "  Backend:  http://localhost:8000"
$RUN_BACK  && echo "  Docs:     http://localhost:8000/docs"
$RUN_FRONT && echo "  Frontend: http://localhost:4200"
$FORCE_LOCAL && echo "  DB:       PostgreSQL local (localhost/cobroflow)"
echo "  Ctrl+C para detener"
echo "========================================"
echo ""

wait
