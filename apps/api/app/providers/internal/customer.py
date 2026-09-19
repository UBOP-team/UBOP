from typing import Any, Dict, List, Optional
from ..contracts import CustomerProvider


class InternalCustomerProvider(CustomerProvider):
    def __init__(self):
        self._store: Dict[int, Dict[str, Any]] = {}
        self._id_counter: int = 1

    async def create_customer(self, data: Dict[str, Any]) -> Dict[str, Any]:
        cid = data.get("id") or self._id_counter
        self._id_counter += 1
        record = {**data, "id": cid}
        self._store[cid] = record
        return record

    async def get_customer(self, customer_id: int) -> Optional[Dict[str, Any]]:
        return self._store.get(customer_id)

    async def list_customers(self, skip: int = 0, limit: int = 50) -> List[Dict[str, Any]]:
        all_items = list(self._store.values())
        return all_items[skip : skip + limit]
