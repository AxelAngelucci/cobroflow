#!/bin/bash
# Migration helper script for CobroFlow
# Usage: ./migrate.sh "migration message"

set -e

if [ -z "$1" ]; then
    echo "Usage: ./migrate.sh \"migration message\""
    echo "Example: ./migrate.sh \"add users table\""
    exit 1
fi

MESSAGE="$1"

echo "🔄 Generating migration: $MESSAGE"
alembic revision --autogenerate -m "$MESSAGE"

echo "⬆️  Applying migration..."
alembic upgrade head

echo "✅ Migration complete!"
