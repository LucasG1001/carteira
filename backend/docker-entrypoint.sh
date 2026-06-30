#!/bin/sh
set -e

echo "Aplicando migrações do banco..."
alembic upgrade head

echo "Iniciando worker de cotações..."
python -m src.jobs.run_stock_sync &

echo "Iniciando API..."
exec uvicorn src.main:app --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips="*"
