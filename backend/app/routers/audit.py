"""Audit router — list events, verify hash integrity."""

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.schemas.audit import AuditEventResponse, AuditEventListResponse, AuditVerifyResponse
from app.services.auth import get_current_hospital, AuthenticatedHospital
from app.services import audit_service

router = APIRouter(prefix="/api/audit", tags=["Audit Service"])


@router.get("/events", response_model=AuditEventListResponse)
def list_audit_events(
    patient_id: str = Query(None),
    event_type: str = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    hospital: AuthenticatedHospital = Depends(get_current_hospital),
    db: Session = Depends(get_db),
):
    """List audit events with optional filters."""
    events = audit_service.list_events(
        db=db,
        patient_id=patient_id,
        event_type=event_type,
        limit=limit,
        offset=offset,
    )
    return AuditEventListResponse(
        events=[AuditEventResponse.model_validate(e) for e in events],
        count=len(events),
    )


@router.get("/verify/{event_id}", response_model=AuditVerifyResponse)
def verify_audit_event(
    event_id: str,
    hospital: AuthenticatedHospital = Depends(get_current_hospital),
    db: Session = Depends(get_db),
):
    """
    Verify an audit event's hash integrity.
    Recomputes hash from stored fields and compares to stored hash.
    """
    result = audit_service.verify_event(db=db, event_id=event_id)
    return AuditVerifyResponse(**result)


class AuditLogRequest(BaseModel):
    """Payload accepted from trusted microservices to log an audit event."""
    event_type: str
    actor_hospital_id: str
    actor_service: str
    outcome: str
    subject_patient_id: Optional[str] = None
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    failure_reason: Optional[str] = None
    dedup_key: Optional[str] = None  # used by microservice layer for dedup tracking


@router.post("/log", response_model=AuditEventResponse, status_code=201)
def log_audit_event(
    body: AuditLogRequest,
    hospital: AuthenticatedHospital = Depends(get_current_hospital),
    db: Session = Depends(get_db),
):
    """
    Accept an audit event from a trusted microservice (e.g. fhir-microservice).
    Stores it with the same SHA-256 hash as internally generated events.
    dedup_key is stored in failure_reason field if no failure_reason is provided,
    so analytics can suppress duplicate events without a schema migration.
    """
    failure_reason = body.failure_reason
    if not failure_reason and body.dedup_key:
        failure_reason = f"dedup:{body.dedup_key}"

    event = audit_service.log_event(
        db=db,
        event_type=body.event_type,
        actor_hospital_id=body.actor_hospital_id,
        actor_service=body.actor_service,
        outcome=body.outcome,
        subject_patient_id=body.subject_patient_id,
        resource_type=body.resource_type,
        resource_id=body.resource_id,
        failure_reason=failure_reason,
    )
    return AuditEventResponse.model_validate(event)
