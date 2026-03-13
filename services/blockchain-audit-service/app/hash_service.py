import hashlib

def compute_hash(event_id: str, patient_id: str, hospital_id: str, timestamp: str) -> str:
    """
    Computes a SHA-256 hash using the specified inputs:
    event_id + patient_id + hospital_id + timestamp
    """
    hash_input = f"{event_id}{patient_id}{hospital_id}{timestamp}"
    return hashlib.sha256(hash_input.encode('utf-8')).hexdigest()
