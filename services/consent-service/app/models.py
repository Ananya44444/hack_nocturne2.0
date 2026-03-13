from pydantic import BaseModel
from typing import List, Optional


# ── Request / Response models ──────────────────────────────────────────────────

class ValidateRequest(BaseModel):
    patient_id: str
    institution_id: str

class ValidateResponse(BaseModel):
    valid: bool
    reason: Optional[str] = None


class GrantRequest(BaseModel):
    patient_id: str
    institution_id: str
    expiry: Optional[str] = None   # ISO-8601 timestamp or null

class GrantResponse(BaseModel):
    consent_id: str
    status: str


class RevokeRequest(BaseModel):
    patient_id: str
    institution_id: str

class RevokeResponse(BaseModel):
    revoked: bool


class ConsentRecord(BaseModel):
    consent_id: str
    patient_id: str
    granting_institution: str
    requesting_institution: str
    granted_at: str
    expires_at: Optional[str] = None
    status: str
    blockchain_hash: Optional[str] = None

class ConsentListResponse(BaseModel):
    patient_id: str
    consents: List[ConsentRecord]


# ── Shared error envelope ──────────────────────────────────────────────────────

class ErrorResponse(BaseModel):
    error: bool = True
    code: str
    message: str
    event_id: str


# ── Audit-event sub-models (mirrors blockchain-audit-service/app/models.py) ───

class AuditActor(BaseModel):
    hospital_id: str
    service: str = "consent-service"

class AuditSubject(BaseModel):
    patient_id: str

class AuditResource(BaseModel):
    type: str = "Consent"
    id: str

class AuditEventPayload(BaseModel):
    event_id: str
    event_type: str
    timestamp: str
    actor: AuditActor
    subject: AuditSubject
    resource: AuditResource
    outcome: str
    failure_reason: Optional[str] = None
