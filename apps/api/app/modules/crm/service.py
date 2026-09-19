from typing import List, Optional
from app.providers.contracts import CustomerProvider
from .models import Customer
from .repository import CustomerRepository
from .schemas import CustomerCreate, CustomerUpdate


class CustomerService:
    def __init__(self, repository: Optional[CustomerRepository] = None, provider: Optional[CustomerProvider] = None):
        self.repository = repository
        self.provider = provider

    async def create_customer(self, data: CustomerCreate) -> Customer:
        if self.repository:
            customer = Customer(
                name=data.name,
                email=data.email,
                phone=data.phone,
                company=data.company,
                status=data.status,
            )
            created = await self.repository.create(customer)
            return created
        elif self.provider:
            res = await self.provider.create_customer(data.model_dump())
            return Customer(id=res.get("id", 1), **data.model_dump())
        raise ValueError("Neither repository nor provider configured for CustomerService")

    async def get_customer(self, customer_id: int) -> Optional[Customer]:
        if self.repository:
            return await self.repository.get_by_id(customer_id)
        elif self.provider:
            res = await self.provider.get_customer(customer_id)
            if res:
                return Customer(**res)
        return None

    async def list_customers(self, skip: int = 0, limit: int = 100) -> List[Customer]:
        if self.repository:
            return await self.repository.get_all(skip=skip, limit=limit)
        elif self.provider:
            items = await self.provider.list_customers(skip=skip, limit=limit)
            return [Customer(**item) for item in items]
        return []

    async def update_customer(self, customer_id: int, data: CustomerUpdate) -> Optional[Customer]:
        if self.repository:
            update_data = {k: v for k, v in data.model_dump().items() if v is not None}
            if not update_data:
                return await self.repository.get_by_id(customer_id)
            return await self.repository.update(customer_id, **update_data)
        return None

    async def delete_customer(self, customer_id: int) -> bool:
        if self.repository:
            return await self.repository.delete(customer_id)
        return False
