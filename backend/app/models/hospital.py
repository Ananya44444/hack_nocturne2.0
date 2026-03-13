import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime


from app.database import Base


class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(String, primary_key=True)  # e.g. HOSP_001
    name = Column(String, nullable=False)
    api_key = Column(String, nullable=False)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
