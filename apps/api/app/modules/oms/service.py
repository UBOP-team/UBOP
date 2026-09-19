import time
import uuid
from typing import Any, Dict, List, Optional
from app.core.events import Event, event_bus
from .models import Order, OrderItem
from .repository import OrderRepository


class OrderCreatedEvent(Event):
    def __init__(self, order_id: int, order_number: str, customer_id: int, total_amount: float, items: List[Dict[str, Any]]):
        super().__init__(
            name="order.created",
            payload={
                "order_id": order_id,
                "order_number": order_number,
                "customer_id": customer_id,
                "total_amount": total_amount,
                "items": items,
            },
        )


class OrderStatusUpdatedEvent(Event):
    def __init__(self, order_id: int, order_number: str, old_status: str, new_status: str):
        super().__init__(
            name="order.status_updated",
            payload={
                "order_id": order_id,
                "order_number": order_number,
                "old_status": old_status,
                "new_status": new_status,
            },
        )


class OrderService:
    def __init__(self, order_repo: Optional[OrderRepository] = None):
        self.order_repo = order_repo

    async def create_order(self, data: Any) -> Any:
        if not self.order_repo:
            return {"status": "created", "data": data}

        # Handle Pydantic OrderCreate or dict
        if isinstance(data, dict):
            customer_id = data["customer_id"]
            items_data = data.get("items", [])
        else:
            customer_id = data.customer_id
            items_data = [item.model_dump() for item in data.items]

        order_number = f"ORD-{int(time.time())}-{uuid.uuid4().hex[:6].upper()}"
        total_amount = sum(item["quantity"] * item["unit_price"] for item in items_data)

        order = Order(
            order_number=order_number,
            customer_id=customer_id,
            status="PENDING",
            total_amount=total_amount,
        )

        for item_data in items_data:
            order_item = OrderItem(
                product_id=item_data["product_id"],
                quantity=item_data["quantity"],
                unit_price=item_data["unit_price"],
            )
            order.items.append(order_item)

        created_order = await self.order_repo.create(order)

        # Publish domain event through EventBus
        await event_bus.publish(
            OrderCreatedEvent(
                order_id=created_order.id,
                order_number=created_order.order_number,
                customer_id=created_order.customer_id,
                total_amount=created_order.total_amount,
                items=items_data,
            )
        )

        # Eager load with items for clean response serialization
        return await self.order_repo.get_by_id(created_order.id)

    async def get_order(self, order_id: int) -> Optional[Order]:
        if not self.order_repo:
            return None
        return await self.order_repo.get_by_id(order_id)

    async def list_orders(self, skip: int = 0, limit: int = 100) -> List[Order]:
        if not self.order_repo:
            return []
        return await self.order_repo.get_all(skip=skip, limit=limit)

    async def update_status(self, order_id: int, new_status: str) -> Optional[Order]:
        if not self.order_repo:
            return None

        order = await self.order_repo.get_by_id(order_id)
        if not order:
            return None

        old_status = order.status
        order.status = new_status
        await self.order_repo.session.flush()

        # Publish status updated event
        await event_bus.publish(
            OrderStatusUpdatedEvent(
                order_id=order.id,
                order_number=order.order_number,
                old_status=old_status,
                new_status=new_status,
            )
        )

        return await self.order_repo.get_by_id(order_id)
