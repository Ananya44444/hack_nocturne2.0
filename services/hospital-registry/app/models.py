from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class HospitalBase(BaseModel):
    hospital_id: str
    hospital_name: str

class HospitalCreate(HospitalBase):
    api_key: str

class Hospital(HospitalBase):
    created_at: datetime

    class Config:
        from_attributes = True

class HospitalValidate(BaseModel):
    hospital_id: str
    api_key: str

class ValidationResponse(BaseModel):
    valid: bool
