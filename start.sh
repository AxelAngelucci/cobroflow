#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/cobro-flow-backend"
FRONTEND_DIR="$ROOT_DIR/cobro-flow-frontend"

RUN_BACK=false
RUN_FRONT=false

case "$1" in
    --back)  RUN_BACK=true ;;
    --front) RUN_FRONT=true ;;
    "")      RUN_BACK=true; RUN_FRONT=true ;;
    *)
        echo "Uso: ./start.sh [--back | --front]"
        echo "  Sin flags  → levanta backend y frontend"
        echo "  --back     → solo backend"
        echo "  --front    → solo frontend"
        exit 1
        ;;
esac

cleanup() {
    echo ""
    echo "Deteniendo servicios..."
    kill $PID_BACK $PID_FRONT 2>/dev/null
    wait $PID_BACK $PID_FRONT 2>/dev/null
    echo "Servicios detenidos."
    exit 0
}

trap cleanup SIGINT SIGTERM

if $RUN_BACK; then
    echo "Iniciando backend..."
    cd "$BACKEND_DIR"
    source venv/bin/activate
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
echo "  Ctrl+C para detener"
echo "========================================"
echo ""

wait
