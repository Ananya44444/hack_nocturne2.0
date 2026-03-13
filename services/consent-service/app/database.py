import sqlite3
import os
from .config import DATABASE_PATH


def get_db_connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS consent_records (
            consent_id          TEXT PRIMARY KEY,
            patient_id          TEXT NOT NULL,
            granting_institution TEXT NOT NULL,
            requesting_institution TEXT NOT NULL,
            granted_at          TEXT NOT NULL,
            expires_at          TEXT,
            status              TEXT NOT NULL DEFAULT 'active',
            blockchain_hash     TEXT
        )
    ''')

    conn.commit()
    conn.close()


# ── Write helpers ──────────────────────────────────────────────────────────────

def create_consent(consent_id: str, patient_id: str, granting_institution: str,
                   requesting_institution: str, granted_at: str,
                   expires_at: str | None, blockchain_hash: str | None = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO consent_records
            (consent_id, patient_id, granting_institution, requesting_institution,
             granted_at, expires_at, status, blockchain_hash)
        VALUES (?, ?, ?, ?, ?, ?, 'active', ?)
    ''', (consent_id, patient_id, granting_institution, requesting_institution,
          granted_at, expires_at, blockchain_hash))
    conn.commit()
    conn.close()


def revoke_consent(patient_id: str, requesting_institution: str) -> bool:
    """
    Marks the most recent active consent record for this patient+institution
    as revoked. Returns True if a row was updated.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE consent_records
        SET status = 'revoked'
        WHERE patient_id = ?
          AND requesting_institution = ?
          AND status = 'active'
    ''', (patient_id, requesting_institution))
    updated = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return updated


# ── Read helpers ───────────────────────────────────────────────────────────────

def get_active_consent(patient_id: str, requesting_institution: str) -> dict | None:
    """
    Returns the first active, non-expired consent record for this
    patient + requesting institution, or None if none exists.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM consent_records
        WHERE patient_id = ?
          AND requesting_institution = ?
          AND status = 'active'
        ORDER BY granted_at DESC
        LIMIT 1
    ''', (patient_id, requesting_institution))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None


def get_consents_for_patient(patient_id: str) -> list[dict]:
    """
    Returns all active consent records for a patient.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM consent_records
        WHERE patient_id = ?
          AND status = 'active'
        ORDER BY granted_at DESC
    ''', (patient_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]
