from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime
from app.core.database import Base


class Customer(Base):
    __tablename__ = "crm_customers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(50), nullable=True)
    company = Column(String(255), nullable=True)
    status = Column(String(50), default="LEAD", nullable=False)  # LEAD, ACTIVE, INACTIVE
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
