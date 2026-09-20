from typing import List, Optional
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.repository import BaseRepository
from .models import (
    Customer,
    Lead,
    Account,
    Contact,
    Opportunity,
    OpportunityContactRole,
    Activity,
)


class CustomerRepository(BaseRepository[Customer]):
    def __init__(self, session: AsyncSession):
        super().__init__(Customer, session)

    async def get_by_email(self, email: str) -> Optional[Customer]:
        result = await self.session.execute(select(Customer).filter(Customer.email == email))
        return result.scalars().first()


class LeadRepository(BaseRepository[Lead]):
    def __init__(self, session: AsyncSession):
        super().__init__(Lead, session)

    async def get_by_email(self, email: str) -> Optional[Lead]:
        result = await self.session.execute(select(Lead).filter(Lead.email == email))
        return result.scalars().first()

    async def list_leads(
        self,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        owner_id: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[Lead]:
        query = select(Lead)
        if status and status.upper() != "ALL":
            query = query.filter(Lead.status == status.upper())
        if owner_id:
            query = query.filter(Lead.owner_id == owner_id)
        if search:
            s = f"%{search.lower()}%"
            query = query.filter(
                or_(
                    Lead.first_name.ilike(s),
                    Lead.last_name.ilike(s),
                    Lead.company_name.ilike(s),
                    Lead.email.ilike(s),
                )
            )
        query = query.order_by(Lead.created_at.desc()).offset(skip).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all())


class AccountRepository(BaseRepository[Account]):
    def __init__(self, session: AsyncSession):
        super().__init__(Account, session)

    async def get_by_name(self, name: str) -> Optional[Account]:
        result = await self.session.execute(select(Account).filter(Account.name.ilike(name.strip())))
        return result.scalars().first()

    async def search_accounts(self, query: str, limit: int = 20) -> List[Account]:
        s = f"%{query.lower()}%"
        stmt = (
            select(Account)
            .filter(or_(Account.name.ilike(s), Account.industry.ilike(s), Account.website.ilike(s)))
            .order_by(Account.name.asc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def list_accounts(
        self,
        skip: int = 0,
        limit: int = 100,
        account_type: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[Account]:
        query = select(Account)
        if account_type and account_type.upper() != "ALL":
            query = query.filter(Account.account_type == account_type.upper())
        if search:
            s = f"%{search.lower()}%"
            query = query.filter(
                or_(
                    Account.name.ilike(s),
                    Account.industry.ilike(s),
                    Account.website.ilike(s),
                )
            )
        query = query.order_by(Account.name.asc()).offset(skip).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all())


class ContactRepository(BaseRepository[Contact]):
    def __init__(self, session: AsyncSession):
        super().__init__(Contact, session)

    async def get_by_email(self, email: str) -> Optional[Contact]:
        result = await self.session.execute(select(Contact).filter(Contact.email == email))
        return result.scalars().first()

    async def get_by_account_id(self, account_id: int) -> List[Contact]:
        result = await self.session.execute(
            select(Contact).filter(Contact.account_id == account_id).order_by(Contact.is_primary.desc())
        )
        return list(result.scalars().all())

    async def search_contacts(self, query: str, limit: int = 20) -> List[Contact]:
        s = f"%{query.lower()}%"
        stmt = (
            select(Contact)
            .filter(
                or_(
                    Contact.first_name.ilike(s),
                    Contact.last_name.ilike(s),
                    Contact.email.ilike(s),
                )
            )
            .order_by(Contact.last_name.asc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def list_contacts(
        self,
        skip: int = 0,
        limit: int = 100,
        account_id: Optional[int] = None,
        search: Optional[str] = None,
    ) -> List[Contact]:
        query = select(Contact)
        if account_id:
            query = query.filter(Contact.account_id == account_id)
        if search:
            s = f"%{search.lower()}%"
            query = query.filter(
                or_(
                    Contact.first_name.ilike(s),
                    Contact.last_name.ilike(s),
                    Contact.email.ilike(s),
                )
            )
        query = query.order_by(Contact.created_at.desc()).offset(skip).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all())


class OpportunityRepository(BaseRepository[Opportunity]):
    def __init__(self, session: AsyncSession):
        super().__init__(Opportunity, session)

    async def get_by_account_id(self, account_id: int) -> List[Opportunity]:
        result = await self.session.execute(
            select(Opportunity).filter(Opportunity.account_id == account_id).order_by(Opportunity.created_at.desc())
        )
        return list(result.scalars().all())

    async def list_opportunities(
        self,
        skip: int = 0,
        limit: int = 100,
        stage: Optional[str] = None,
        account_id: Optional[int] = None,
        search: Optional[str] = None,
    ) -> List[Opportunity]:
        query = select(Opportunity)
        if stage and stage.upper() != "ALL":
            query = query.filter(Opportunity.stage == stage.upper())
        if account_id:
            query = query.filter(Opportunity.account_id == account_id)
        if search:
            s = f"%{search.lower()}%"
            query = query.filter(Opportunity.name.ilike(s))
        query = query.order_by(Opportunity.created_at.desc()).offset(skip).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all())


class OpportunityContactRoleRepository(BaseRepository[OpportunityContactRole]):
    def __init__(self, session: AsyncSession):
        super().__init__(OpportunityContactRole, session)

    async def get_by_opportunity_id(self, opportunity_id: int) -> List[OpportunityContactRole]:
        result = await self.session.execute(
            select(OpportunityContactRole).filter(OpportunityContactRole.opportunity_id == opportunity_id)
        )
        return list(result.scalars().all())

    async def get_by_opportunity_and_contact(
        self, opportunity_id: int, contact_id: int
    ) -> Optional[OpportunityContactRole]:
        result = await self.session.execute(
            select(OpportunityContactRole).filter(
                OpportunityContactRole.opportunity_id == opportunity_id,
                OpportunityContactRole.contact_id == contact_id,
            )
        )
        return result.scalars().first()


class ActivityRepository(BaseRepository[Activity]):
    def __init__(self, session: AsyncSession):
        super().__init__(Activity, session)

    async def list_activities(
        self,
        account_id: Optional[int] = None,
        contact_id: Optional[int] = None,
        lead_id: Optional[int] = None,
        opportunity_id: Optional[int] = None,
        limit: int = 100,
    ) -> List[Activity]:
        query = select(Activity)
        if account_id:
            query = query.filter(Activity.account_id == account_id)
        if contact_id:
            query = query.filter(Activity.contact_id == contact_id)
        if lead_id:
            query = query.filter(Activity.lead_id == lead_id)
        if opportunity_id:
            query = query.filter(Activity.opportunity_id == opportunity_id)

        query = query.order_by(Activity.created_at.desc()).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all())
