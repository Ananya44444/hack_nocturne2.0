from pydantic import BaseModel
from typing import List

class IdentityRequest(BaseModel):
    hospital_id: str
    local_patient_id: str

class ResolveResponse(BaseModel):
    global_patient_id: str

class IdentityMapping(BaseModel):
    hospital_id: str
    local_patient_id: str

class PatientIdentitiesResponse(BaseModel):
    global_patient_id: str
    identities: List[IdentityMapping]
    created_at: str
