import uuid
from typing import Any, Dict
from ..contracts import PaymentProvider


class InternalPaymentProvider(PaymentProvider):
    def __init__(self):
        self._payments: Dict[str, Dict[str, Any]] = {}

    async def process_payment(self, order_id: int, amount: float, currency: str = "USD") -> Dict[str, Any]:
        payment_id = f"pay_{uuid.uuid4().hex[:12]}"
        record = {
            "payment_id": payment_id,
            "order_id": order_id,
            "amount": amount,
            "currency": currency,
            "status": "COMPLETED",
        }
        self._payments[payment_id] = record
        return record

    async def refund_payment(self, payment_id: str, amount: float) -> Dict[str, Any]:
        if payment_id in self._payments:
            self._payments[payment_id]["status"] = "REFUNDED"
            return {"payment_id": payment_id, "status": "REFUNDED", "refunded_amount": amount}
        return {"payment_id": payment_id, "status": "FAILED", "reason": "Not found"}
