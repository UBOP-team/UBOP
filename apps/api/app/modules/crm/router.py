from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from .schemas import CustomerCreate, CustomerUpdate, CustomerResponse
from .repository import CustomerRepository
from .service import CustomerService

router = APIRouter(prefix="/crm", tags=["CRM"])


def get_crm_service(db: AsyncSession = Depends(get_db)) -> CustomerService:
    repo = CustomerRepository(db)
    return CustomerService(repository=repo)


@router.post("/customers", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
async def create_customer(
    customer_in: CustomerCreate,
    service: CustomerService = Depends(get_crm_service),
):
    return await service.create_customer(customer_in)


@router.get("/customers", response_model=List[CustomerResponse])
async def list_customers(
    skip: int = 0,
    limit: int = 100,
    service: CustomerService = Depends(get_crm_service),
):
    return await service.list_customers(skip=skip, limit=limit)


@router.get("/customers/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: int,
    service: CustomerService = Depends(get_crm_service),
):
    customer = await service.get_customer(customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.put("/customers/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: int,
    customer_in: CustomerUpdate,
    service: CustomerService = Depends(get_crm_service),
):
    customer = await service.update_customer(customer_id, customer_in)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.delete("/customers/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_customer(
    customer_id: int,
    service: CustomerService = Depends(get_crm_service),
):
    success = await service.delete_customer(customer_id)
    if not success:
        raise HTTPException(status_code=404, detail="Customer not found")
    return None
