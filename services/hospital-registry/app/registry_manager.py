from app.database import get_db_connection
from app.models import HospitalCreate, HospitalValidate
import sqlite3

def register_hospital(hospital: HospitalCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO hospitals (hospital_id, hospital_name, api_key) VALUES (?, ?, ?)",
            (hospital.hospital_id, hospital.hospital_name, hospital.api_key)
        )
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()

def validate_hospital(creds: HospitalValidate):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT 1 FROM hospitals WHERE hospital_id = ? AND api_key = ?",
        (creds.hospital_id, creds.api_key)
    )
    result = cursor.fetchone()
    conn.close()
    return result is not None

def get_all_hospitals():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT hospital_id, hospital_name, created_at FROM hospitals")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]
