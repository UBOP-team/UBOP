from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db

from .schemas import (
    CustomerCreate,
    CustomerUpdate,
    CustomerResponse,
    LeadCreate,
    LeadUpdate,
    LeadResponse,
    LeadTransitionRequest,
    LeadConvertRequest,
    LeadConvertResponse,
    AccountCreate,
    AccountUpdate,
    AccountResponse,
    ContactCreate,
    ContactUpdate,
    ContactResponse,
    OpportunityCreate,
    OpportunityUpdate,
    OpportunityResponse,
    OpportunityTransitionRequest,
    OpportunityCloseWonRequest,
    OpportunityCloseLostRequest,
    OpportunityContactRoleCreate,
    OpportunityContactRoleResponse,
    ActivityCreate,
    ActivityResponse,
)
from .repository import (
    CustomerRepository,
    LeadRepository,
    AccountRepository,
    ContactRepository,
    OpportunityRepository,
    OpportunityContactRoleRepository,
    ActivityRepository,
)
from .service import (
    CustomerService,
    LeadService,
    AccountService,
    ContactService,
    OpportunityService,
    ActivityService,
)

router = APIRouter(prefix="/crm", tags=["CRM"])


# ==========================================
# Dependency Injections
# ==========================================

def get_customer_service(db: AsyncSession = Depends(get_db)) -> CustomerService:
    repo = CustomerRepository(db)
    return CustomerService(repository=repo)


def get_activity_service(db: AsyncSession = Depends(get_db)) -> ActivityService:
    repo = ActivityRepository(db)
    return ActivityService(repository=repo)


def get_lead_service(db: AsyncSession = Depends(get_db)) -> LeadService:
    return LeadService(
        lead_repo=LeadRepository(db),
        account_repo=AccountRepository(db),
        contact_repo=ContactRepository(db),
        opportunity_repo=OpportunityRepository(db),
        role_repo=OpportunityContactRoleRepository(db),
        activity_repo=ActivityRepository(db),
        session=db,
    )


def get_account_service(db: AsyncSession = Depends(get_db)) -> AccountService:
    return AccountService(
        account_repo=AccountRepository(db),
        contact_repo=ContactRepository(db),
        opportunity_repo=OpportunityRepository(db),
        activity_repo=ActivityRepository(db),
    )


def get_contact_service(db: AsyncSession = Depends(get_db)) -> ContactService:
    return ContactService(
        contact_repo=ContactRepository(db),
        activity_repo=ActivityRepository(db),
    )


def get_opportunity_service(db: AsyncSession = Depends(get_db)) -> OpportunityService:
    return OpportunityService(
        opportunity_repo=OpportunityRepository(db),
        role_repo=OpportunityContactRoleRepository(db),
        activity_repo=ActivityRepository(db),
        session=db,
    )


# ==========================================
# 1. Backwards Compatible /customers
# ==========================================

