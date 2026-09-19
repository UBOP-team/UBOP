from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.repository import BaseRepository
from .models import Customer


class CustomerRepository(BaseRepository[Customer]):
    def __init__(self, session: AsyncSession):
        super().__init__(Customer, session)

    async def get_by_email(self, email: str) -> Optional[Customer]:
        result = await self.session.execute(select(Customer).filter(Customer.email == email))
        return result.scalars().first()
