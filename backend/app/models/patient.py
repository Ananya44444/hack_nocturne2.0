import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, Text, JSON

from app.database import Base


class Patient(Base):
    __tablename__ = "patients"

    global_id = Column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    hospital_id = Column(String, nullable=False, index=True)
    local_patient_id = Column(String, nullable=False)
    given_name = Column(String, nullable=True)
    family_name = Column(String, nullable=True)
    birth_date = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    data = Column(JSON, nullable=True)  # Full demographics JSON
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
