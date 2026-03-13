import os
from dotenv import load_dotenv

load_dotenv()

BLOCKCHAIN_RPC_URL = os.getenv("BLOCKCHAIN_RPC_URL", "http://127.0.0.1:8545")
SMART_CONTRACT_ADDRESS = os.getenv("SMART_CONTRACT_ADDRESS")
CONTRACT_ABI_PATH = os.getenv("CONTRACT_ABI_PATH", "./contracts/AuditLogger.json")
WALLET_PRIVATE_KEY = os.getenv("WALLET_PRIVATE_KEY", "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80")
CHAIN_ID = int(os.getenv("CHAIN_ID", 31337))
SERVICE_PORT = int(os.getenv("SERVICE_PORT", 8005))
DATABASE_PATH = os.getenv("DATABASE_PATH", "audit_events.db")
