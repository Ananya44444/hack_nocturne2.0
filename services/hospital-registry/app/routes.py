from fastapi import APIRouter, HTTPException
from app.models import HospitalCreate, Hospital, HospitalValidate, ValidationResponse
from app.registry_manager import register_hospital, validate_hospital, get_all_hospitals
from typing import List

router = APIRouter()

@router.post("/register", status_code=201)
async def register(hospital: HospitalCreate):
    success = register_hospital(hospital)
    if not success:
        raise HTTPException(status_code=400, detail="Hospital ID already registered")
    return {"message": "Hospital registered successfully"}

@router.post("/validate", response_model=ValidationResponse)
async def validate(creds: HospitalValidate):
    is_valid = validate_hospital(creds)
    return {"valid": is_valid}

@router.get("/hospitals", response_model=List[Hospital])
async def list_hospitals():
    return get_all_hospitals()
