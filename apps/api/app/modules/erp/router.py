from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from .schemas import ProductCreate, ProductUpdate, ProductResponse, InventoryItemResponse, StockAdjustment
from .repository import ProductRepository, InventoryRepository
from .service import InventoryService

router = APIRouter(prefix="/erp", tags=["ERP"])


def get_inventory_service(db: AsyncSession = Depends(get_db)) -> InventoryService:
    p_repo = ProductRepository(db)
    i_repo = InventoryRepository(db)
    return InventoryService(product_repo=p_repo, inventory_repo=i_repo)


@router.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_in: ProductCreate,
    service: InventoryService = Depends(get_inventory_service),
):
    try:
        return await service.create_product(product_in)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/products", response_model=List[ProductResponse])
async def list_products(
    skip: int = 0,
    limit: int = 100,
    service: InventoryService = Depends(get_inventory_service),
):
    return await service.list_products(skip=skip, limit=limit)


@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: int,
    service: InventoryService = Depends(get_inventory_service),
):
    product = await service.get_product(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product_in: ProductUpdate,
    service: InventoryService = Depends(get_inventory_service),
):
    updated = await service.update_product(product_id, product_in)
    if not updated:
        raise HTTPException(status_code=404, detail="Product not found")
    return updated


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    service: InventoryService = Depends(get_inventory_service),
):
    success = await service.delete_product(product_id)
    if not success:
        raise HTTPException(status_code=404, detail="Product not found")
    return None


@router.get("/inventory", response_model=List[InventoryItemResponse])
async def list_inventory(
    skip: int = 0,
    limit: int = 100,
    service: InventoryService = Depends(get_inventory_service),
):
    return await service.list_inventory(skip=skip, limit=limit)


@router.get("/inventory/low-stock", response_model=List[InventoryItemResponse])
async def get_low_stock(
    service: InventoryService = Depends(get_inventory_service),
):
    return await service.get_low_stock_items()


@router.post("/inventory/adjust")
async def adjust_stock(
    adjustment: StockAdjustment,
    service: InventoryService = Depends(get_inventory_service),
):
    try:
        return await service.update_stock(
            product_id=adjustment.product_id,
            quantity_delta=adjustment.quantity_delta,
            warehouse=adjustment.warehouse,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
