import uuid
from . import database

def resolve_or_create_identity(hospital_id: str, local_patient_id: str) -> str:
    """
    Checks if the hospital_id + local_patient_id mapping already exists.
    If it does, returns the existing global_patient_id.
    If it does not, generates a new UUIDv4, creates the record, and returns it.
    """
    conn = database.get_db_connection()
    cursor = conn.cursor()
    
    # Check if identity exists
    cursor.execute('''
        SELECT global_patient_id FROM identities
        WHERE hospital_id = ? AND local_patient_id = ?
    ''', (hospital_id, local_patient_id))
    
    row = cursor.fetchone()
    
    if row:
        conn.close()
        return row['global_patient_id']
    
    # Identity does not exist, create a new mapping
    new_global_id = str(uuid.uuid4())
    
    try:
        # Create MPI record
        cursor.execute('''
            INSERT INTO mpi_records (global_patient_id)
            VALUES (?)
        ''', (new_global_id,))
        
        # Create identity mapping
        cursor.execute('''
            INSERT INTO identities (global_patient_id, hospital_id, local_patient_id)
            VALUES (?, ?, ?)
        ''', (new_global_id, hospital_id, local_patient_id))
        
        conn.commit()
    except sqlite3.IntegrityError:
        # Failsafe in case of extremely unlikely race conditions where the identical
        # request comes in twice at the exact same millisecond before commit
        conn.rollback()
        cursor.execute('''
            SELECT global_patient_id FROM identities
            WHERE hospital_id = ? AND local_patient_id = ?
        ''', (hospital_id, local_patient_id))
        row = cursor.fetchone()
        if row:
            new_global_id = row['global_patient_id']
    
    conn.close()
    return new_global_id

def resolve_identity(hospital_id: str, local_patient_id: str) -> str | None:
    """
    Strictly resolves an identity. Does not create one.
    Returns None if no mapping exists.
    """
    conn = database.get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT global_patient_id FROM identities
        WHERE hospital_id = ? AND local_patient_id = ?
    ''', (hospital_id, local_patient_id))
    
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return row['global_patient_id']
    return None

def get_patient_identities(global_patient_id: str) -> dict | None:
    """
    Returns all hospital identities linked to a single MPI UUID.
    """
    conn = database.get_db_connection()
    cursor = conn.cursor()
    
    # Check if the MPI record itself exists
    cursor.execute('SELECT created_at FROM mpi_records WHERE global_patient_id = ?', (global_patient_id,))
    mpi_row = cursor.fetchone()
    
    if not mpi_row:
        conn.close()
        return None
        
    created_at = mpi_row['created_at']
    
    # Fetch all linked identities
    cursor.execute('''
        SELECT hospital_id, local_patient_id FROM identities
        WHERE global_patient_id = ?
    ''', (global_patient_id,))
    
    identity_rows = cursor.fetchall()
    conn.close()
    
    identities = [
        {"hospital_id": r['hospital_id'], "local_patient_id": r['local_patient_id']}
        for r in identity_rows
    ]
    
    return {
        "global_patient_id": global_patient_id,
        "identities": identities,
        "created_at": created_at
    }
