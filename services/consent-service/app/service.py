"""
Consent business logic — mirrors the pattern of mpi_resolver.py.
"""

import uuid
import logging
from datetime import datetime, timezone
from typing import Optional

import httpx

from . import database
from .config import AUDIT_SERVICE_URL

logger = logging.getLogger("consent.service")
logger.setLevel(logging.INFO)


# ── Consent operations ─────────────────────────────────────────────────────────

def validate_consent(patient_id: str, institution_id: str) -> tuple[bool, Optional[str]]:
    """
    Returns (True, None) when an active, non-expired consent exists.
    Returns (False, reason_code) otherwise.
    """
    record = database.get_active_consent(patient_id, institution_id)

    if not record:
        return False, "CONSENT_NOT_FOUND"

    # Check expiry
    expires_at = record.get("expires_at")
    if expires_at:
        try:
            expiry_dt = datetime.fromisoformat(expires_at)
            if expiry_dt < datetime.now(timezone.utc):
                return False, "CONSENT_EXPIRED"
        except ValueError:
            logger.warning("Could not parse expires_at: %s", expires_at)

    return True, None


def grant_consent(patient_id: str, institution_id: str,
                  expiry: Optional[str] = None,
                  granting_institution: str = "SELF") -> str:
    """
    Creates a new active consent record and returns the new consent_id.
    """
    consent_id = str(uuid.uuid4())
    granted_at = datetime.now(timezone.utc).isoformat()

    database.create_consent(
        consent_id=consent_id,
        patient_id=patient_id,
        granting_institution=granting_institution,
        requesting_institution=institution_id,
        granted_at=granted_at,
        expires_at=expiry,
    )

    logger.info("Consent granted: patient=%s institution=%s id=%s",
                patient_id, institution_id, consent_id)
    return consent_id


def revoke_consent(patient_id: str, institution_id: str) -> bool:
    """
    Revokes the active consent for patient+institution.
    Returns True if a record was found and updated.
    """
    updated = database.revoke_consent(patient_id, institution_id)
    if updated:
        logger.info("Consent revoked: patient=%s institution=%s", patient_id, institution_id)
    else:
        logger.warning("Revoke requested but no active consent found: patient=%s institution=%s",
                       patient_id, institution_id)
    return updated


def get_consents_for_patient(patient_id: str) -> list[dict]:
    return database.get_consents_for_patient(patient_id)


# ── Audit event emission ───────────────────────────────────────────────────────

async def emit_audit_event(
    event_type: str,
    patient_id: str,
    resource_id: str,
    hospital_id: str,
    outcome: str,
    failure_reason: Optional[str] = None,
) -> Optional[str]:
    """
    Fire-and-forget POST to the blockchain-audit-service.
    Returns the blockchain_hash on success, None on failure.
    Mirrors how fhir-service emits audit events via httpx.
    """
    event_id = str(uuid.uuid4())
    payload = {
        "event_id": event_id,
        "event_type": event_type,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "actor": {
            "hospital_id": hospital_id,
            "service": "consent-service",
        },
        "subject": {
            "patient_id": patient_id,
        },
        "resource": {
            "type": "Consent",
            "id": resource_id,
        },
        "outcome": outcome,
        "failure_reason": failure_reason,
    }

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(f"{AUDIT_SERVICE_URL}/audit/log", json=payload)
            resp_data = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
            blockchain_hash = resp_data.get("blockchain_hash")
            logger.info("Audit event emitted: event_id=%s type=%s hash=%s",
                        event_id, event_type, blockchain_hash)
            return blockchain_hash
    except Exception:
        # Audit failure must not break the consent response
        logger.exception("Failed to emit audit event (non-fatal): event_id=%s", event_id)
        return None
