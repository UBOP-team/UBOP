from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class OrderItemBase(BaseModel):
    product_id: int
    quantity: int
    unit_price: float


class OrderItemCreate(OrderItemBase):
    pass


class OrderItemResponse(OrderItemBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class OrderCreate(BaseModel):
    customer_id: int
    items: List[OrderItemCreate]


class OrderStatusUpdate(BaseModel):
    status: str  # PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED


class OrderResponse(BaseModel):
    id: int
    order_number: str
    customer_id: int
    status: str
    total_amount: float
    created_at: datetime
    updated_at: Optional[datetime] = None
    items: List[OrderItemResponse] = []

    model_config = ConfigDict(from_attributes=True)
