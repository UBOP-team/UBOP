from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict


# ==========================================
# 1. Customer (Backwards Compatibility)
# ==========================================

class CustomerBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    company: Optional[str] = None
    status: str = "LEAD"


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    status: Optional[str] = None


class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# 2. Activity Schemas
# ==========================================

class ActivityBase(BaseModel):
    subject: str
    type: str = "NOTE"  # TASK, CALL, EMAIL, MEETING, NOTE, SYSTEM_EVENT
    status: str = "COMPLETED"  # COMPLETED, SCHEDULED, OVERDUE
    account_id: Optional[int] = None
    contact_id: Optional[int] = None
    lead_id: Optional[int] = None
    opportunity_id: Optional[int] = None
    owner_id: str = "1"
    due_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    body: Optional[str] = None
    metadata_json: Optional[str] = None


class ActivityCreate(ActivityBase):
    pass


class ActivityResponse(ActivityBase):
    id: int
    organization_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# 3. Lead Schemas
# ==========================================

class LeadBase(BaseModel):
    first_name: str = ""
    last_name: str
    company_name: str
    job_title: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    source: str = "WEBSITE"
    status: str = "NEW"  # NEW, CONTACTED, QUALIFYING, QUALIFIED, UNQUALIFIED, CONVERTED
    estimated_value: float = 0.0
    notes: Optional[str] = None
    owner_id: str = "1"
    organization_id: str = "default"
    provider_reference: Optional[str] = None
    sync_status: str = "HEALTHY"


class LeadCreate(LeadBase):
    pass


class LeadUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company_name: Optional[str] = None
    job_title: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    source: Optional[str] = None
    status: Optional[str] = None
    estimated_value: Optional[float] = None
    notes: Optional[str] = None
    owner_id: Optional[str] = None
    sync_status: Optional[str] = None


class LeadTransitionRequest(BaseModel):
    status: str
    reason: Optional[str] = None


class LeadConvertRequest(BaseModel):
    # Account options
    create_new_account: bool = True
    account_id: Optional[int] = None
    account_name: Optional[str] = None

    # Contact options
    create_new_contact: bool = True
    contact_id: Optional[int] = None

    # Opportunity options
    create_opportunity: bool = True
    opportunity_name: Optional[str] = None
    opportunity_amount: Optional[float] = None
    expected_close_date: Optional[datetime] = None
    initial_stage: str = "QUALIFICATION"


class LeadConvertResponse(BaseModel):
    lead_id: int
    account_id: int
    contact_id: int
    opportunity_id: Optional[int] = None
    status: str = "CONVERTED"
    message: str = "Lead converted successfully"


class LeadResponse(LeadBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# 4. Contact Schemas
# ==========================================

class ContactBase(BaseModel):
    first_name: str = ""
    last_name: str
    job_title: Optional[str] = None
    department: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    is_primary: bool = False
    account_id: Optional[int] = None
    owner_id: str = "1"
    organization_id: str = "default"
    provider_reference: Optional[str] = None
    sync_status: str = "HEALTHY"


class ContactCreate(ContactBase):
    pass


class ContactUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    is_primary: Optional[bool] = None
    account_id: Optional[int] = None
    owner_id: Optional[str] = None
    sync_status: Optional[str] = None


class ContactResponse(ContactBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# 5. Account Schemas
# ==========================================

class AccountBase(BaseModel):
    name: str
    account_type: str = "PROSPECT"  # PROSPECT, CUSTOMER, PARTNER, SUPPLIER_RELATIONSHIP, OTHER
    industry: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    billing_address: Optional[str] = None
    shipping_address: Optional[str] = None
    status: str = "ACTIVE"
    segment: str = "MID_MARKET"
    owner_id: str = "1"
    organization_id: str = "default"
    provider_reference: Optional[str] = None
    sync_status: str = "HEALTHY"


class AccountCreate(AccountBase):
    pass


class AccountUpdate(BaseModel):
    name: Optional[str] = None
    account_type: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    billing_address: Optional[str] = None
    shipping_address: Optional[str] = None
    status: Optional[str] = None
    segment: Optional[str] = None
    owner_id: Optional[str] = None
    sync_status: Optional[str] = None


class AccountResponse(AccountBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# 6. Opportunity & Contact Role Schemas
# ==========================================

class OpportunityContactRoleBase(BaseModel):
    opportunity_id: int
    contact_id: int
    role: str = "DECISION_MAKER"
    is_primary: bool = False


class OpportunityContactRoleCreate(BaseModel):
    contact_id: int
    role: str = "DECISION_MAKER"
    is_primary: bool = False


class OpportunityContactRoleResponse(OpportunityContactRoleBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class OpportunityBase(BaseModel):
    name: str
    account_id: Optional[int] = None
    stage: str = "PROSPECTING"  # PROSPECTING, QUALIFICATION, DISCOVERY, PROPOSAL, NEGOTIATION, CLOSED_WON, CLOSED_LOST
    amount: float = 0.0
    currency: str = "VND"
    probability: int = 10
    expected_close_date: Optional[datetime] = None
    actual_close_date: Optional[datetime] = None
    source: Optional[str] = None
    loss_reason: Optional[str] = None
    owner_id: str = "1"
    organization_id: str = "default"
    provider_reference: Optional[str] = None
    sync_status: str = "HEALTHY"


class OpportunityCreate(OpportunityBase):
    contact_id: Optional[int] = None  # optionally link primary contact during creation


class OpportunityUpdate(BaseModel):
    name: Optional[str] = None
    account_id: Optional[int] = None
    stage: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    probability: Optional[int] = None
    expected_close_date: Optional[datetime] = None
    actual_close_date: Optional[datetime] = None
    source: Optional[str] = None
    loss_reason: Optional[str] = None
    owner_id: Optional[str] = None
    sync_status: Optional[str] = None


class OpportunityTransitionRequest(BaseModel):
    stage: str


class OpportunityCloseWonRequest(BaseModel):
    amount: Optional[float] = None
    actual_close_date: Optional[datetime] = None


class OpportunityCloseLostRequest(BaseModel):
    loss_reason: str  # Mandatory: Price, Competitor, Timing, Budget, No decision, Other
    notes: Optional[str] = None


class OpportunityResponse(OpportunityBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
