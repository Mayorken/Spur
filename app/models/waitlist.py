from sqlalchemy import Column, String, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from app.db import Base


class Waitlist(Base):
    __tablename__ = "waitlist"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    confirmed = Column(Boolean, default=False, nullable=False)
    confirmed_at = Column(DateTime, nullable=True)
    metro = Column(String(100), nullable=True)  # Which metro they're interested in
    newsletter = Column(Boolean, default=True, nullable=False)  # Opted into newsletter

    def __repr__(self):
        return f"<Waitlist {self.email}>"
