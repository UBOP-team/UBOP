from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.repository import BaseRepository
from .models import Product, InventoryItem


class ProductRepository(BaseRepository[Product]):
    def __init__(self, session: AsyncSession):
        super().__init__(Product, session)

    async def get_by_sku(self, sku: str) -> Optional[Product]:
        res = await self.session.execute(select(Product).filter(Product.sku == sku))
        return res.scalars().first()


class InventoryRepository(BaseRepository[InventoryItem]):
    def __init__(self, session: AsyncSession):
        super().__init__(InventoryItem, session)

    async def get_by_product_and_warehouse(self, product_id: int, warehouse: str = "MAIN") -> Optional[InventoryItem]:
        query = select(InventoryItem).filter(
            InventoryItem.product_id == product_id,
            InventoryItem.warehouse == warehouse,
        )
        res = await self.session.execute(query)
        return res.scalars().first()

    async def get_low_stock(self) -> List[InventoryItem]:
        query = select(InventoryItem).filter(InventoryItem.quantity <= InventoryItem.reorder_level)
        res = await self.session.execute(query)
        return list(res.scalars().all())
