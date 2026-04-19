#!/bin/bash
set -e

echo "=== CobroFlow Backend Starting ==="

# Run database migrations
echo "DATABASE_URL prefix: ${DATABASE_URL:0:40}"
echo "Running database migrations..."
python -m alembic upgrade head
echo "Migrations completed."

# Start the application
# Cloud Run sets PORT env var; single worker since Cloud Run scales horizontally
exec uvicorn app.main:app \
    --host 0.0.0.0 \
    --port "${PORT:-8080}" \
    --workers 1 \
    --log-level info \
    --timeout-keep-alive 30
