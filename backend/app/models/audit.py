import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, Text

from app.database import Base


class AuditEvent(Base):
    __tablename__ = "audit_events"

    event_id = Column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    event_type = Column(
        String, nullable=False
    )  # DATA_ACCESS | CONSENT_UPDATE | ACCESS_DENIED
    timestamp = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    actor_hospital_id = Column(String, nullable=False)
    actor_service = Column(
        String, nullable=False
    )  # fhir-service | consent-service | patient-data-service | api-layer
    subject_patient_id = Column(String, nullable=True)  # global patient UUID
    resource_type = Column(
        String, nullable=True
    )  # Patient | Observation | Encounter | Consent
    resource_id = Column(String, nullable=True)
    outcome = Column(String, nullable=False)  # SUCCESS | FAILURE
    failure_reason = Column(
        String, nullable=True
    )  # CONSENT_NOT_FOUND | INVALID_TOKEN | PATIENT_NOT_FOUND | null
    blockchain_hash = Column(String, nullable=True)  # SHA-256 hex string
    tx_hash = Column(String, nullable=True)  # placeholder for blockchain tx hash
