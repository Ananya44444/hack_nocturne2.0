import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime

from app.database import Base


class MPIRecord(Base):
    __tablename__ = "mpi_records"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    global_patient_id = Column(String, nullable=False, index=True)
    hospital_id = Column(String, nullable=False)
    local_patient_id = Column(String, nullable=False)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
