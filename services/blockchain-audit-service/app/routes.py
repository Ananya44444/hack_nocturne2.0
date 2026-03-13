from fastapi import APIRouter, HTTPException, Depends
from .models import AuditEvent, LogEventResponse, VerifyEventResponse, HealthResponse
from .hash_service import compute_hash
from .blockchain_client import BlockchainClient
from . import database
import json

router = APIRouter(prefix="/audit", tags=["Audit"])

blockchain_client = BlockchainClient()

@router.post("/log", response_model=LogEventResponse)
async def log_audit_event(event: AuditEvent):
    try:
        # Extract fields
        event_id = event.event_id
        patient_id = event.subject.patient_id
        hospital_id = event.actor.hospital_id
        timestamp = event.timestamp
        
        # Compute SHA-256 hash
        blockchain_hash = compute_hash(event_id, patient_id, hospital_id, timestamp)
        
        # Write to Blockchain
        tx_hash = blockchain_client.log_event(event_id, blockchain_hash)
        
        # Save locally
        # event.model_dump() is standard in Pydantic V2
        full_event_dict = event.model_dump()
        database.save_event(event_id, full_event_dict, blockchain_hash, tx_hash, timestamp)
        
        return LogEventResponse(
            event_id=event_id,
            blockchain_hash=blockchain_hash,
            tx_hash=tx_hash
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/verify/{event_id}", response_model=VerifyEventResponse)
async def verify_audit_event(event_id: str):
    try:
        local_event = database.get_event(event_id)
        if not local_event:
            raise HTTPException(status_code=404, detail="Event not found in local database")
        
        # Load local event JSON to recompute the hash
        event_json = json.loads(local_event['full_event_json'])
        
        patient_id = event_json.get('subject', {}).get('patient_id')
        hospital_id = event_json.get('actor', {}).get('hospital_id')
        timestamp = event_json.get('timestamp')
        
        if not all([patient_id, hospital_id, timestamp]):
            raise HTTPException(status_code=400, detail="Local event is missing required fields for hash computation")
            
        local_computed_hash = compute_hash(event_id, patient_id, hospital_id, timestamp)
        
        # verify on blockchain
        is_verified = blockchain_client.verify_event(event_id, local_computed_hash)
        
        return VerifyEventResponse(
            verified=is_verified,
            chain_hash=local_event['blockchain_hash'] if is_verified else None,
            local_hash=local_computed_hash
        )
            
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/events")
async def get_all_events():
    try:
        events = database.get_all_events()
        return events
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health", response_model=HealthResponse)
async def check_health():
    is_connected = blockchain_client.is_connected()
    return HealthResponse(
        service="python-blockchain-backend",
        blockchain_connected=is_connected
    )
