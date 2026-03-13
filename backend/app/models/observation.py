import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, JSON, Float

from app.database import Base


class Observation(Base):
    __tablename__ = "observations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String, nullable=False, index=True)  # global patient UUID
    code = Column(String, nullable=False)  # e.g. "blood-pressure", "heart-rate"
    display = Column(String, nullable=True)  # human-readable name
    value = Column(Float, nullable=True)
    unit = Column(String, nullable=True)
    value_string = Column(String, nullable=True)  # for non-numeric observations
    effective_date = Column(String, nullable=True)  # ISO date
    status = Column(String, default="final", nullable=False)
    data = Column(JSON, nullable=True)  # full observation JSON
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
