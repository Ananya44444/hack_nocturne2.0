#!/bin/bash

# Navigate to the script's directory (ensures it works regardless of where it's called from)
cd "$(dirname "$0")"

echo "========================================="
echo "Starting Blockchain Audit Service"
echo "========================================="

# 1. Start setup for the local blockchain
echo "Initializing local blockchain..."
cd blockchain
npm install

# Kill any existing hardhat node on 8545 to prevent port conflicts
echo "Cleaning up any existing old nodes on 8545..."
fuser -k 8545/tcp 2>/dev/null

echo "Starting Hardhat node in background..."
npx hardhat node > hardhat_node.log 2>&1 &
HARDHAT_PID=$!

echo "Waiting for blockchain node to boot (5 seconds)..."
sleep 5

echo "Deploying Smart Contract to local blockchain..."
npx hardhat run scripts/deploy.js --network localhost

# Navigate back to the python directory
cd ..

# 2. Setup Python environment
echo "Setting up Python Backend..."
if [ ! -d "venv" ]; then
    echo "Virtual environment 'venv' not found. Creating..."
    python3 -m venv venv
fi

echo "Activating virtual environment and installing dependencies..."
source venv/bin/activate
pip install -r requirements.txt

# Set environment variables
export SERVICE_PORT=${SERVICE_PORT:-8005}

# 3. Define cleanup process to ensure background Hardhat node dies when script exits
cleanup() {
    echo ""
    echo "Shutting down services..."
    kill $HARDHAT_PID
    exit
}

# Trap termination signals (CTRL+C) so the cleanup script runs
trap cleanup SIGINT SIGTERM

echo "========================================="
echo "Blockchain API is ready on port $SERVICE_PORT"
echo "Press CTRL+C to stop both FastAPI and Hardhat"
echo "========================================="

# Start the uvicorn server in the foreground
python3 -m uvicorn app.main:app --host 0.0.0.0 --port $SERVICE_PORT --reload
