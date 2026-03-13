import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, JSON

from app.database import Base


class Encounter(Base):
    __tablename__ = "encounters"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String, nullable=False, index=True)  # global patient UUID
    encounter_class = Column(String, nullable=True)  # ambulatory, emergency, inpatient
    type_code = Column(String, nullable=True)
    type_display = Column(String, nullable=True)
    status = Column(String, default="finished", nullable=False)
    period_start = Column(String, nullable=True)  # ISO datetime
    period_end = Column(String, nullable=True)
    provider = Column(String, nullable=True)
    data = Column(JSON, nullable=True)  # full encounter JSON
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
