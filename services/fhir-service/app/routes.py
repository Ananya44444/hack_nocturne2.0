"""
Async FHIR Microservice Routes (port 8001)
Reworked from original to be async-safe and robust.
"""

from datetime import datetime, timezone
from typing import Any, Dict, Optional
import asyncio
import logging
import os

import httpx
from fastapi import APIRouter, Body, Header, HTTPException, status
from app.models.fhir_models import FHIRIngestPayload

logger = logging.getLogger("fhir.microservice")
logger.setLevel(logging.INFO)

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000/api")
REQUEST_TIMEOUT = float(os.getenv("REQUEST_TIMEOUT", "10.0"))

router = APIRouter(prefix="/fhir", tags=["FHIR"])


# -------------------
# Utilities
# -------------------

def _auth_headers(hospital_id: str, api_key: str) -> Dict[str, str]:
    return {
        "X-Hospital-ID": hospital_id,
        "X-API-Key": api_key,
        "Accept": "application/json",
        "Content-Type": "application/json",
    }


# _fhir_to_dict_compat removed (data is already dict)


async def _safe_backend_request(
    method: str,
    path: str,
    hospital_id: str,
    api_key: str,
    json: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    url = f"{BACKEND_URL}{path}"
    headers = _auth_headers(hospital_id, api_key)
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        try:
            resp = await client.request(method, url, headers=headers, json=json)
        except httpx.ConnectError:
            logger.exception("Backend connection error")
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Backend unavailable")
        except httpx.ReadTimeout:
            logger.exception("Backend request timed out")
            raise HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail="Backend timed out")
        except Exception as e:
            logger.exception("Unexpected HTTP client error")
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Backend request failed")

    # Try to parse JSON safely (avoid exposing raw HTML)
    content_type = resp.headers.get("Content-Type", "")
    resp_body: Any = None
    if "application/json" in content_type:
        try:
            resp_body = resp.json()
        except Exception:
            resp_body = None

    # Map status codes to HTTPExceptions
    if resp.status_code == 404:
        detail = resp_body.get("detail") if isinstance(resp_body, dict) else "Not found"
        raise HTTPException(status_code=404, detail=detail)
    if resp.status_code == 403:
        detail = resp_body.get("detail") if isinstance(resp_body, dict) else "Access denied"
        raise HTTPException(status_code=403, detail=detail)
    if not resp.is_success:
        # For non-success responses, provide sanitized message
        detail = resp_body if isinstance(resp_body, dict) else f"Backend error {resp.status_code}"
        logger.warning("Backend returned error %s: %s", resp.status_code, detail)
        raise HTTPException(status_code=resp.status_code, detail=detail)

    return resp_body if resp_body is not None else {}


async def _emit_microservice_audit_async(
    hospital_id: str,
    api_key: str,
    resource_type: str,
    resource_id: str,
    subject_patient_id: Optional[str] = None,
):
    """
    Fire-and-forget sending of audit to backend /audit/log.
    Scheduled via asyncio.create_task from the request handler.
    """
    dedup_key = (
        f"DATA_ACCESS|{resource_type}|{resource_id}|{hospital_id}|{datetime.now(timezone.utc).date().isoformat()}"
    )
    payload = {
        "event_type": "DATA_ACCESS",
        "actor_hospital_id": hospital_id,
        "actor_service": "fhir-microservice",
        "outcome": "SUCCESS",
        "subject_patient_id": subject_patient_id or resource_id,
        "resource_type": resource_type,
        "resource_id": resource_id,
        "dedup_key": dedup_key,
    }
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(f"{BACKEND_URL}/audit/log", headers=_auth_headers(hospital_id, api_key), json=payload)
    except Exception:
        # audit failure should not break the response; log for visibility
        logger.exception("Failed to emit microservice audit (non-fatal).")


def _schedule_audit(hospital_id: str, api_key: str, resource_type: str, resource_id: str, subject_patient_id: Optional[str] = None):
    # schedule non-blocking send
    asyncio.create_task(_emit_microservice_audit_async(hospital_id, api_key, resource_type, resource_id, subject_patient_id))


