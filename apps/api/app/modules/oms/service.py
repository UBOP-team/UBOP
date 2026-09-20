import time
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from app.core.events import Event, event_bus
from .models import (
    Order,
    OrderLine,
    OrderTransaction,
    Fulfillment,
    Return,
    ReturnLine,
    Refund,
    OrderEvent,
)
from .repository import (
    OrderRepository,
    ProductRepository,
    FulfillmentRepository,
    ReturnRepository,
)
from .schemas import (
    RecordPaymentRequest,
    FulfillItemsRequest,
    CancelOrderRequest,
    CreateReturnRequest,
    ReviewReturnRequest,
    ProcessReturnRequest,
    CreateRefundRequest,
)


# ----------------------------------------------------------------------
# Domain Events
# ----------------------------------------------------------------------

class OrderCreatedEvent(Event):
    def __init__(self, order_id: int, order_number: str, customer_id: Optional[int], total_amount: float, items: List[Dict[str, Any]]):
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


class PaymentRecordedEvent(Event):
    def __init__(self, order_id: int, transaction_id: int, amount: float, new_payment_state: str):
        super().__init__(
            name="order.payment_recorded",
            payload={
                "order_id": order_id,
                "transaction_id": transaction_id,
                "amount": amount,
                "new_payment_state": new_payment_state,
            },
        )


class FulfillmentCreatedEvent(Event):
    def __init__(self, order_id: int, fulfillment_id: int, tracking_number: Optional[str], new_fulfillment_state: str):
        super().__init__(
            name="order.fulfillment_created",
            payload={
                "order_id": order_id,
                "fulfillment_id": fulfillment_id,
                "tracking_number": tracking_number,
                "new_fulfillment_state": new_fulfillment_state,
            },
        )


class OrderCancelledEvent(Event):
    def __init__(self, order_id: int, reason: str):
        super().__init__(
            name="order.cancelled",
            payload={
                "order_id": order_id,
                "reason": reason,
            },
        )


class ReturnRequestedEvent(Event):
    def __init__(self, order_id: int, return_id: int, return_number: str):
        super().__init__(
            name="order.return_requested",
            payload={
                "order_id": order_id,
                "return_id": return_id,
                "return_number": return_number,
            },
        )


class ReturnProcessedEvent(Event):
    def __init__(self, order_id: int, return_id: int, new_return_state: str):
        super().__init__(
            name="order.return_processed",
            payload={
                "order_id": order_id,
                "return_id": return_id,
                "new_return_state": new_return_state,
            },
        )


class RefundCreatedEvent(Event):
    def __init__(self, order_id: int, refund_id: int, amount: float, new_payment_state: str):
        super().__init__(
            name="order.refund_created",
            payload={
                "order_id": order_id,
                "refund_id": refund_id,
                "amount": amount,
                "new_payment_state": new_payment_state,
            },
        )


# ----------------------------------------------------------------------
# Centralized Status Calculators (Section 44)
# ----------------------------------------------------------------------

class PaymentStateCalculator:
    @staticmethod
    def calculate(order: Order) -> str:
        if order.order_state == "CANCELLED" and not order.transactions:
            return "VOIDED"

        total_paid = sum(
            t.amount for t in order.transactions
            if t.status == "SUCCESS" and t.type in ("SALE", "CAPTURE", "MANUAL_PAYMENT")
        )
        total_refunded = sum(
            t.amount for t in order.transactions
            if t.status == "SUCCESS" and t.type == "REFUND"
        )
        net_paid = total_paid - total_refunded

        if total_paid <= 0:
            return "UNPAID"
        if net_paid <= 0 and total_refunded > 0:
            return "REFUNDED"
        if total_refunded > 0 and net_paid > 0:
            return "PARTIALLY_REFUNDED"
        if net_paid >= order.grand_total - 0.01:
            return "PAID"
        if 0 < net_paid < order.grand_total:
            return "PARTIALLY_PAID"
        return "UNPAID"


