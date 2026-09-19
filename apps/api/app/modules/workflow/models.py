from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime
from app.core.database import Base


class WorkflowRule(Base):
    __tablename__ = "wf_rules"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    event_pattern = Column(String(100), nullable=False, index=True)  # e.g. "order.created", "order.*", "*"
    action_type = Column(String(100), nullable=False)  # "NOTIFY", "LOG", "WEBHOOK"
    action_payload = Column(Text, default="{}", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class WorkflowLog(Base):
    __tablename__ = "wf_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    rule_name = Column(String(255), nullable=False)
    event_name = Column(String(100), nullable=False)
    status = Column(String(50), default="SUCCESS", nullable=False)  # SUCCESS, FAILED
    output = Column(Text, default="", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
