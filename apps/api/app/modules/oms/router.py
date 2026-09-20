from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from .models import Product
from .schemas import (
    OrderCreate,
    OrderResponse,
    OrderStatusUpdate,
    RecordPaymentRequest,
    FulfillItemsRequest,
    CancelOrderRequest,
    CreateReturnRequest,
    ReviewReturnRequest,
    ProcessReturnRequest,
    CreateRefundRequest,
    FulfillmentResponse,
    ReturnResponse,
    ProductCreate,
    ProductResponse,
    OmsOverviewMetrics,
)
from .repository import (
    OrderRepository,
    ProductRepository,
    FulfillmentRepository,
    ReturnRepository,
)
from .service import OrderService

router = APIRouter(prefix="/oms", tags=["OMS"])


def get_order_service(db: AsyncSession = Depends(get_db)) -> OrderService:
    order_repo = OrderRepository(db)
    product_repo = ProductRepository(db)
    fulfillment_repo = FulfillmentRepository(db)
    return_repo = ReturnRepository(db)
    return OrderService(
        order_repo=order_repo,
        product_repo=product_repo,
        fulfillment_repo=fulfillment_repo,
        return_repo=return_repo,
    )


# ----------------------------------------------------------------------
# Overview Metrics
# ----------------------------------------------------------------------

@router.get("/overview/metrics", response_model=OmsOverviewMetrics)
async def get_overview_metrics(
    service: OrderService = Depends(get_order_service),
):
    return await service.get_overview_metrics()


# ----------------------------------------------------------------------
# Orders Operations
# ----------------------------------------------------------------------

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
    order_state: Optional[str] = Query(None),
    payment_state: Optional[str] = Query(None),
    fulfillment_state: Optional[str] = Query(None),
    return_state: Optional[str] = Query(None),
    sync_status: Optional[str] = Query(None),
    source_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    service: OrderService = Depends(get_order_service),
):
    return await service.list_orders(
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


@router.post("/orders/{order_id}/payments", response_model=OrderResponse)
async def record_payment(
    order_id: int,
    payment_in: RecordPaymentRequest,
    service: OrderService = Depends(get_order_service),
):
    try:
        return await service.record_payment(order_id, payment_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/orders/{order_id}/fulfillments", response_model=OrderResponse)
async def fulfill_items(
    order_id: int,
    fulfill_in: FulfillItemsRequest,
    service: OrderService = Depends(get_order_service),
):
    try:
        return await service.fulfill_items(order_id, fulfill_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/orders/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(
    order_id: int,
    cancel_in: CancelOrderRequest,
    service: OrderService = Depends(get_order_service),
):
    try:
        return await service.cancel_order(order_id, cancel_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/orders/{order_id}/archive", response_model=OrderResponse)
async def archive_order(
    order_id: int,
    service: OrderService = Depends(get_order_service),
):
    try:
        return await service.archive_order(order_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/orders/{order_id}/returns", response_model=OrderResponse)
async def create_return(
    order_id: int,
    return_in: CreateReturnRequest,
    service: OrderService = Depends(get_order_service),
):
    try:
        return await service.create_return(order_id, return_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/orders/{order_id}/refunds", response_model=OrderResponse)
async def issue_refund(
    order_id: int,
    refund_in: CreateRefundRequest,
    service: OrderService = Depends(get_order_service),
):
    try:
        return await service.issue_refund(order_id, refund_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/orders/{order_id}/sync/retry", response_model=OrderResponse)
async def retry_provider_sync(
    order_id: int,
    service: OrderService = Depends(get_order_service),
):
    try:
        return await service.retry_provider_sync(order_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ----------------------------------------------------------------------
# Work Queues (Fulfillments & Returns)
# ----------------------------------------------------------------------

@router.get("/fulfillments", response_model=List[FulfillmentResponse])
async def list_fulfillments(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    service: OrderService = Depends(get_order_service),
):
    return await service.fulfillment_repo.get_all(skip=skip, limit=limit, status=status, location=location)


@router.get("/returns", response_model=List[ReturnResponse])
async def list_returns(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = Query(None),
    service: OrderService = Depends(get_order_service),
):
    return await service.return_repo.get_all(skip=skip, limit=limit, status=status)


@router.get("/returns/{return_id}", response_model=ReturnResponse)
async def get_return(
    return_id: int,
    service: OrderService = Depends(get_order_service),
):
    ret = await service.return_repo.get_by_id(return_id)
    if not ret:
        raise HTTPException(status_code=404, detail="Return not found")
    return ret


@router.post("/returns/{return_id}/review", response_model=ReturnResponse)
async def review_return(
    return_id: int,
    review_in: ReviewReturnRequest,
    service: OrderService = Depends(get_order_service),
):
    try:
        return await service.review_return(return_id, review_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/returns/{return_id}/process", response_model=ReturnResponse)
async def process_return(
    return_id: int,
    process_in: ProcessReturnRequest,
    service: OrderService = Depends(get_order_service),
):
    try:
        return await service.process_return(return_id, process_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ----------------------------------------------------------------------
# Commercial Catalog (Products)
# ----------------------------------------------------------------------

@router.get("/products", response_model=List[ProductResponse])
async def list_products(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    service: OrderService = Depends(get_order_service),
):
    return await service.product_repo.get_all(skip=skip, limit=limit, status=status, search=search)


@router.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_in: ProductCreate,
    service: OrderService = Depends(get_order_service),
):
    product = Product(
        name=product_in.name,
        sku=product_in.sku,
        price=product_in.price,
        description=product_in.description,
        status=product_in.status,
    )
    created = await service.product_repo.create(product)
    return await service.product_repo.get_by_id(created.id)


@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: int,
    service: OrderService = Depends(get_order_service),
):
    prod = await service.product_repo.get_by_id(product_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    return prod
