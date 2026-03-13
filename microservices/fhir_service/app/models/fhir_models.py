from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

# ------------------------------------------------------------------
# Used by POST /fhir/ingest
# ------------------------------------------------------------------
class FHIRIngestPayload(BaseModel):
    local_patient_id: str = Field(..., description="Hospital-internal patient ID")
    hospital_id: str = Field(..., description="Submitting hospital ID")
    data: Dict[str, Any] = Field(..., description="Raw hospital data to convert to FHIR")

# ------------------------------------------------------------------
# Observation sub-model inside raw ingest data
# ------------------------------------------------------------------
class RawObservation(BaseModel):
    code: str = Field(..., description="Observation code e.g. 'ICD11:TM2-05.02'")
    value: Optional[str] = None
    unit: Optional[str] = None
    status: Optional[str] = "final"

# ------------------------------------------------------------------
# Encounter sub-model inside raw ingest data
# ------------------------------------------------------------------
class RawEncounter(BaseModel):
    status: Optional[str] = "finished"
    class_code: Optional[str] = "AMB"
    start: Optional[str] = None   # ISO datetime string
    end: Optional[str] = None     # ISO datetime string

# ------------------------------------------------------------------
# Full raw hospital data shape expected inside FHIRIngestPayload.data
# ------------------------------------------------------------------
class RawHospitalData(BaseModel):
    name: Optional[str] = None
    gender: Optional[str] = None
    birth_date: Optional[str] = None          # "YYYY-MM-DD"
    observations: Optional[List[RawObservation]] = []
    encounters: Optional[List[RawEncounter]] = []

# ------------------------------------------------------------------
# Audit event emitted after every successful retrieval
# ------------------------------------------------------------------
class AuditEvent(BaseModel):
    event_type: str = "DATA_ACCESS"
    performed_by: str                          # hospital_id of requester
    resource_type: str                         # Patient / Observation / Encounter / Bundle
    resource_id: str
    timestamp: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = {}