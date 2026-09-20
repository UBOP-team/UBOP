from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.events import Event, event_bus
from app.providers.contracts import CustomerProvider
from .models import (
    Customer,
    Lead,
    Account,
    Contact,
    Opportunity,
    OpportunityContactRole,
    Activity,
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
from .schemas import (
    CustomerCreate,
    CustomerUpdate,
    LeadCreate,
    LeadUpdate,
    LeadConvertRequest,
    LeadConvertResponse,
    AccountCreate,
    AccountUpdate,
    ContactCreate,
    ContactUpdate,
    OpportunityCreate,
    OpportunityUpdate,
    OpportunityCloseWonRequest,
    OpportunityCloseLostRequest,
    OpportunityContactRoleCreate,
    ActivityCreate,
)


# ==========================================
# 1. Customer Service (Backwards Compatibility)
# ==========================================

class CustomerService:
    def __init__(self, repository: Optional[CustomerRepository] = None, provider: Optional[CustomerProvider] = None):
        self.repository = repository
        self.provider = provider

    async def create_customer(self, data: CustomerCreate) -> Customer:
        if self.repository:
            customer = Customer(
                name=data.name,
                email=data.email,
                phone=data.phone,
                company=data.company,
                status=data.status,
            )
            created = await self.repository.create(customer)
            return created
        elif self.provider:
            res = await self.provider.create_customer(data.model_dump())
            return Customer(id=res.get("id", 1), **data.model_dump())
        raise ValueError("Neither repository nor provider configured for CustomerService")

    async def get_customer(self, customer_id: int) -> Optional[Customer]:
        if self.repository:
            return await self.repository.get_by_id(customer_id)
        elif self.provider:
            res = await self.provider.get_customer(customer_id)
            if res:
                return Customer(**res)
        return None

    async def list_customers(self, skip: int = 0, limit: int = 100) -> List[Customer]:
        if self.repository:
            return await self.repository.get_all(skip=skip, limit=limit)
        elif self.provider:
            items = await self.provider.list_customers(skip=skip, limit=limit)
            return [Customer(**item) for item in items]
        return []

    async def update_customer(self, customer_id: int, data: CustomerUpdate) -> Optional[Customer]:
        if self.repository:
            update_data = {k: v for k, v in data.model_dump().items() if v is not None}
            if not update_data:
                return await self.repository.get_by_id(customer_id)
            return await self.repository.update(customer_id, **update_data)
        return None

    async def delete_customer(self, customer_id: int) -> bool:
        if self.repository:
            return await self.repository.delete(customer_id)
        return False


# ==========================================
# 2. Activity Service
# ==========================================

class ActivityService:
    def __init__(self, repository: ActivityRepository):
        self.repo = repository

    async def create_activity(self, data: ActivityCreate) -> Activity:
        activity = Activity(
            subject=data.subject,
            type=data.type,
            status=data.status,
            account_id=data.account_id,
            contact_id=data.contact_id,
            lead_id=data.lead_id,
            opportunity_id=data.opportunity_id,
            owner_id=data.owner_id,
            due_at=data.due_at,
            completed_at=data.completed_at or (datetime.now(timezone.utc) if data.status == "COMPLETED" else None),
            body=data.body,
            metadata_json=data.metadata_json,
        )
        return await self.repo.create(activity)

    async def list_activities(
        self,
        account_id: Optional[int] = None,
        contact_id: Optional[int] = None,
        lead_id: Optional[int] = None,
        opportunity_id: Optional[int] = None,
        limit: int = 100,
    ) -> List[Activity]:
        return await self.repo.list_activities(
            account_id=account_id,
            contact_id=contact_id,
            lead_id=lead_id,
            opportunity_id=opportunity_id,
            limit=limit,
        )


# ==========================================
# 3. Lead Service
# ==========================================

class LeadService:
    def __init__(
        self,
        lead_repo: LeadRepository,
        account_repo: AccountRepository,
        contact_repo: ContactRepository,
        opportunity_repo: OpportunityRepository,
        role_repo: OpportunityContactRoleRepository,
        activity_repo: ActivityRepository,
        session: AsyncSession,
    ):
        self.lead_repo = lead_repo
        self.account_repo = account_repo
        self.contact_repo = contact_repo
        self.opportunity_repo = opportunity_repo
        self.role_repo = role_repo
        self.activity_repo = activity_repo
        self.session = session

    async def create_lead(self, data: LeadCreate) -> Lead:
        lead = Lead(
            first_name=data.first_name,
            last_name=data.last_name,
            company_name=data.company_name,
            job_title=data.job_title,
            email=data.email,
            phone=data.phone,
            source=data.source,
            status=data.status,
            estimated_value=data.estimated_value,
            notes=data.notes,
            owner_id=data.owner_id,
            organization_id=data.organization_id,
            provider_reference=data.provider_reference,
            sync_status=data.sync_status,
        )
        created = await self.lead_repo.create(lead)

        # Log creation activity
        await self.activity_repo.create(
            Activity(
                subject=f"Lead Created: {created.first_name} {created.last_name}",
                type="SYSTEM_EVENT",
                status="COMPLETED",
                lead_id=created.id,
                owner_id=created.owner_id,
                body=f"Lead created with status {created.status} from source {created.source}.",
            )
        )
        return created

    async def get_lead(self, lead_id: int) -> Optional[Lead]:
        return await self.lead_repo.get_by_id(lead_id)

    async def list_leads(
        self,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        owner_id: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[Lead]:
        return await self.lead_repo.list_leads(
            skip=skip, limit=limit, status=status, owner_id=owner_id, search=search
        )

    async def update_lead(self, lead_id: int, data: LeadUpdate) -> Optional[Lead]:
        lead = await self.lead_repo.get_by_id(lead_id)
        if not lead:
            return None
        if lead.status == "CONVERTED":
            raise ValueError("Converted leads cannot be modified.")

        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        if not update_dict:
            return lead

        updated = await self.lead_repo.update(lead_id, **update_dict)
        return updated

    async def transition_status(self, lead_id: int, target_status: str, reason: Optional[str] = None) -> Lead:
        lead = await self.lead_repo.get_by_id(lead_id)
        if not lead:
            raise ValueError(f"Lead {lead_id} not found")

        if lead.status == "CONVERTED":
            raise ValueError("Converted leads cannot be transitioned.")

        old_status = lead.status
        normalized_target = target_status.upper()

        if old_status == normalized_target:
            return lead

        lead.status = normalized_target
        lead.updated_at = datetime.now(timezone.utc)
        await self.session.flush()

        # Write audit trail
        body = f"Status changed from {old_status} to {normalized_target}."
        if reason:
            body += f" Reason: {reason}"

        await self.activity_repo.create(
            Activity(
                subject=f"Lead Status Changed: {old_status} → {normalized_target}",
                type="SYSTEM_EVENT",
                status="COMPLETED",
                lead_id=lead.id,
                owner_id=lead.owner_id,
                body=body,
            )
        )
        return lead

    async def convert_lead(self, lead_id: int, request: LeadConvertRequest) -> LeadConvertResponse:
        lead = await self.lead_repo.get_by_id(lead_id)
        if not lead:
            raise ValueError(f"Lead {lead_id} not found")

        if lead.status == "CONVERTED":
            raise ValueError("Lead has already been converted.")

        # Execute transaction
        try:
            # 1. Resolve Account
            if request.create_new_account or not request.account_id:
                acc_name = request.account_name or lead.company_name
                account = Account(
                    name=acc_name,
                    account_type="CUSTOMER",
                    phone=lead.phone,
                    status="ACTIVE",
                    segment="MID_MARKET",
                    owner_id=lead.owner_id,
                    organization_id=lead.organization_id,
                )
                account = await self.account_repo.create(account)
            else:
                account = await self.account_repo.get_by_id(request.account_id)
                if not account:
                    raise ValueError(f"Target account {request.account_id} does not exist.")

            # 2. Resolve Contact
            if request.create_new_contact or not request.contact_id:
                contact = Contact(
                    first_name=lead.first_name,
                    last_name=lead.last_name,
                    job_title=lead.job_title,
                    email=lead.email,
                    phone=lead.phone,
                    is_primary=True,
                    account_id=account.id,
                    owner_id=lead.owner_id,
                    organization_id=lead.organization_id,
                )
                contact = await self.contact_repo.create(contact)
            else:
                contact = await self.contact_repo.get_by_id(request.contact_id)
                if not contact:
                    raise ValueError(f"Target contact {request.contact_id} does not exist.")

            # 3. Resolve Opportunity (Optional)
            opportunity_id = None
            if request.create_opportunity:
                opp_name = request.opportunity_name or f"{account.name} — Initial Deal"
                opp_amount = (
                    request.opportunity_amount
                    if request.opportunity_amount is not None
                    else lead.estimated_value
                )
                opportunity = Opportunity(
                    name=opp_name,
                    account_id=account.id,
                    stage=request.initial_stage or "QUALIFICATION",
                    amount=opp_amount,
                    expected_close_date=request.expected_close_date,
                    source=lead.source,
                    owner_id=lead.owner_id,
                    organization_id=lead.organization_id,
                )
                opportunity = await self.opportunity_repo.create(opportunity)
                opportunity_id = opportunity.id

                # Link contact role
                role = OpportunityContactRole(
                    opportunity_id=opportunity.id,
                    contact_id=contact.id,
                    role="DECISION_MAKER",
                    is_primary=True,
                )
                await self.role_repo.create(role)

            # 4. Mark Lead as CONVERTED
            lead.status = "CONVERTED"
            lead.updated_at = datetime.now(timezone.utc)
            await self.session.flush()

            # 5. Create System Activities
            log_body = f"Lead converted into Account '{account.name}' and Contact '{contact.first_name} {contact.last_name}'."
            if opportunity_id:
                log_body += f" Opportunity '{opportunity.name}' created."

            await self.activity_repo.create(
                Activity(
                    subject="Lead Converted",
                    type="SYSTEM_EVENT",
                    status="COMPLETED",
                    lead_id=lead.id,
                    account_id=account.id,
                    contact_id=contact.id,
                    opportunity_id=opportunity_id,
                    owner_id=lead.owner_id,
                    body=log_body,
                )
            )

            # Publish event
            await event_bus.publish(
                Event(
                    "crm.lead_converted",
                    {
                        "lead_id": lead.id,
                        "account_id": account.id,
                        "contact_id": contact.id,
                        "opportunity_id": opportunity_id,
                    },
                )
            )

            return LeadConvertResponse(
                lead_id=lead.id,
                account_id=account.id,
                contact_id=contact.id,
                opportunity_id=opportunity_id,
                status="CONVERTED",
                message="Lead converted successfully",
            )
        except Exception:
            await self.session.rollback()
            raise


# ==========================================
# 4. Account Service
# ==========================================

class AccountService:
    def __init__(
        self,
        account_repo: AccountRepository,
        contact_repo: ContactRepository,
        opportunity_repo: OpportunityRepository,
        activity_repo: ActivityRepository,
    ):
        self.account_repo = account_repo
        self.contact_repo = contact_repo
        self.opportunity_repo = opportunity_repo
        self.activity_repo = activity_repo

    async def create_account(self, data: AccountCreate) -> Account:
        account = Account(
            name=data.name,
            account_type=data.account_type,
            industry=data.industry,
            website=data.website,
            phone=data.phone,
            billing_address=data.billing_address,
            shipping_address=data.shipping_address,
            status=data.status,
            segment=data.segment,
            owner_id=data.owner_id,
            organization_id=data.organization_id,
            provider_reference=data.provider_reference,
            sync_status=data.sync_status,
        )
        created = await self.account_repo.create(account)
        await self.activity_repo.create(
            Activity(
                subject=f"Account Created: {created.name}",
                type="SYSTEM_EVENT",
                status="COMPLETED",
                account_id=created.id,
                owner_id=created.owner_id,
                body=f"Account created as {created.account_type}.",
            )
        )
        return created

    async def get_account(self, account_id: int) -> Optional[Account]:
        return await self.account_repo.get_by_id(account_id)

    async def list_accounts(
        self,
        skip: int = 0,
        limit: int = 100,
        account_type: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[Account]:
        return await self.account_repo.list_accounts(
            skip=skip, limit=limit, account_type=account_type, search=search
        )

    async def search_accounts(self, query: str, limit: int = 20) -> List[Account]:
        return await self.account_repo.search_accounts(query=query, limit=limit)

    async def update_account(self, account_id: int, data: AccountUpdate) -> Optional[Account]:
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        if not update_dict:
            return await self.account_repo.get_by_id(account_id)
        return await self.account_repo.update(account_id, **update_dict)

    async def delete_account(self, account_id: int) -> bool:
        return await self.account_repo.delete(account_id)


# ==========================================
# 5. Contact Service
# ==========================================

class ContactService:
    def __init__(self, contact_repo: ContactRepository, activity_repo: ActivityRepository):
        self.contact_repo = contact_repo
        self.activity_repo = activity_repo

    async def create_contact(self, data: ContactCreate) -> Contact:
        contact = Contact(
            first_name=data.first_name,
            last_name=data.last_name,
            job_title=data.job_title,
            department=data.department,
            email=data.email,
            phone=data.phone,
            is_primary=data.is_primary,
            account_id=data.account_id,
            owner_id=data.owner_id,
            organization_id=data.organization_id,
            provider_reference=data.provider_reference,
            sync_status=data.sync_status,
        )
        created = await self.contact_repo.create(contact)
        await self.activity_repo.create(
            Activity(
                subject=f"Contact Added: {created.first_name} {created.last_name}",
                type="SYSTEM_EVENT",
                status="COMPLETED",
                account_id=created.account_id,
                contact_id=created.id,
                owner_id=created.owner_id,
                body=f"Contact created for job title {created.job_title or 'N/A'}.",
            )
        )
        return created

    async def get_contact(self, contact_id: int) -> Optional[Contact]:
        return await self.contact_repo.get_by_id(contact_id)

    async def list_contacts(
        self,
        skip: int = 0,
        limit: int = 100,
        account_id: Optional[int] = None,
        search: Optional[str] = None,
    ) -> List[Contact]:
        return await self.contact_repo.list_contacts(
            skip=skip, limit=limit, account_id=account_id, search=search
        )

    async def search_contacts(self, query: str, limit: int = 20) -> List[Contact]:
        return await self.contact_repo.search_contacts(query=query, limit=limit)

    async def update_contact(self, contact_id: int, data: ContactUpdate) -> Optional[Contact]:
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        if not update_dict:
            return await self.contact_repo.get_by_id(contact_id)
        return await self.contact_repo.update(contact_id, **update_dict)

    async def delete_contact(self, contact_id: int) -> bool:
        return await self.contact_repo.delete(contact_id)


# ==========================================
# 6. Opportunity Service
# ==========================================

class OpportunityService:
    def __init__(
        self,
        opportunity_repo: OpportunityRepository,
        role_repo: OpportunityContactRoleRepository,
        activity_repo: ActivityRepository,
        session: AsyncSession,
    ):
        self.opportunity_repo = opportunity_repo
        self.role_repo = role_repo
        self.activity_repo = activity_repo
        self.session = session

    async def create_opportunity(self, data: OpportunityCreate) -> Opportunity:
        opp = Opportunity(
            name=data.name,
            account_id=data.account_id,
            stage=data.stage,
            amount=data.amount,
            currency=data.currency,
            probability=data.probability,
            expected_close_date=data.expected_close_date,
            actual_close_date=data.actual_close_date,
            source=data.source,
            loss_reason=data.loss_reason,
            owner_id=data.owner_id,
            organization_id=data.organization_id,
            provider_reference=data.provider_reference,
            sync_status=data.sync_status,
        )
        created = await self.opportunity_repo.create(opp)

        if data.contact_id:
            role = OpportunityContactRole(
                opportunity_id=created.id,
                contact_id=data.contact_id,
                role="DECISION_MAKER",
                is_primary=True,
            )
            await self.role_repo.create(role)

        await self.activity_repo.create(
            Activity(
                subject=f"Opportunity Created: {created.name}",
                type="SYSTEM_EVENT",
                status="COMPLETED",
                account_id=created.account_id,
                opportunity_id=created.id,
                owner_id=created.owner_id,
                body=f"Created in stage {created.stage} with value {created.amount:,.0f} {created.currency}.",
            )
        )
        return created

    async def get_opportunity(self, opportunity_id: int) -> Optional[Opportunity]:
        return await self.opportunity_repo.get_by_id(opportunity_id)

    async def list_opportunities(
        self,
        skip: int = 0,
        limit: int = 100,
        stage: Optional[str] = None,
        account_id: Optional[int] = None,
        search: Optional[str] = None,
    ) -> List[Opportunity]:
        return await self.opportunity_repo.list_opportunities(
            skip=skip, limit=limit, stage=stage, account_id=account_id, search=search
        )

    async def update_opportunity(self, opportunity_id: int, data: OpportunityUpdate) -> Optional[Opportunity]:
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        if not update_dict:
            return await self.opportunity_repo.get_by_id(opportunity_id)
        return await self.opportunity_repo.update(opportunity_id, **update_dict)

    async def transition_stage(self, opportunity_id: int, target_stage: str) -> Opportunity:
        opp = await self.opportunity_repo.get_by_id(opportunity_id)
        if not opp:
            raise ValueError(f"Opportunity {opportunity_id} not found")

        old_stage = opp.stage
        normalized_target = target_stage.upper()

        if old_stage == normalized_target:
            return opp

        # Validation rules:
        if normalized_target == "CLOSED_LOST" and not opp.loss_reason:
            raise ValueError("Loss reason is mandatory when transitioning to Closed Lost.")

        # Update probability based on stage
        probabilities = {
            "PROSPECTING": 10,
            "QUALIFICATION": 25,
            "DISCOVERY": 40,
            "PROPOSAL": 60,
            "NEGOTIATION": 80,
            "CLOSED_WON": 100,
            "CLOSED_LOST": 0,
        }

        opp.stage = normalized_target
        opp.probability = probabilities.get(normalized_target, opp.probability)
        opp.updated_at = datetime.now(timezone.utc)
        if normalized_target == "CLOSED_WON":
            opp.actual_close_date = datetime.now(timezone.utc)

        await self.session.flush()

        await self.activity_repo.create(
            Activity(
                subject=f"Stage Changed: {old_stage} → {normalized_target}",
                type="SYSTEM_EVENT",
                status="COMPLETED",
                account_id=opp.account_id,
                opportunity_id=opp.id,
                owner_id=opp.owner_id,
                body=f"Stage advanced to {normalized_target}. Probability updated to {opp.probability}%.",
            )
        )

        if normalized_target == "CLOSED_WON":
            await event_bus.publish(
                Event(
                    "crm.opportunity_won",
                    {
                        "opportunity_id": opp.id,
                        "account_id": opp.account_id,
                        "amount": opp.amount,
                        "currency": opp.currency,
                    },
                )
            )

        return opp

    async def close_won(self, opportunity_id: int, req: OpportunityCloseWonRequest) -> Opportunity:
        opp = await self.opportunity_repo.get_by_id(opportunity_id)
        if not opp:
            raise ValueError(f"Opportunity {opportunity_id} not found")

        opp.stage = "CLOSED_WON"
        opp.probability = 100
        if req.amount is not None:
            opp.amount = req.amount
        opp.actual_close_date = req.actual_close_date or datetime.now(timezone.utc)
        opp.updated_at = datetime.now(timezone.utc)

        await self.session.flush()

        await self.activity_repo.create(
            Activity(
                subject="Opportunity Won! 🏆",
                type="SYSTEM_EVENT",
                status="COMPLETED",
                account_id=opp.account_id,
                opportunity_id=opp.id,
                owner_id=opp.owner_id,
                body=f"Deal closed won for {opp.amount:,.0f} {opp.currency}.",
            )
        )

        await event_bus.publish(
            Event(
                "crm.opportunity_won",
                {
                    "opportunity_id": opp.id,
                    "account_id": opp.account_id,
                    "amount": opp.amount,
                    "currency": opp.currency,
                },
            )
        )
        return opp

    async def close_lost(self, opportunity_id: int, req: OpportunityCloseLostRequest) -> Opportunity:
        opp = await self.opportunity_repo.get_by_id(opportunity_id)
        if not opp:
            raise ValueError(f"Opportunity {opportunity_id} not found")

        if not req.loss_reason or not req.loss_reason.strip():
            raise ValueError("Loss reason is mandatory when closing an opportunity as lost.")

        opp.stage = "CLOSED_LOST"
        opp.probability = 0
        opp.loss_reason = req.loss_reason.strip()
        opp.actual_close_date = datetime.now(timezone.utc)
        opp.updated_at = datetime.now(timezone.utc)

        await self.session.flush()

        body = f"Closed Lost due to: {opp.loss_reason}."
        if req.notes:
            body += f" Notes: {req.notes}"

        await self.activity_repo.create(
            Activity(
                subject="Opportunity Closed Lost",
                type="SYSTEM_EVENT",
                status="COMPLETED",
                account_id=opp.account_id,
                opportunity_id=opp.id,
                owner_id=opp.owner_id,
                body=body,
            )
        )
        return opp

    async def add_contact_role(
        self, opportunity_id: int, req: OpportunityContactRoleCreate
    ) -> OpportunityContactRole:
        role = OpportunityContactRole(
            opportunity_id=opportunity_id,
            contact_id=req.contact_id,
            role=req.role,
            is_primary=req.is_primary,
        )
        return await self.role_repo.create(role)

    async def list_contact_roles(self, opportunity_id: int) -> List[OpportunityContactRole]:
        return await self.role_repo.get_by_opportunity_id(opportunity_id)