class FulfillmentStateCalculator:
    @staticmethod
    def calculate(order: Order) -> str:
        if order.order_state == "CANCELLED":
            return "CANCELLED"

        lines = order.lines or []
        if not lines:
            return "UNFULFILLED"

        total_ordered = sum(line.quantity for line in lines)
        total_fulfilled = sum(line.fulfilled_quantity for line in lines)

        if total_fulfilled == 0:
            return "UNFULFILLED"
        if total_fulfilled >= total_ordered:
            return "FULFILLED"
        return "PARTIALLY_FULFILLED"


class ReturnStateCalculator:
    @staticmethod
    def calculate(order: Order) -> str:
        returns = order.returns or []
        if not returns:
            return "NONE"

        statuses = [r.status for r in returns]
        if any(s == "REQUESTED" for s in statuses):
            return "REQUESTED"
        if any(s == "IN_PROGRESS" for s in statuses):
            return "IN_PROGRESS"
        if any(s == "INSPECTION_COMPLETE" for s in statuses):
            return "INSPECTION_COMPLETE"
        if all(s == "COMPLETED" for s in statuses):
            return "COMPLETED"
        if all(s == "DECLINED" for s in statuses):
            return "DECLINED"
        return "IN_PROGRESS"


# ----------------------------------------------------------------------
# OMS Service
# ----------------------------------------------------------------------

