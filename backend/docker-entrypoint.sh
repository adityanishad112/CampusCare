#!/bin/sh
set -e

echo "Waiting for database connection..."
python -c '
import time, sys
from app.core.database import engine
for attempt in range(1, 31):
    try:
        with engine.connect() as conn:
            print("Database connection established successfully!")
            sys.exit(0)
    except Exception as e:
        print(f"Waiting for database to become available (attempt {attempt}/30)...")
        time.sleep(2)
print("Warning: Could not verify database connection within timeout. Proceeding...")
'

# Run Alembic migrations
echo "Running database migrations..."
alembic upgrade head || true

# Seed database if needed
echo "Checking and seeding initial data..."
python scripts/seed_data.py || true

PORT="${PORT:-10000}"
echo "Starting CampusCare backend server on port $PORT..."
exec uvicorn app.main:app --host 0.0.0.0 --port "$PORT"
