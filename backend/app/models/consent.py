import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime

from app.database import Base


class Consent(Base):
    __tablename__ = "consents"

    consent_id = Column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    patient_id = Column(String, nullable=False, index=True)
    granting_institution = Column(String, nullable=False)
    requesting_institution = Column(String, nullable=False)
    granted_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    expires_at = Column(DateTime, nullable=True)  # null = indefinite
    status = Column(String, default="active", nullable=False)  # active | revoked
