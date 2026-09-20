from typing import List, Optional
from sqlalchemy import select, or_, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.repository import BaseRepository
from .models import (
    Order,
    Product,
    Fulfillment,
    Return,
)


class OrderRepository(BaseRepository[Order]):
    def __init__(self, session: AsyncSession):
        super().__init__(Order, session)

    async def create(self, obj: Order) -> Order:
        self.session.add(obj)
        await self.session.flush()
        return obj

    def _eager_options(self):
        return [
            selectinload(Order.lines),
            selectinload(Order.transactions),
            selectinload(Order.fulfillments),
            selectinload(Order.returns).selectinload(Return.lines),
            selectinload(Order.refunds),
            selectinload(Order.events),
        ]

    async def get_by_id(self, id: int) -> Optional[Order]:
        query = select(Order).options(*self._eager_options()).filter(Order.id == id)
        res = await self.session.execute(query)
        return res.scalars().first()

    async def get_by_order_number(self, order_number: str) -> Optional[Order]:
        query = select(Order).options(*self._eager_options()).filter(Order.order_number == order_number)
        res = await self.session.execute(query)
        return res.scalars().first()

    async def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        order_state: Optional[str] = None,
        payment_state: Optional[str] = None,
        fulfillment_state: Optional[str] = None,
        return_state: Optional[str] = None,
        sync_status: Optional[str] = None,
        source_type: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[Order]:
        query = select(Order).options(*self._eager_options()).order_by(desc(Order.id))

        if order_state and order_state != "ALL":
            query = query.filter(Order.order_state == order_state)
        if payment_state and payment_state != "ALL":
            query = query.filter(Order.payment_state == payment_state)
        if fulfillment_state and fulfillment_state != "ALL":
            query = query.filter(Order.fulfillment_state == fulfillment_state)
        if return_state and return_state != "ALL":
            query = query.filter(Order.return_state == return_state)
        if sync_status and sync_status != "ALL":
            query = query.filter(Order.sync_status == sync_status)
        if source_type and source_type != "ALL":
            query = query.filter(Order.source_type == source_type)

        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Order.order_number.ilike(search_pattern),
                    Order.customer_name.ilike(search_pattern),
                    Order.customer_email.ilike(search_pattern),
                    Order.external_order_id.ilike(search_pattern),
                )
            )

        query = query.offset(skip).limit(limit)
        res = await self.session.execute(query)
        return list(res.scalars().all())


class ProductRepository(BaseRepository[Product]):
    def __init__(self, session: AsyncSession):
        super().__init__(Product, session)

    async def get_by_id(self, id: int) -> Optional[Product]:
        query = select(Product).options(selectinload(Product.variants)).filter(Product.id == id)
        res = await self.session.execute(query)
        return res.scalars().first()

    async def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[Product]:
        query = select(Product).options(selectinload(Product.variants)).order_by(desc(Product.id))
        if status and status != "ALL":
            query = query.filter(Product.status == status)
        if search:
            pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Product.name.ilike(pattern),
                    Product.sku.ilike(pattern),
                )
            )
        query = query.offset(skip).limit(limit)
        res = await self.session.execute(query)
        return list(res.scalars().all())


class FulfillmentRepository(BaseRepository[Fulfillment]):
    def __init__(self, session: AsyncSession):
        super().__init__(Fulfillment, session)

    async def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        location: Optional[str] = None,
    ) -> List[Fulfillment]:
        query = select(Fulfillment).order_by(desc(Fulfillment.id))
        if status and status != "ALL":
            query = query.filter(Fulfillment.status == status)
        if location and location != "ALL":
            query = query.filter(Fulfillment.location_reference == location)
        query = query.offset(skip).limit(limit)
        res = await self.session.execute(query)
        return list(res.scalars().all())


class ReturnRepository(BaseRepository[Return]):
    def __init__(self, session: AsyncSession):
        super().__init__(Return, session)

    async def get_by_id(self, id: int) -> Optional[Return]:
        query = select(Return).options(selectinload(Return.lines)).filter(Return.id == id)
        res = await self.session.execute(query)
        return res.scalars().first()

    async def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
    ) -> List[Return]:
        query = select(Return).options(selectinload(Return.lines)).order_by(desc(Return.id))
        if status and status != "ALL":
            query = query.filter(Return.status == status)
        query = query.offset(skip).limit(limit)
        res = await self.session.execute(query)
        return list(res.scalars().all())
