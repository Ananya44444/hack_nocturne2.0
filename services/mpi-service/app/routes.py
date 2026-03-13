from fastapi import APIRouter, HTTPException
from .models import IdentityRequest, ResolveResponse, PatientIdentitiesResponse
from . import mpi_resolver

router = APIRouter(prefix="/mpi", tags=["Master Patient Index"])

@router.post("/register", response_model=ResolveResponse)
async def register_identity(request: IdentityRequest):
    """
    Registers a new patient identity mapping.
    If it exists, simply returns the existing global_patient_id.
    """
    try:
        global_id = mpi_resolver.resolve_or_create_identity(
            request.hospital_id,
            request.local_patient_id
        )
        return ResolveResponse(global_patient_id=global_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/resolve", response_model=ResolveResponse)
async def resolve_identity_post(request: IdentityRequest):
    """
    Resolves an existing patient identity map from a POST request body.
    """
    global_id = mpi_resolver.resolve_identity(request.hospital_id, request.local_patient_id)
    if not global_id:
        raise HTTPException(status_code=404, detail="Identity mapping not found")
    
    return ResolveResponse(global_patient_id=global_id)

@router.get("/resolve", response_model=ResolveResponse)
async def resolve_identity_get(hospital_id: str, local_patient_id: str):
    """
    Resolves an existing patient identity map from GET query parameters.
    """
    global_id = mpi_resolver.resolve_identity(hospital_id, local_patient_id)
    if not global_id:
        raise HTTPException(status_code=404, detail="Identity mapping not found")
    
    return ResolveResponse(global_patient_id=global_id)

@router.get("/{global_patient_id}", response_model=PatientIdentitiesResponse)
async def get_patient_identities(global_patient_id: str):
    """
    Returns all hospital identities linked to a single MPI UUID.
    """
    result = mpi_resolver.get_patient_identities(global_patient_id)
    if not result:
        raise HTTPException(status_code=404, detail="Global Patient ID not found")
    return result
