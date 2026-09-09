#!/bin/sh
set -e

echo "Waiting for database to be ready..."
# Run Alembic migrations
echo "Running database migrations..."
alembic upgrade head || true

# Seed database if needed
echo "Checking and seeding initial data..."
python scripts/seed_data.py || true

echo "Starting CampusCare backend server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
