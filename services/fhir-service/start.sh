#!/bin/bash
set -e

echo "Starting FHIR Microservice on port 8001..."
echo "Backend URL: ${BACKEND_URL:-http://localhost:8000/api}"

exec uvicorn app.main:app --host 0.0.0.0 --port 8001