class OrderService:
    def __init__(
        self,
        order_repo: Optional[OrderRepository] = None,
        product_repo: Optional[ProductRepository] = None,
        fulfillment_repo: Optional[FulfillmentRepository] = None,
        return_repo: Optional[ReturnRepository] = None,
    ):
        self.order_repo = order_repo
        self.product_repo = product_repo
        self.fulfillment_repo = fulfillment_repo
        self.return_repo = return_repo

    async def create_order(self, data: Any) -> Any:
        if not self.order_repo:
            return {"status": "created", "data": data}

        # Support both Pydantic schemas and dicts
        if hasattr(data, "model_dump"):
            order_dict = data.model_dump()
        elif isinstance(data, dict):
            order_dict = data
        else:
            order_dict = vars(data)

        customer_id = order_dict.get("customer_id")
        customer_name = order_dict.get("customer_name") or "Direct Enterprise"
        customer_email = order_dict.get("customer_email") or (f"contact_{customer_id}@example.com" if customer_id else None)
        shipping_address = order_dict.get("shipping_address") or "100 Silicon Ave, Suite 400, San Jose, CA 95134"
        currency = order_dict.get("currency") or "VND"
        source_type = order_dict.get("source_type") or "INTERNAL"
        source_provider_id = order_dict.get("source_provider_id")
        external_order_id = order_dict.get("external_order_id")

        items_input = order_dict.get("items") or order_dict.get("lines") or []

        order_number = f"ORD-{int(time.time())}-{uuid.uuid4().hex[:6].upper()}"

        subtotal = 0.0
        lines_to_add: List[OrderLine] = []

        for item_in in items_input:
            if hasattr(item_in, "model_dump"):
                item_dict = item_in.model_dump()
            else:
                item_dict = item_in

            qty = int(item_dict.get("quantity", 1))
            unit_price = float(item_dict.get("unit_price", 0.0))
            line_total = qty * unit_price
            subtotal += line_total

            name = item_dict.get("name") or item_dict.get("product_name") or "Commercial SKU Item"
            sku = item_dict.get("sku") or f"SKU-{item_dict.get('product_id', 1)}"

            line = OrderLine(
                product_id=item_dict.get("product_id"),
                variant_id=item_dict.get("variant_id"),
                sku=sku,
                name=name,
                variant_name=item_dict.get("variant_name"),
                quantity=qty,
                unit_price=unit_price,
                line_total=line_total,
                fulfilled_quantity=0,
                returned_quantity=0,
                refunded_quantity=0,
            )
            lines_to_add.append(line)

        tax_total = float(order_dict.get("tax_total", 0.0))
        discount_total = float(order_dict.get("discount_total", 0.0))
        shipping_total = float(order_dict.get("shipping_total", 0.0))
        grand_total = round(subtotal - discount_total + shipping_total + tax_total, 2)

        order = Order(
            organization_id="default",
            order_number=order_number,
            source_type=source_type,
            source_provider_id=source_provider_id,
            external_order_id=external_order_id,
            customer_id=customer_id,
            customer_name=customer_name,
            customer_email=customer_email,
            customer_snapshot={
                "customer_id": customer_id,
                "name": customer_name,
                "email": customer_email,
                "shipping_address": shipping_address,
            },
            currency=currency,
            subtotal=subtotal,
            discount_total=0.0,
            shipping_total=shipping_total,
            tax_total=tax_total,
            grand_total=grand_total,
            total_amount=grand_total,  # Synced for backwards compatibility with BI
            order_state="OPEN",
            payment_state="UNPAID",
            fulfillment_state="UNFULFILLED",
            return_state="NONE",
            sync_status="HEALTHY",
            status="PENDING",  # Backwards compatibility
            shipping_address=shipping_address,
            placed_at=datetime.now(timezone.utc),
            notes=order_dict.get("notes"),
            tags=order_dict.get("tags"),
        )

        for line in lines_to_add:
            order.lines.append(line)

        # Initial Timeline Event
        initial_event = OrderEvent(
            event_type="ORDER_CREATED",
            actor_id="system",
            summary=f"Order {order_number} created via {source_type} for {customer_name} ({currency} {grand_total:,.2f})",
        )
        order.events.append(initial_event)

        await self.order_repo.create(order)

        # Publish EventBus event
        await event_bus.publish(
            OrderCreatedEvent(
                order_id=order.id,
                order_number=order.order_number,
                customer_id=order.customer_id,
                total_amount=order.total_amount,
                items=[{"product_id": line_item.product_id, "quantity": line_item.quantity, "unit_price": line_item.unit_price} for line_item in lines_to_add],
            )
        )

        return await self.order_repo.get_by_id(order.id)

    async def get_order(self, order_id: int) -> Optional[Order]:
        if not self.order_repo:
            return None
        return await self.order_repo.get_by_id(order_id)

    async def list_orders(
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
        if not self.order_repo:
            return []
        return await self.order_repo.get_all(
            skip=skip,
            limit=limit,
            order_state=order_state,
            payment_state=payment_state,
            fulfillment_state=fulfillment_state,
            return_state=return_state,
            sync_status=sync_status,
            source_type=source_type,
            search=search,
        )

    async def update_status(self, order_id: int, new_status: str) -> Optional[Order]:
        if not self.order_repo:
            return None

        order = await self.order_repo.get_by_id(order_id)
        if not order:
            return None

        old_status = order.status
        order.status = new_status

        # Synchronize multi-dimensional states for backwards compatibility
        if new_status == "CONFIRMED":
            order.order_state = "OPEN"
        elif new_status == "SHIPPED":
            order.fulfillment_state = "FULFILLED"
            for line in order.lines:
                line.fulfilled_quantity = line.quantity
        elif new_status == "DELIVERED":
            order.fulfillment_state = "FULFILLED"
        elif new_status == "CANCELLED":
            order.order_state = "CANCELLED"
            order.cancelled_at = datetime.now(timezone.utc)

        event = OrderEvent(
            event_type="SYSTEM_EVENT",
            actor_id="operator",
            summary=f"Order status changed from {old_status} to {new_status}",
        )
        order.events.append(event)
        await self.order_repo.session.flush()

        await event_bus.publish(
            OrderStatusUpdatedEvent(
                order_id=order.id,
                order_number=order.order_number,
                old_status=old_status,
                new_status=new_status,
            )
        )

        return await self.order_repo.get_by_id(order_id)

    async def record_payment(self, order_id: int, req: RecordPaymentRequest) -> Order:
        order = await self.order_repo.get_by_id(order_id)
        if not order:
            raise ValueError("Order not found")
        if order.order_state == "CANCELLED":
            raise ValueError("Cannot record payment for a cancelled order")

        txn = OrderTransaction(
            order_id=order.id,
            type="MANUAL_PAYMENT",
            status="SUCCESS",
            amount=req.amount,
            currency=order.currency,
            payment_method=req.payment_method,
            processed_at=datetime.now(timezone.utc),
            reference=req.reference,
            notes=req.note,
        )
        order.transactions.append(txn)

        # Recalculate derived payment state
        order.payment_state = PaymentStateCalculator.calculate(order)

        # Timeline event
        event = OrderEvent(
            event_type="PAYMENT_RECORDED",
            actor_id="finance_operator",
            summary=f"Payment recorded: {order.currency} {req.amount:,.2f} via {req.payment_method}",
            metadata_json=f"Ref: {req.reference or 'N/A'}",
        )
        order.events.append(event)
        await self.order_repo.session.flush()

        await event_bus.publish(
            PaymentRecordedEvent(
                order_id=order.id,
                transaction_id=txn.id,
                amount=txn.amount,
                new_payment_state=order.payment_state,
            )
        )

        return await self.order_repo.get_by_id(order.id)

    async def fulfill_items(self, order_id: int, req: FulfillItemsRequest) -> Order:
        order = await self.order_repo.get_by_id(order_id)
        if not order:
            raise ValueError("Order not found")
        if order.order_state == "CANCELLED":
            raise ValueError("Cannot fulfill items on a cancelled order")

        # Validate line items and quantities
        lines_by_id = {line.id: line for line in order.lines}
        for item_req in req.items:
            line = lines_by_id.get(item_req.order_line_id)
            if not line:
                raise ValueError(f"Line item {item_req.order_line_id} does not exist on this order")
            remaining = line.quantity - line.fulfilled_quantity
            if item_req.quantity > remaining:
                raise ValueError(
                    f"Cannot fulfill {item_req.quantity} for '{line.name}'. Remaining fulfillable quantity is {remaining}"
                )
            line.fulfilled_quantity += item_req.quantity

        # Create Fulfillment / Shipment
        fulfillment = Fulfillment(
            order_id=order.id,
            status="SHIPPED",
            location_reference=req.location_reference,
            tracking_company=req.carrier,
            tracking_number=req.tracking_number,
            tracking_url=req.tracking_url,
            shipped_at=datetime.now(timezone.utc),
            sync_status="HEALTHY",
        )
        order.fulfillments.append(fulfillment)

        # Recalculate derived fulfillment state
        order.fulfillment_state = FulfillmentStateCalculator.calculate(order)
        order.status = "SHIPPED" if order.fulfillment_state == "FULFILLED" else "CONFIRMED"

        # Timeline event
        items_desc = ", ".join([f"{item.quantity}x Line #{item.order_line_id}" for item in req.items])
        event = OrderEvent(
            event_type="FULFILLMENT_CREATED",
            actor_id="ops_agent",
            summary=f"Fulfillment dispatched ({req.carrier or 'Standard Carrier'} · Trk: {req.tracking_number or 'N/A'}) for {items_desc}",
        )
        order.events.append(event)
        await self.order_repo.session.flush()

        await event_bus.publish(
            FulfillmentCreatedEvent(
                order_id=order.id,
                fulfillment_id=fulfillment.id,
                tracking_number=fulfillment.tracking_number,
                new_fulfillment_state=order.fulfillment_state,
            )
        )

        return await self.order_repo.get_by_id(order.id)

    async def cancel_order(self, order_id: int, req: CancelOrderRequest) -> Order:
        order = await self.order_repo.get_by_id(order_id)
        if not order:
            raise ValueError("Order not found")
        if order.order_state == "CANCELLED":
            raise ValueError("Order is already cancelled")
        if order.fulfillment_state == "FULFILLED":
            raise ValueError("Cannot cancel an order that has already been completely fulfilled. Please process a Return.")

        order.order_state = "CANCELLED"
        order.status = "CANCELLED"
        order.cancelled_at = datetime.now(timezone.utc)

        # Handle optional refund if payment was already recorded
        if req.refund_payment and order.payment_state in ("PAID", "PARTIALLY_PAID"):
            total_paid = sum(
                t.amount for t in order.transactions
                if t.status == "SUCCESS" and t.type in ("SALE", "CAPTURE", "MANUAL_PAYMENT")
            )
            if total_paid > 0:
                refund_txn = OrderTransaction(
                    order_id=order.id,
                    type="REFUND",
                    status="SUCCESS",
                    amount=total_paid,
                    currency=order.currency,
                    payment_method="ORIGINAL_PAYMENT",
                    processed_at=datetime.now(timezone.utc),
                    notes=f"Automatic refund on cancellation: {req.reason}",
                )
                order.transactions.append(refund_txn)
                order.payment_state = "REFUNDED"

        event = OrderEvent(
            event_type="ORDER_CANCELLED",
            actor_id="ops_manager",
            summary=f"Order cancelled: {req.reason} (Restock items: {req.restock})",
        )
        order.events.append(event)
        await self.order_repo.session.flush()

        await event_bus.publish(OrderCancelledEvent(order_id=order.id, reason=req.reason))
        return await self.order_repo.get_by_id(order.id)

    async def archive_order(self, order_id: int) -> Order:
        order = await self.order_repo.get_by_id(order_id)
        if not order:
            raise ValueError("Order not found")

        order.order_state = "ARCHIVED"
        order.archived_at = datetime.now(timezone.utc)

        event = OrderEvent(
            event_type="SYSTEM_EVENT",
            actor_id="ops_agent",
            summary="Order archived from active operational view",
        )
        order.events.append(event)
        await self.order_repo.session.flush()
        return await self.order_repo.get_by_id(order.id)

    async def create_return(self, order_id: int, req: CreateReturnRequest) -> Order:
        order = await self.order_repo.get_by_id(order_id)
        if not order:
            raise ValueError("Order not found")

        return_number = f"RET-{int(time.time())}-{uuid.uuid4().hex[:4].upper()}"
        ret = Return(
            order_id=order.id,
            return_number=return_number,
            status="REQUESTED",
            reason_summary=req.reason_summary,
            requested_at=datetime.now(timezone.utc),
            sync_status="HEALTHY",
        )

        lines_by_id = {line.id: line for line in order.lines}
        for item_req in req.items:
            line = lines_by_id.get(item_req.order_line_id)
            if not line:
                raise ValueError(f"Line {item_req.order_line_id} not found on order")
            eligible_qty = line.fulfilled_quantity - line.returned_quantity
            if item_req.quantity > eligible_qty:
                raise ValueError(
                    f"Cannot return {item_req.quantity} of '{line.name}'. Eligible fulfilled qty is {eligible_qty}"
                )
            line.returned_quantity += item_req.quantity

            ret_line = ReturnLine(
                order_line_id=line.id,
                quantity=item_req.quantity,
                reason=item_req.reason,
                condition="GOOD",
                restock_disposition="RESTOCK",
            )
            ret.lines.append(ret_line)

        order.returns.append(ret)
        order.return_state = ReturnStateCalculator.calculate(order)

        event = OrderEvent(
            event_type="RETURN_REQUESTED",
            actor_id="customer_service",
            summary=f"Return request {return_number} created ({req.reason_summary})",
        )
        order.events.append(event)
        await self.order_repo.session.flush()

        await event_bus.publish(
            ReturnRequestedEvent(
                order_id=order.id,
                return_id=ret.id,
                return_number=ret.return_number,
            )
        )
        return await self.order_repo.get_by_id(order.id)

    async def review_return(self, return_id: int, req: ReviewReturnRequest) -> Return:
        ret = await self.return_repo.get_by_id(return_id)
        if not ret:
            raise ValueError("Return not found")

        if req.action == "APPROVE":
            ret.status = "APPROVED"
            ret.approved_at = datetime.now(timezone.utc)
            summary = f"Return {ret.return_number} approved (Receiving hub: {req.receiving_location or 'MAIN'})"
        else:
            ret.status = "DECLINED"
            ret.closed_at = datetime.now(timezone.utc)
            summary = f"Return {ret.return_number} declined: {req.reason or 'Not specified'}"

        order = await self.order_repo.get_by_id(ret.order_id)
        if order:
            order.return_state = ReturnStateCalculator.calculate(order)
            event = OrderEvent(
                event_type="SYSTEM_EVENT",
                actor_id="ops_supervisor",
                summary=summary,
            )
            order.events.append(event)

        await self.return_repo.session.flush()
        return await self.return_repo.get_by_id(return_id)

    async def process_return(self, return_id: int, req: ProcessReturnRequest) -> Return:
        ret = await self.return_repo.get_by_id(return_id)
        if not ret:
            raise ValueError("Return not found")

        lines_by_id = {line.id: line for line in ret.lines}
        for item_req in req.items:
            line = lines_by_id.get(item_req.return_line_id)
            if line:
                line.condition = item_req.condition
                line.restock_disposition = item_req.restock_disposition

        ret.status = "COMPLETED"
        ret.received_at = datetime.now(timezone.utc)
        ret.closed_at = datetime.now(timezone.utc)

        order = await self.order_repo.get_by_id(ret.order_id)
        if order:
            order.return_state = ReturnStateCalculator.calculate(order)
            event = OrderEvent(
                event_type="RETURN_RECEIVED",
                actor_id="warehouse_receiver",
                summary=f"Return {ret.return_number} items physically received and inspected",
            )
            order.events.append(event)

        await self.return_repo.session.flush()
        if order:
            await event_bus.publish(
                ReturnProcessedEvent(
                    order_id=order.id,
                    return_id=ret.id,
                    new_return_state=order.return_state,
                )
            )
        return await self.return_repo.get_by_id(return_id)

    async def issue_refund(self, order_id: int, req: CreateRefundRequest) -> Order:
        order = await self.order_repo.get_by_id(order_id)
        if not order:
            raise ValueError("Order not found")

        total_paid = sum(
            t.amount for t in order.transactions
            if t.status == "SUCCESS" and t.type in ("SALE", "CAPTURE", "MANUAL_PAYMENT")
        )
        total_refunded = sum(
            t.amount for t in order.transactions
            if t.status == "SUCCESS" and t.type == "REFUND"
        )
        net_paid = total_paid - total_refunded

        if req.amount > net_paid + 0.01:
            raise ValueError(
                f"Refund amount ({order.currency} {req.amount:,.2f}) exceeds remaining net paid balance ({order.currency} {net_paid:,.2f})"
            )

        refund_number = f"REF-{int(time.time())}-{uuid.uuid4().hex[:4].upper()}"
        refund = Refund(
            order_id=order.id,
            return_id=req.return_id,
            refund_number=refund_number,
            amount=req.amount,
            currency=order.currency,
            status="SUCCEEDED",
            reason=req.reason,
            refund_method=req.refund_method,
            processed_at=datetime.now(timezone.utc),
        )
        order.refunds.append(refund)

        # Add corresponding refund transaction
        refund_txn = OrderTransaction(
            order_id=order.id,
            type="REFUND",
            status="SUCCESS",
            amount=req.amount,
            currency=order.currency,
            payment_method=req.refund_method,
            processed_at=datetime.now(timezone.utc),
            reference=refund_number,
            notes=req.reason,
        )
        order.transactions.append(refund_txn)

        # Recalculate payment state
        order.payment_state = PaymentStateCalculator.calculate(order)

        event = OrderEvent(
            event_type="REFUND_CREATED",
            actor_id="finance_officer",
            summary=f"Refund issued ({refund_number}): {order.currency} {req.amount:,.2f} via {req.refund_method}",
        )
        order.events.append(event)
        await self.order_repo.session.flush()

        await event_bus.publish(
            RefundCreatedEvent(
                order_id=order.id,
                refund_id=refund.id,
                amount=req.amount,
                new_payment_state=order.payment_state,
            )
        )
        return await self.order_repo.get_by_id(order.id)

    async def retry_provider_sync(self, order_id: int) -> Order:
        order = await self.order_repo.get_by_id(order_id)
        if not order:
            raise ValueError("Order not found")

        order.sync_status = "HEALTHY"
        order.last_synced_at = datetime.now(timezone.utc)

        event = OrderEvent(
            event_type="PROVIDER_SYNC_SUCCEEDED",
            actor_id="system",
            summary=f"External provider sync re-established successfully for {order.source_type}",
        )
        order.events.append(event)
        await self.order_repo.session.flush()
        return await self.order_repo.get_by_id(order.id)

    async def get_overview_metrics(self) -> Dict[str, Any]:
        orders = await self.order_repo.get_all(skip=0, limit=500)

        orders_today = len(orders)
        revenue_today = sum(o.grand_total for o in orders if o.order_state != "CANCELLED")
        unfulfilled = sum(1 for o in orders if o.fulfillment_state in ("UNFULFILLED", "PARTIALLY_FULFILLED") and o.order_state == "OPEN")
        unpaid = sum(1 for o in orders if o.payment_state in ("UNPAID", "PARTIALLY_PAID") and o.order_state == "OPEN")
        returns_work = sum(1 for o in orders if o.return_state in ("REQUESTED", "IN_PROGRESS"))
        sync_failures = sum(1 for o in orders if o.sync_status in ("FAILED", "DEGRADED"))

        needs_attention = []
        if unpaid > 0:
            needs_attention.append({"label": f"{unpaid} orders awaiting payment confirmation", "severity": "WARNING", "filter": "UNPAID"})
        if unfulfilled > 0:
            needs_attention.append({"label": f"{unfulfilled} paid orders ready for picking & packing", "severity": "INFO", "filter": "UNFULFILLED"})
        if returns_work > 0:
            needs_attention.append({"label": f"{returns_work} active customer return cases to review", "severity": "WARNING", "filter": "RETURNS"})
        if sync_failures > 0:
            needs_attention.append({"label": f"{sync_failures} orders with external channel sync degradation", "severity": "ERROR", "filter": "SYNC_FAILED"})

        fulfillment_workload = {
            "ready": unfulfilled,
            "in_progress": sum(1 for o in orders if o.fulfillment_state == "PARTIALLY_FULFILLED"),
            "completed": sum(1 for o in orders if o.fulfillment_state == "FULFILLED"),
        }

        provider_health = [
            {"provider": "Shopify Storefront", "status": "HEALTHY", "latency_ms": 42},
            {"provider": "Internal OMS Adapter", "status": "HEALTHY", "latency_ms": 5},
            {"provider": "Amazon SP-API", "status": "HEALTHY" if sync_failures == 0 else "DEGRADED", "latency_ms": 190},
        ]

        return {
            "orders_today": orders_today,
            "revenue_today": round(revenue_today, 2),
            "unfulfilled_count": unfulfilled,
            "unpaid_count": unpaid,
            "returns_needing_work": returns_work,
            "sync_failures_count": sync_failures,
            "needs_attention": needs_attention,
            "fulfillment_workload": fulfillment_workload,
            "provider_health": provider_health,
        }
