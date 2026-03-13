import logging
import uuid
import asyncio
from typing import List

from fastapi import APIRouter, HTTPException

from .models import (
    ValidateRequest, ValidateResponse,
    GrantRequest, GrantResponse,
    RevokeRequest, RevokeResponse,
    ConsentRecord, ConsentListResponse,
    ErrorResponse,
)
from . import service

logger = logging.getLogger("consent.routes")
logger.setLevel(logging.INFO)

router = APIRouter(prefix="/consent", tags=["Consent"])


# ── POST /consent/validate ─────────────────────────────────────────────────────

@router.post("/validate", response_model=ValidateResponse)
async def validate_consent(request: ValidateRequest):
    """
    Validates whether the requesting institution has active consent
    for the given patient.
    """
    valid, reason = service.validate_consent(request.patient_id, request.institution_id)

    if not valid:
        # Emit ACCESS_DENIED audit event (fire-and-forget)
        asyncio.create_task(service.emit_audit_event(
            event_type="ACCESS_DENIED",
            patient_id=request.patient_id,
            resource_id=request.patient_id,
            hospital_id=request.institution_id,
            outcome="FAILURE",
            failure_reason=reason,
        ))
        return ValidateResponse(valid=False, reason=reason)

    return ValidateResponse(valid=True)


# ── POST /consent/grant ────────────────────────────────────────────────────────

@router.post("/grant", response_model=GrantResponse)
async def grant_consent(request: GrantRequest):
    """
    Creates a new active consent record for a patient-institution pair.
    Emits a CONSENT_UPDATE audit event.
    """
    try:
        consent_id = service.grant_consent(
            patient_id=request.patient_id,
            institution_id=request.institution_id,
            expiry=request.expiry,
        )
    except Exception as e:
        logger.exception("Failed to grant consent")
        raise HTTPException(status_code=500, detail=str(e))

    # Emit CONSENT_UPDATE audit event (fire-and-forget)
    asyncio.create_task(service.emit_audit_event(
        event_type="CONSENT_UPDATE",
        patient_id=request.patient_id,
        resource_id=consent_id,
        hospital_id=request.institution_id,
        outcome="SUCCESS",
    ))

    return GrantResponse(consent_id=consent_id, status="active")


# ── POST /consent/revoke ───────────────────────────────────────────────────────

@router.post("/revoke", response_model=RevokeResponse)
async def revoke_consent(request: RevokeRequest):
    """
    Revokes an active consent record for a patient-institution pair.
    Emits a CONSENT_UPDATE audit event.
    """
    updated = service.revoke_consent(request.patient_id, request.institution_id)

    if not updated:
        event_id = str(uuid.uuid4())
        raise HTTPException(
            status_code=404,
            detail={
                "error": True,
                "code": "CONSENT_NOT_FOUND",
                "message": "No active consent for this institution.",
                "event_id": event_id,
            }
        )

    # Emit CONSENT_UPDATE audit event (fire-and-forget)
    asyncio.create_task(service.emit_audit_event(
        event_type="CONSENT_UPDATE",
        patient_id=request.patient_id,
        resource_id=request.patient_id,
        hospital_id=request.institution_id,
        outcome="SUCCESS",
    ))

    return RevokeResponse(revoked=True)


# ── GET /consent/{patient_id} ──────────────────────────────────────────────────

@router.get("/{patient_id}", response_model=ConsentListResponse)
async def get_patient_consents(patient_id: str):
    """
    Returns all active consent records for a given patient.
    """
    records = service.get_consents_for_patient(patient_id)
    consents = [
        ConsentRecord(
            consent_id=r["consent_id"],
            patient_id=r["patient_id"],
            granting_institution=r["granting_institution"],
            requesting_institution=r["requesting_institution"],
            granted_at=r["granted_at"],
            expires_at=r.get("expires_at"),
            status=r["status"],
            blockchain_hash=r.get("blockchain_hash"),
        )
        for r in records
    ]
    return ConsentListResponse(patient_id=patient_id, consents=consents)
