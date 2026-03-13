#!/bin/bash

# Navigate to the service directory
cd "$(dirname "$0")"

# Set PYTHONPATH to the current directory so 'app' module can be found
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Start the FastAPI application on port 9001 using uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 9001
