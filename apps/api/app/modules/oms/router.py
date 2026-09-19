from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from .schemas import OrderCreate, OrderResponse, OrderStatusUpdate
from .repository import OrderRepository
from .service import OrderService

router = APIRouter(prefix="/oms", tags=["OMS"])


def get_order_service(db: AsyncSession = Depends(get_db)) -> OrderService:
    repo = OrderRepository(db)
    return OrderService(order_repo=repo)


@router.post("/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_in: OrderCreate,
    service: OrderService = Depends(get_order_service),
):
    try:
        return await service.create_order(order_in)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/orders", response_model=List[OrderResponse])
async def list_orders(
    skip: int = 0,
    limit: int = 100,
    service: OrderService = Depends(get_order_service),
):
    return await service.list_orders(skip=skip, limit=limit)


@router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    service: OrderService = Depends(get_order_service),
):
    order = await service.get_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.patch("/orders/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: int,
    status_update: OrderStatusUpdate,
    service: OrderService = Depends(get_order_service),
):
    updated = await service.update_status(order_id, status_update.status)
    if not updated:
        raise HTTPException(status_code=404, detail="Order not found")
    return updated