# validation bypassed for python 3.14 compat


# -------------------
# Endpoints
# -------------------

@router.get("/patient/{patient_id}")
async def get_patient(
    patient_id: str,
    x_hospital_id: str = Header(..., alias="X-Hospital-ID"),
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    data = await _safe_backend_request("GET", f"/patient/{patient_id}", x_hospital_id, x_api_key)
    _schedule_audit(x_hospital_id, x_api_key, "Patient", patient_id, subject_patient_id=patient_id)
    return data


@router.get("/observation/{observation_id}")
async def get_observation(
    observation_id: str,
    x_hospital_id: str = Header(..., alias="X-Hospital-ID"),
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    data = await _safe_backend_request("GET", f"/observation/{observation_id}", x_hospital_id, x_api_key)
    subject_id = observation_id
    try:
        subject_id = data.get("subject", {}).get("reference", "").split("/")[-1] or observation_id
    except Exception:
        pass
    _schedule_audit(x_hospital_id, x_api_key, "Observation", observation_id, subject_patient_id=subject_id)
    return data


@router.get("/encounter/{encounter_id}")
async def get_encounter(
    encounter_id: str,
    x_hospital_id: str = Header(..., alias="X-Hospital-ID"),
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    data = await _safe_backend_request("GET", f"/encounter/{encounter_id}", x_hospital_id, x_api_key)
    subject_id = encounter_id
    try:
        subject_id = data.get("subject", {}).get("reference", "").split("/")[-1] or encounter_id
    except Exception:
        pass
    _schedule_audit(x_hospital_id, x_api_key, "Encounter", encounter_id, subject_patient_id=subject_id)
    return data


@router.post("/ingest", status_code=201)
async def ingest_fhir_data(
    payload: FHIRIngestPayload = Body(...),
    x_hospital_id: str = Header(..., alias="X-Hospital-ID"),
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """
    Accept raw hospital data and forward to backend POST /patient/ingest.
    We ensure payload.data is converted to a dict if it's a Pydantic model.
    """
    # payload.data may be a Pydantic model or a plain dict
    raw = payload.data
    if hasattr(raw, "dict"):
        raw_dict = raw.dict(exclude_none=True)
    elif isinstance(raw, dict):
        raw_dict = raw
    else:
        # fallback: try to coerce to dict
        raw_dict = dict(raw) if raw is not None else {}

    # safer name parsing
    name = raw_dict.get("name") or ""
    name_parts = [p for p in name.strip().split(" ") if p]
    given_name = name_parts[0] if len(name_parts) >= 1 else None
    family_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else None

    backend_body = {
        "local_patient_id": payload.local_patient_id,
        "given_name": given_name,
        "family_name": family_name,
        "birth_date": raw_dict.get("birth_date"),
        "gender": raw_dict.get("gender"),
        "phone": raw_dict.get("phone"),
        "address": raw_dict.get("address"),
        "observations": raw_dict.get("observations", []),
        "encounters": raw_dict.get("encounters", []),
    }

    # forward to backend
    result = await _safe_backend_request("POST", "/patient/ingest", x_hospital_id, x_api_key, json=backend_body)

    # schedule audit for created patient/global id if provided
    global_id = result.get("global_id") or result.get("patient", {}).get("id") or payload.local_patient_id
    _schedule_audit(x_hospital_id, x_api_key, "Patient", str(global_id), subject_patient_id=str(global_id))

    return {
        "status": "ingested",
        "global_id": result.get("global_id"),
        "hospital_id": result.get("hospital_id"),
        "observations_created": result.get("observations_created", 0),
        "encounters_created": result.get("encounters_created", 0),
        "patient": result.get("patient"),
    }


@router.get("/bundle/{patient_id}")
async def get_bundle(
    patient_id: str,
    x_hospital_id: str = Header(..., alias="X-Hospital-ID"),
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    data = await _safe_backend_request("GET", f"/bundle/{patient_id}", x_hospital_id, x_api_key)
    _schedule_audit(x_hospital_id, x_api_key, "Bundle", patient_id, subject_patient_id=patient_id)
    return data