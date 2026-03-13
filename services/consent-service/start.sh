#!/bin/bash

# Navigate to the script's directory (ensures it works regardless of where it's called from)
cd "$(dirname "$0")"

echo "========================================="
echo "Starting Consent Service"
echo "========================================="

if [ ! -d "venv" ]; then
    echo "Virtual environment 'venv' not found. Creating..."
    python3 -m venv venv
fi

echo "Activating virtual environment and installing dependencies..."
source venv/bin/activate
pip install -r requirements.txt

echo "Starting FastAPI server on port 8002..."
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8002 --reload
