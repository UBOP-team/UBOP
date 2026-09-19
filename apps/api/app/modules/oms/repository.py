from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.repository import BaseRepository
from .models import Order


class OrderRepository(BaseRepository[Order]):
    def __init__(self, session: AsyncSession):
        super().__init__(Order, session)

    async def get_by_id(self, id: int) -> Optional[Order]:
        query = select(Order).options(selectinload(Order.items)).filter(Order.id == id)
        res = await self.session.execute(query)
        return res.scalars().first()

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[Order]:
        query = select(Order).options(selectinload(Order.items)).order_by(Order.id.desc()).offset(skip).limit(limit)
        res = await self.session.execute(query)
        return list(res.scalars().all())

    async def get_by_order_number(self, order_number: str) -> Optional[Order]:
        query = select(Order).options(selectinload(Order.items)).filter(Order.order_number == order_number)
        res = await self.session.execute(query)
        return res.scalars().first()
