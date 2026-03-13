import sqlite3
import os

DATABASE_PATH = os.getenv("DATABASE_PATH", "mpi.db")

def get_db_connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS mpi_records (
            global_patient_id TEXT PRIMARY KEY,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS identities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            global_patient_id TEXT,
            hospital_id TEXT,
            local_patient_id TEXT,
            FOREIGN KEY(global_patient_id) REFERENCES mpi_records(global_patient_id),
            UNIQUE(hospital_id, local_patient_id)
        )
    ''')
    
    conn.commit()
    conn.close()