@router.post("/customers", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
async def create_customer(
    customer_in: CustomerCreate,
    service: CustomerService = Depends(get_customer_service),
):
    return await service.create_customer(customer_in)


@router.get("/customers", response_model=List[CustomerResponse])
async def list_customers(
    skip: int = 0,
    limit: int = 100,
    service: CustomerService = Depends(get_customer_service),
):
    return await service.list_customers(skip=skip, limit=limit)


@router.get("/customers/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: int,
    service: CustomerService = Depends(get_customer_service),
):
    customer = await service.get_customer(customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.put("/customers/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: int,
    customer_in: CustomerUpdate,
    service: CustomerService = Depends(get_customer_service),
):
    customer = await service.update_customer(customer_id, customer_in)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.delete("/customers/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_customer(
    customer_id: int,
    service: CustomerService = Depends(get_customer_service),
):
    success = await service.delete_customer(customer_id)
    if not success:
        raise HTTPException(status_code=404, detail="Customer not found")
    return None


# ==========================================
# 2. Leads Endpoints
# ==========================================

@router.get("/leads", response_model=List[LeadResponse])
async def list_leads(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    owner_id: Optional[str] = None,
    search: Optional[str] = None,
    service: LeadService = Depends(get_lead_service),
):
    return await service.list_leads(skip=skip, limit=limit, status=status, owner_id=owner_id, search=search)


@router.post("/leads", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
async def create_lead(
    lead_in: LeadCreate,
    service: LeadService = Depends(get_lead_service),
):
    return await service.create_lead(lead_in)


@router.get("/leads/{lead_id}", response_model=LeadResponse)
async def get_lead(
    lead_id: int,
    service: LeadService = Depends(get_lead_service),
):
    lead = await service.get_lead(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.patch("/leads/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: int,
    lead_in: LeadUpdate,
    service: LeadService = Depends(get_lead_service),
):
    try:
        updated = await service.update_lead(lead_id, lead_in)
        if not updated:
            raise HTTPException(status_code=404, detail="Lead not found")
        return updated
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/leads/{lead_id}/transition", response_model=LeadResponse)
async def transition_lead_status(
    lead_id: int,
    req: LeadTransitionRequest,
    service: LeadService = Depends(get_lead_service),
):
    try:
        return await service.transition_status(lead_id, req.status, req.reason)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/leads/{lead_id}/convert", response_model=LeadConvertResponse)
async def convert_lead(
    lead_id: int,
    req: LeadConvertRequest,
    service: LeadService = Depends(get_lead_service),
):
    try:
        return await service.convert_lead(lead_id, req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/leads/{lead_id}/activities", response_model=ActivityResponse, status_code=status.HTTP_201_CREATED)
async def add_lead_activity(
    lead_id: int,
    activity_in: ActivityCreate,
    service: ActivityService = Depends(get_activity_service),
):
    activity_in.lead_id = lead_id
    return await service.create_activity(activity_in)


# ==========================================
# 3. Accounts Endpoints
# ==========================================

@router.get("/accounts", response_model=List[AccountResponse])
async def list_accounts(
    skip: int = 0,
    limit: int = 100,
    account_type: Optional[str] = None,
    search: Optional[str] = None,
    service: AccountService = Depends(get_account_service),
):
    return await service.list_accounts(skip=skip, limit=limit, account_type=account_type, search=search)


@router.post("/accounts", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
async def create_account(
    account_in: AccountCreate,
    service: AccountService = Depends(get_account_service),
):
    return await service.create_account(account_in)


@router.get("/accounts/{account_id}", response_model=AccountResponse)
async def get_account(
    account_id: int,
    service: AccountService = Depends(get_account_service),
):
    account = await service.get_account(account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account


@router.patch("/accounts/{account_id}", response_model=AccountResponse)
async def update_account(
    account_id: int,
    account_in: AccountUpdate,
    service: AccountService = Depends(get_account_service),
):
    updated = await service.update_account(account_id, account_in)
    if not updated:
        raise HTTPException(status_code=404, detail="Account not found")
    return updated


@router.delete("/accounts/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    account_id: int,
    service: AccountService = Depends(get_account_service),
):
    success = await service.delete_account(account_id)
    if not success:
        raise HTTPException(status_code=404, detail="Account not found")
    return None


# ==========================================
# 4. Contacts Endpoints
# ==========================================

@router.get("/contacts", response_model=List[ContactResponse])
async def list_contacts(
    skip: int = 0,
    limit: int = 100,
    account_id: Optional[int] = None,
    search: Optional[str] = None,
    service: ContactService = Depends(get_contact_service),
):
    return await service.list_contacts(skip=skip, limit=limit, account_id=account_id, search=search)


@router.post("/contacts", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
async def create_contact(
    contact_in: ContactCreate,
    service: ContactService = Depends(get_contact_service),
):
    return await service.create_contact(contact_in)


@router.get("/contacts/{contact_id}", response_model=ContactResponse)
async def get_contact(
    contact_id: int,
    service: ContactService = Depends(get_contact_service),
):
    contact = await service.get_contact(contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact


@router.patch("/contacts/{contact_id}", response_model=ContactResponse)
async def update_contact(
    contact_id: int,
    contact_in: ContactUpdate,
    service: ContactService = Depends(get_contact_service),
):
    updated = await service.update_contact(contact_id, contact_in)
    if not updated:
        raise HTTPException(status_code=404, detail="Contact not found")
    return updated


@router.delete("/contacts/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contact(
    contact_id: int,
    service: ContactService = Depends(get_contact_service),
):
    success = await service.delete_contact(contact_id)
    if not success:
        raise HTTPException(status_code=404, detail="Contact not found")
    return None


# ==========================================
# 5. Opportunities Endpoints
# ==========================================

@router.get("/opportunities", response_model=List[OpportunityResponse])
async def list_opportunities(
    skip: int = 0,
    limit: int = 100,
    stage: Optional[str] = None,
    account_id: Optional[int] = None,
    search: Optional[str] = None,
    service: OpportunityService = Depends(get_opportunity_service),
):
    return await service.list_opportunities(
        skip=skip, limit=limit, stage=stage, account_id=account_id, search=search
    )


@router.post("/opportunities", response_model=OpportunityResponse, status_code=status.HTTP_201_CREATED)
async def create_opportunity(
    opp_in: OpportunityCreate,
    service: OpportunityService = Depends(get_opportunity_service),
):
    return await service.create_opportunity(opp_in)


@router.get("/opportunities/{opportunity_id}", response_model=OpportunityResponse)
async def get_opportunity(
    opportunity_id: int,
    service: OpportunityService = Depends(get_opportunity_service),
):
    opp = await service.get_opportunity(opportunity_id)
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return opp


@router.patch("/opportunities/{opportunity_id}", response_model=OpportunityResponse)
async def update_opportunity(
    opportunity_id: int,
    opp_in: OpportunityUpdate,
    service: OpportunityService = Depends(get_opportunity_service),
):
    updated = await service.update_opportunity(opportunity_id, opp_in)
    if not updated:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return updated


@router.post("/opportunities/{opportunity_id}/transition", response_model=OpportunityResponse)
async def transition_opportunity_stage(
    opportunity_id: int,
    req: OpportunityTransitionRequest,
    service: OpportunityService = Depends(get_opportunity_service),
):
    try:
        return await service.transition_stage(opportunity_id, req.stage)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/opportunities/{opportunity_id}/close-won", response_model=OpportunityResponse)
async def close_won_opportunity(
    opportunity_id: int,
    req: OpportunityCloseWonRequest,
    service: OpportunityService = Depends(get_opportunity_service),
):
    try:
        return await service.close_won(opportunity_id, req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/opportunities/{opportunity_id}/close-lost", response_model=OpportunityResponse)
async def close_lost_opportunity(
    opportunity_id: int,
    req: OpportunityCloseLostRequest,
    service: OpportunityService = Depends(get_opportunity_service),
):
    try:
        return await service.close_lost(opportunity_id, req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/opportunities/{opportunity_id}/contact-roles", response_model=List[OpportunityContactRoleResponse])
async def list_opportunity_contact_roles(
    opportunity_id: int,
    service: OpportunityService = Depends(get_opportunity_service),
):
    return await service.list_contact_roles(opportunity_id)


@router.post(
    "/opportunities/{opportunity_id}/contact-roles",
    response_model=OpportunityContactRoleResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_opportunity_contact_role(
    opportunity_id: int,
    req: OpportunityContactRoleCreate,
    service: OpportunityService = Depends(get_opportunity_service),
):
    return await service.add_contact_role(opportunity_id, req)


# ==========================================
# 6. Activities Endpoints
# ==========================================

@router.get("/activities", response_model=List[ActivityResponse])
async def list_activities(
    account_id: Optional[int] = None,
    contact_id: Optional[int] = None,
    lead_id: Optional[int] = None,
    opportunity_id: Optional[int] = None,
    limit: int = 100,
    service: ActivityService = Depends(get_activity_service),
):
    return await service.list_activities(
        account_id=account_id,
        contact_id=contact_id,
        lead_id=lead_id,
        opportunity_id=opportunity_id,
        limit=limit,
    )


@router.post("/activities", response_model=ActivityResponse, status_code=status.HTTP_201_CREATED)
async def create_activity(
    activity_in: ActivityCreate,
    service: ActivityService = Depends(get_activity_service),
):
    return await service.create_activity(activity_in)
