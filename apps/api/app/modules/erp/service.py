from typing import List, Optional, Dict, Any
from app.providers.contracts import InventoryProvider
from .models import Product, InventoryItem
from .repository import ProductRepository, InventoryRepository
from .schemas import ProductCreate


class InventoryService(InventoryProvider):
    def __init__(
        self,
        product_repo: Optional[ProductRepository] = None,
        inventory_repo: Optional[InventoryRepository] = None,
    ):
        self.product_repo = product_repo
        self.inventory_repo = inventory_repo

    async def create_product(self, data: ProductCreate) -> Product:
        if not self.product_repo or not self.inventory_repo:
            raise ValueError("Repositories not configured")

        product = Product(
            sku=data.sku,
            name=data.name,
            description=data.description,
            price=data.price,
            cost=data.cost,
        )
        created_product = await self.product_repo.create(product)

        # Create initial inventory item
        inv = InventoryItem(
            product_id=created_product.id,
            warehouse=data.warehouse,
            quantity=data.initial_quantity,
        )
        await self.inventory_repo.create(inv)
        return created_product

    async def list_products(self, skip: int = 0, limit: int = 100) -> List[Product]:
        if not self.product_repo:
            return []
        return await self.product_repo.get_all(skip=skip, limit=limit)

    async def get_product(self, product_id: int) -> Optional[Product]:
        if not self.product_repo:
            return None
        return await self.product_repo.get_by_id(product_id)

    async def update_product(self, product_id: int, data: Any) -> Optional[Product]:
        if not self.product_repo:
            return None
        dump = data.model_dump(exclude_unset=True) if hasattr(data, "model_dump") else data
        return await self.product_repo.update(product_id, **dump)

    async def delete_product(self, product_id: int) -> bool:
        if not self.product_repo:
            return False
        return await self.product_repo.delete(product_id)

    async def list_inventory(self, skip: int = 0, limit: int = 100) -> List[InventoryItem]:
        if not self.inventory_repo:
            return []
        return await self.inventory_repo.get_all(skip=skip, limit=limit)

    async def update_stock(self, product_id: int, quantity_delta: int, warehouse: str = "MAIN") -> Dict[str, Any]:
        if not self.inventory_repo:
            return {"product_id": product_id, "quantity": quantity_delta}

        item = await self.inventory_repo.get_by_product_and_warehouse(product_id, warehouse)
        if not item:
            item = InventoryItem(product_id=product_id, warehouse=warehouse, quantity=max(0, quantity_delta))
            await self.inventory_repo.create(item)
            return {"product_id": product_id, "warehouse": warehouse, "quantity": item.quantity}

        new_quantity = item.quantity + quantity_delta
        if new_quantity < 0:
            raise ValueError(f"Insufficient stock for product {product_id}. Current: {item.quantity}")

        await self.inventory_repo.update(item.id, quantity=new_quantity)
        return {"product_id": product_id, "warehouse": warehouse, "quantity": new_quantity}

    # InventoryProvider contract methods
    async def check_stock(self, product_id: int, warehouse: str = "MAIN") -> int:
        if not self.inventory_repo:
            return 0
        item = await self.inventory_repo.get_by_product_and_warehouse(product_id, warehouse)
        return item.quantity if item else 0

    async def deduct_stock(self, product_id: int, quantity: int) -> bool:
        try:
            await self.update_stock(product_id, -quantity)
            return True
        except ValueError:
            return False

    async def restock(self, product_id: int, quantity: int) -> int:
        res = await self.update_stock(product_id, quantity)
        return res["quantity"]

    async def get_low_stock_items(self) -> List[InventoryItem]:
        if not self.inventory_repo:
            return []
        return await self.inventory_repo.get_low_stock()
