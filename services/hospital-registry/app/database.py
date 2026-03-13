import sqlite3
import os

DATABASE_URL = os.getenv("DATABASE_URL", "hospital_registry.db")

def get_db_connection():
    conn = sqlite3.connect(DATABASE_URL)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS hospitals (
            hospital_id TEXT PRIMARY KEY,
            hospital_name TEXT NOT NULL,
            api_key TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()
