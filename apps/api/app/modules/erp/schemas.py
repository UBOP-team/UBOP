from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class ProductBase(BaseModel):
    sku: str
    name: str
    description: Optional[str] = None
    price: float
    cost: float = 0.0


class ProductCreate(ProductBase):
    initial_quantity: int = 0
    warehouse: str = "MAIN"


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    cost: Optional[float] = None


class ProductResponse(ProductBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InventoryItemResponse(BaseModel):
    id: int
    product_id: int
    warehouse: str
    quantity: int
    reorder_level: int
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class StockAdjustment(BaseModel):
    product_id: int
    quantity_delta: int  # can be positive (restock) or negative (deduct)
    warehouse: str = "MAIN"
    reason: Optional[str] = "Manual adjustment"
