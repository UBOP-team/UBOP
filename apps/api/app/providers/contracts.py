from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional


class CustomerProvider(ABC):
    @abstractmethod
    async def create_customer(self, data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def get_customer(self, customer_id: int) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def list_customers(self, skip: int = 0, limit: int = 50) -> List[Dict[str, Any]]:
        pass


class InventoryProvider(ABC):
    @abstractmethod
    async def check_stock(self, product_id: int) -> int:
        pass

    @abstractmethod
    async def deduct_stock(self, product_id: int, quantity: int) -> bool:
        pass

    @abstractmethod
    async def restock(self, product_id: int, quantity: int) -> int:
        pass


class PaymentProvider(ABC):
    @abstractmethod
    async def process_payment(self, order_id: int, amount: float, currency: str = "USD") -> Dict[str, Any]:
        pass

    @abstractmethod
    async def refund_payment(self, payment_id: str, amount: float) -> Dict[str, Any]:
        pass


class NotificationProvider(ABC):
    @abstractmethod
    async def send_notification(self, recipient: str, title: str, message: str) -> bool:
        pass
