from pydantic import BaseModel, ConfigDict
from typing import Dict, Any, Optional

class Actor(BaseModel):
    hospital_id: str
    service: str

class Subject(BaseModel):
    patient_id: str

class Resource(BaseModel):
    type: str
    id: str

class AuditEvent(BaseModel):
    # Pydantic v2 compatible
    model_config = ConfigDict(extra='allow')
    
    event_id: str
    event_type: str
    timestamp: str
    actor: Actor
    subject: Subject
    resource: Resource
    outcome: str

class LogEventResponse(BaseModel):
    event_id: str
    blockchain_hash: str
    tx_hash: str

class VerifyEventResponse(BaseModel):
    verified: bool
    chain_hash: Optional[str] = None
    local_hash: str

class HealthResponse(BaseModel):
    service: str
    blockchain_connected: bool
