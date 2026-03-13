import os
from dotenv import load_dotenv

load_dotenv()

SERVICE_PORT = int(os.getenv("SERVICE_PORT", 8002))
DATABASE_PATH = os.getenv("DATABASE_PATH", "consent.db")
AUDIT_SERVICE_URL = os.getenv("AUDIT_SERVICE_URL", "http://localhost:8005")
