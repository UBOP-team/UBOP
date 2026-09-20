from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from app.core.database import Base


# Backward compatibility model
class Customer(Base):
    __tablename__ = "crm_customers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(50), nullable=True)
    company = Column(String(255), nullable=True)
    status = Column(String(50), default="LEAD", nullable=False)  # LEAD, ACTIVE, INACTIVE
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


# Canonical CRM Domain Models (Salesforce Lightning Reference)

class Lead(Base):
    __tablename__ = "crm_leads"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    organization_id = Column(String(50), default="default", nullable=False)
    owner_id = Column(String(50), default="1", nullable=False)

    first_name = Column(String(100), default="", nullable=False)
    last_name = Column(String(100), nullable=False)
    company_name = Column(String(255), nullable=False)
    job_title = Column(String(150), nullable=True)

    email = Column(String(255), index=True, nullable=True)
    phone = Column(String(50), nullable=True)

    source = Column(String(100), default="WEBSITE", nullable=False)
    status = Column(String(50), default="NEW", nullable=False)  # NEW, CONTACTED, QUALIFYING, QUALIFIED, UNQUALIFIED, CONVERTED

    estimated_value = Column(Float, default=0.0, nullable=False)
    notes = Column(Text, nullable=True)

    provider_reference = Column(String(255), nullable=True)
    sync_status = Column(String(50), default="HEALTHY", nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)


class Account(Base):
    __tablename__ = "crm_accounts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    organization_id = Column(String(50), default="default", nullable=False)
    owner_id = Column(String(50), default="1", nullable=False)

    name = Column(String(255), nullable=False, index=True)
    account_type = Column(String(50), default="PROSPECT", nullable=False)  # PROSPECT, CUSTOMER, PARTNER, SUPPLIER_RELATIONSHIP, OTHER
    industry = Column(String(100), nullable=True)

    website = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)

    billing_address = Column(String(255), nullable=True)
    shipping_address = Column(String(255), nullable=True)

    status = Column(String(50), default="ACTIVE", nullable=False)
    segment = Column(String(50), default="MID_MARKET", nullable=False)

    provider_reference = Column(String(255), nullable=True)
    sync_status = Column(String(50), default="HEALTHY", nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)


class Contact(Base):
    __tablename__ = "crm_contacts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    organization_id = Column(String(50), default="default", nullable=False)
    account_id = Column(Integer, ForeignKey("crm_accounts.id", ondelete="SET NULL"), nullable=True, index=True)
    owner_id = Column(String(50), default="1", nullable=False)

    first_name = Column(String(100), default="", nullable=False)
    last_name = Column(String(100), nullable=False)
    job_title = Column(String(150), nullable=True)
    department = Column(String(100), nullable=True)

    email = Column(String(255), index=True, nullable=True)
    phone = Column(String(50), nullable=True)

    is_primary = Column(Boolean, default=False, nullable=False)

    provider_reference = Column(String(255), nullable=True)
    sync_status = Column(String(50), default="HEALTHY", nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)


class Opportunity(Base):
    __tablename__ = "crm_opportunities"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    organization_id = Column(String(50), default="default", nullable=False)
    account_id = Column(Integer, ForeignKey("crm_accounts.id", ondelete="SET NULL"), nullable=True, index=True)
    owner_id = Column(String(50), default="1", nullable=False)

    name = Column(String(255), nullable=False)
    stage = Column(String(50), default="PROSPECTING", nullable=False)  # PROSPECTING, QUALIFICATION, DISCOVERY, PROPOSAL, NEGOTIATION, CLOSED_WON, CLOSED_LOST

    amount = Column(Float, default=0.0, nullable=False)
    currency = Column(String(10), default="VND", nullable=False)
    probability = Column(Integer, default=10, nullable=False)

    expected_close_date = Column(DateTime, nullable=True)
    actual_close_date = Column(DateTime, nullable=True)

    source = Column(String(100), nullable=True)
    loss_reason = Column(String(100), nullable=True)

    provider_reference = Column(String(255), nullable=True)
    sync_status = Column(String(50), default="HEALTHY", nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)


class OpportunityContactRole(Base):
    __tablename__ = "crm_opportunity_contact_roles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    opportunity_id = Column(Integer, ForeignKey("crm_opportunities.id", ondelete="CASCADE"), nullable=False, index=True)
    contact_id = Column(Integer, ForeignKey("crm_contacts.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(50), default="DECISION_MAKER", nullable=False)  # DECISION_MAKER, INFLUENCER, CHAMPION, PROCUREMENT, TECHNICAL_CONTACT, OTHER
    is_primary = Column(Boolean, default=False, nullable=False)


class Activity(Base):
    __tablename__ = "crm_activities"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    organization_id = Column(String(50), default="default", nullable=False)

    subject = Column(String(255), nullable=False)
    type = Column(String(50), default="NOTE", nullable=False)  # TASK, CALL, EMAIL, MEETING, NOTE, SYSTEM_EVENT
    status = Column(String(50), default="COMPLETED", nullable=False)  # COMPLETED, SCHEDULED, OVERDUE

    account_id = Column(Integer, nullable=True, index=True)
    contact_id = Column(Integer, nullable=True, index=True)
    lead_id = Column(Integer, nullable=True, index=True)
    opportunity_id = Column(Integer, nullable=True, index=True)

    owner_id = Column(String(50), default="1", nullable=False)
    due_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    body = Column(Text, nullable=True)
    metadata_json = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
