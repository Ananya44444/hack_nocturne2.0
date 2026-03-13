import sqlite3
import json
from .config import DATABASE_PATH

def get_db_connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS events (
            event_id TEXT PRIMARY KEY,
            full_event_json TEXT,
            blockchain_hash TEXT,
            tx_hash TEXT,
            timestamp TEXT
        )
    ''')
    conn.commit()
    conn.close()

def save_event(event_id: str, full_event_json: dict, blockchain_hash: str, tx_hash: str, timestamp: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO events (event_id, full_event_json, blockchain_hash, tx_hash, timestamp)
        VALUES (?, ?, ?, ?, ?)
    ''', (event_id, json.dumps(full_event_json), blockchain_hash, tx_hash, timestamp))
    conn.commit()
    conn.close()

def get_event(event_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM events WHERE event_id = ?', (event_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def get_all_events():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT event_id, blockchain_hash, tx_hash, timestamp FROM events ORDER BY timestamp DESC')
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]
