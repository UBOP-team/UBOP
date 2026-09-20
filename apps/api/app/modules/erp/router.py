from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from .schemas import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    InventoryItemResponse,
    StockAdjustment,
    WarehouseCreate,
    WarehouseResponse,
    InventoryPositionResponse,
    StockAdjustmentRequest,
    InventoryReservationRequest,
    StockReservationResponse,
    GoodsMovementResponse,
    SupplierCreate,
    SupplierUpdate,
    SupplierResponse,
    PurchaseRequisitionCreate,
    PurchaseRequisitionResponse,
    RequisitionActionRequest,
    PurchaseOrderCreate,
    PurchaseOrderResponse,
    POActionRequest,
    GoodsReceiptCreate,
    GoodsReceiptResponse,
    ReceiptReversalRequest,
    StockTransferCreate,
    StockTransferResponse,
    StockTransferActionRequest,
    SupplierInvoiceCreate,
    SupplierInvoiceResponse,
    MismatchResolutionRequest,
    CostTransactionResponse,
    ErpOverviewMetricsResponse,
)
from .models import InventoryPosition
from .repository import (
    ProductRepository,
    InventoryRepository,
    InventoryPositionRepository,
    GoodsMovementRepository,
    CostTransactionRepository,
)
from .service import (
    InventoryService,
    WarehouseService,
    StockAdjustmentService,
    StockReservationService,
    SupplierService,
    PurchaseRequisitionService,
    PurchaseOrderService,
    GoodsReceiptService,
    StockTransferService,
    SupplierInvoiceService,
    ErpOverviewMetricsService,
)

router = APIRouter(prefix="/erp", tags=["ERP"])


# --------------------------------------------------------------------
# Dependency Injection Helpers
# --------------------------------------------------------------------

def get_inventory_service(db: AsyncSession = Depends(get_db)) -> InventoryService:
    p_repo = ProductRepository(db)
    i_repo = InventoryRepository(db)
    pos_repo = InventoryPositionRepository(db)
    return InventoryService(product_repo=p_repo, inventory_repo=i_repo, position_repo=pos_repo)


# ====================================================================
# BACKWARD-COMPATIBLE ENDPOINTS (Preserved for existing OMS/BI contracts)
# ====================================================================

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


# ====================================================================
# CANONICAL ERP ROUTER (SAP Fiori Floorplans & Procurement Workflows)
# ====================================================================

# 1. Warehouses
@router.get("/warehouses", response_model=List[WarehouseResponse])
async def list_warehouses(db: AsyncSession = Depends(get_db)):
    service = WarehouseService(db)
    return await service.list_warehouses()


@router.post("/warehouses", response_model=WarehouseResponse, status_code=status.HTTP_201_CREATED)
async def create_warehouse(data: WarehouseCreate, db: AsyncSession = Depends(get_db)):
    service = WarehouseService(db)
    try:
        return await service.create_warehouse(data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/warehouses/{warehouse_id}", response_model=WarehouseResponse)
async def get_warehouse(warehouse_id: int, db: AsyncSession = Depends(get_db)):
    service = WarehouseService(db)
    wh = await service.get_warehouse(warehouse_id)
    if not wh:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    return wh


# 2. Inventory Positions & Analytical List
@router.get("/inventory/positions", response_model=List[InventoryPositionResponse])
async def list_inventory_positions(
    warehouse_id: Optional[int] = None,
    product_reference: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    repo = InventoryPositionRepository(db)
    positions = await repo.get_all_positions(warehouse_id, product_reference)
    if not positions:
        # Seed default inventory position if empty
        default_pos = await repo.create(
            InventoryPosition(
                product_reference="SKU-SERV-01",
                product_name="Enterprise Database Server Rack",
                warehouse_id=1,
                on_hand_quantity=120.0,
                reserved_quantity=30.0,
                blocked_quantity=0.0,
                incoming_quantity=50.0,
                unit_cost=15000000.0,
                unit="pcs",
                reorder_threshold=15.0,
            )
        )
        positions = [default_pos]
    return positions


@router.get("/inventory/positions/{product_ref}", response_model=List[InventoryPositionResponse])
async def get_product_positions(product_ref: str, db: AsyncSession = Depends(get_db)):
    repo = InventoryPositionRepository(db)
    return await repo.get_positions_for_product(product_ref)


@router.post("/inventory/adjustments", response_model=InventoryPositionResponse)
async def post_stock_adjustment(data: StockAdjustmentRequest, db: AsyncSession = Depends(get_db)):
    service = StockAdjustmentService(db)
    try:
        return await service.post_adjustment(data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# 3. Stock Reservations (OMS Contract Port)
@router.post("/inventory/reservations", response_model=StockReservationResponse)
async def reserve_stock(data: InventoryReservationRequest, db: AsyncSession = Depends(get_db)):
    service = StockReservationService(db)
    try:
        return await service.reserve_stock(
            product_ref=data.product_reference,
            warehouse_id=data.warehouse_id,
            source_ref=data.source_reference,
            quantity=data.quantity,
            location_id=data.storage_location_id,
            source_type=data.source_type,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/inventory/reservations/release")
async def release_reservation(product_reference: str, source_reference: str, db: AsyncSession = Depends(get_db)):
    service = StockReservationService(db)
    success = await service.release_reservation(product_reference, source_reference)
    if not success:
        raise HTTPException(status_code=404, detail="Active reservation not found")
    return {"status": "released"}


@router.post("/inventory/reservations/consume")
async def consume_reservation(product_reference: str, source_reference: str, db: AsyncSession = Depends(get_db)):
    service = StockReservationService(db)
    success = await service.consume_reservation(product_reference, source_reference)
    if not success:
        raise HTTPException(status_code=404, detail="Active reservation not found")
    return {"status": "consumed"}


# 4. Suppliers
@router.get("/suppliers", response_model=List[SupplierResponse])
async def list_suppliers(status: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    service = SupplierService(db)
    return await service.list_suppliers(status)


@router.post("/suppliers", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
async def create_supplier(data: SupplierCreate, db: AsyncSession = Depends(get_db)):
    service = SupplierService(db)
    try:
        return await service.create_supplier(data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/suppliers/{supplier_id}", response_model=SupplierResponse)
async def get_supplier(supplier_id: int, db: AsyncSession = Depends(get_db)):
    service = SupplierService(db)
    supplier = await service.get_supplier(supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier


@router.patch("/suppliers/{supplier_id}", response_model=SupplierResponse)
async def update_supplier(supplier_id: int, data: SupplierUpdate, db: AsyncSession = Depends(get_db)):
    service = SupplierService(db)
    updated = await service.update_supplier(supplier_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return updated


@router.post("/suppliers/{supplier_id}/toggle-hold", response_model=SupplierResponse)
async def toggle_supplier_hold(supplier_id: int, db: AsyncSession = Depends(get_db)):
    service = SupplierService(db)
    try:
        return await service.toggle_hold(supplier_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# 5. Purchase Requisitions
@router.get("/requisitions", response_model=List[PurchaseRequisitionResponse])
async def list_requisitions(status: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    service = PurchaseRequisitionService(db)
    return await service.list_requisitions(status)


@router.post("/requisitions", response_model=PurchaseRequisitionResponse, status_code=status.HTTP_201_CREATED)
async def create_requisition(data: PurchaseRequisitionCreate, db: AsyncSession = Depends(get_db)):
    service = PurchaseRequisitionService(db)
    return await service.create_requisition(data)


@router.get("/requisitions/{requisition_id}", response_model=PurchaseRequisitionResponse)
async def get_requisition(requisition_id: int, db: AsyncSession = Depends(get_db)):
    service = PurchaseRequisitionService(db)
    pr = await service.get_requisition(requisition_id)
    if not pr:
        raise HTTPException(status_code=404, detail="Requisition not found")
    return pr


@router.post("/requisitions/{requisition_id}/submit", response_model=PurchaseRequisitionResponse)
async def submit_requisition(requisition_id: int, db: AsyncSession = Depends(get_db)):
    service = PurchaseRequisitionService(db)
    try:
        return await service.submit(requisition_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/requisitions/{requisition_id}/approve", response_model=PurchaseRequisitionResponse)
async def approve_requisition(requisition_id: int, db: AsyncSession = Depends(get_db)):
    service = PurchaseRequisitionService(db)
    try:
        return await service.approve(requisition_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/requisitions/{requisition_id}/reject", response_model=PurchaseRequisitionResponse)
async def reject_requisition(
    requisition_id: int, action: RequisitionActionRequest, db: AsyncSession = Depends(get_db)
):
    service = PurchaseRequisitionService(db)
    try:
        return await service.reject(requisition_id, action.reason or "Rejected by manager")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# 6. Purchase Orders
@router.get("/purchase-orders", response_model=List[PurchaseOrderResponse])
async def list_purchase_orders(
    supplier_id: Optional[int] = None,
    status: Optional[str] = None,
    warehouse_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
):
    service = PurchaseOrderService(db)
    return await service.list_orders(supplier_id, status, warehouse_id)


@router.post("/purchase-orders", response_model=PurchaseOrderResponse, status_code=status.HTTP_201_CREATED)
async def create_purchase_order(data: PurchaseOrderCreate, db: AsyncSession = Depends(get_db)):
    service = PurchaseOrderService(db)
    try:
        return await service.create_order(data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/purchase-orders/{po_id}", response_model=PurchaseOrderResponse)
async def get_purchase_order(po_id: int, db: AsyncSession = Depends(get_db)):
    service = PurchaseOrderService(db)
    po = await service.get_order(po_id)
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    return po


@router.post("/purchase-orders/{po_id}/submit", response_model=PurchaseOrderResponse)
async def submit_purchase_order(po_id: int, db: AsyncSession = Depends(get_db)):
    service = PurchaseOrderService(db)
    try:
        return await service.submit(po_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/purchase-orders/{po_id}/approve", response_model=PurchaseOrderResponse)
async def approve_purchase_order(po_id: int, db: AsyncSession = Depends(get_db)):
    service = PurchaseOrderService(db)
    try:
        return await service.approve(po_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/purchase-orders/{po_id}/send", response_model=PurchaseOrderResponse)
async def send_purchase_order(po_id: int, db: AsyncSession = Depends(get_db)):
    service = PurchaseOrderService(db)
    try:
        return await service.send_to_supplier(po_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/purchase-orders/{po_id}/cancel", response_model=PurchaseOrderResponse)
async def cancel_purchase_order(po_id: int, action: POActionRequest, db: AsyncSession = Depends(get_db)):
    service = PurchaseOrderService(db)
    try:
        return await service.cancel(po_id, action.reason or "")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# 7. Goods Receipts
@router.get("/goods-receipts", response_model=List[GoodsReceiptResponse])
async def list_goods_receipts(
    po_id: Optional[int] = None, warehouse_id: Optional[int] = None, db: AsyncSession = Depends(get_db)
):
    service = GoodsReceiptService(db)
    return await service.list_receipts(po_id, warehouse_id)


@router.post("/goods-receipts", response_model=GoodsReceiptResponse, status_code=status.HTTP_201_CREATED)
@router.post("/purchase-orders/{po_id}/receipts", response_model=GoodsReceiptResponse, status_code=status.HTTP_201_CREATED)
async def post_goods_receipt(
    data: GoodsReceiptCreate, po_id: Optional[int] = None, db: AsyncSession = Depends(get_db)
):
    service = GoodsReceiptService(db)
    if po_id:
        data.purchase_order_id = po_id
    try:
        return await service.post_receipt(data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/goods-receipts/{receipt_id}", response_model=GoodsReceiptResponse)
async def get_goods_receipt(receipt_id: int, db: AsyncSession = Depends(get_db)):
    service = GoodsReceiptService(db)
    rcpt = await service.get_receipt(receipt_id)
    if not rcpt:
        raise HTTPException(status_code=404, detail="Goods receipt not found")
    return rcpt


@router.post("/goods-receipts/{receipt_id}/reverse", response_model=GoodsReceiptResponse)
async def reverse_goods_receipt(receipt_id: int, req: ReceiptReversalRequest, db: AsyncSession = Depends(get_db)):
    service = GoodsReceiptService(db)
    try:
        return await service.reverse_receipt(receipt_id, req.reason)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# 8. Stock Movements Audit Ledger
@router.get("/stock-movements", response_model=List[GoodsMovementResponse])
async def list_stock_movements(
    limit: int = 50,
    product_reference: Optional[str] = None,
    warehouse_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
):
    repo = GoodsMovementRepository(db)
    return await repo.get_recent_movements(limit, product_reference, warehouse_id)


# 9. Stock Transfers
@router.get("/stock-transfers", response_model=List[StockTransferResponse])
async def list_stock_transfers(status: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    service = StockTransferService(db)
    return await service.list_transfers(status)


@router.post("/stock-transfers", response_model=StockTransferResponse, status_code=status.HTTP_201_CREATED)
async def create_stock_transfer(data: StockTransferCreate, db: AsyncSession = Depends(get_db)):
    service = StockTransferService(db)
    try:
        return await service.create_transfer(data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/stock-transfers/{transfer_id}", response_model=StockTransferResponse)
async def get_stock_transfer(transfer_id: int, db: AsyncSession = Depends(get_db)):
    service = StockTransferService(db)
    transfer = await service.get_transfer(transfer_id)
    if not transfer:
        raise HTTPException(status_code=404, detail="Stock transfer not found")
    return transfer


@router.post("/stock-transfers/{transfer_id}/ship", response_model=StockTransferResponse)
async def ship_stock_transfer(transfer_id: int, db: AsyncSession = Depends(get_db)):
    service = StockTransferService(db)
    try:
        return await service.ship_transfer(transfer_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/stock-transfers/{transfer_id}/receive", response_model=StockTransferResponse)
async def receive_stock_transfer(
    transfer_id: int, action: Optional[StockTransferActionRequest] = None, db: AsyncSession = Depends(get_db)
):
    service = StockTransferService(db)
    try:
        received_map = action.received_quantities if action else None
        return await service.receive_transfer(transfer_id, received_map)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# 10. Supplier Invoices & 3-Way Matching
@router.get("/supplier-invoices", response_model=List[SupplierInvoiceResponse])
async def list_supplier_invoices(
    status: Optional[str] = None, supplier_id: Optional[int] = None, db: AsyncSession = Depends(get_db)
):
    service = SupplierInvoiceService(db)
    return await service.list_invoices(status, supplier_id)


@router.post("/supplier-invoices", response_model=SupplierInvoiceResponse, status_code=status.HTTP_201_CREATED)
async def create_supplier_invoice(data: SupplierInvoiceCreate, db: AsyncSession = Depends(get_db)):
    service = SupplierInvoiceService(db)
    try:
        return await service.create_invoice(data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/supplier-invoices/{invoice_id}", response_model=SupplierInvoiceResponse)
async def get_supplier_invoice(invoice_id: int, db: AsyncSession = Depends(get_db)):
    service = SupplierInvoiceService(db)
    inv = await service.get_invoice(invoice_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Supplier invoice not found")
    return inv


@router.post("/supplier-invoices/{invoice_id}/resolve", response_model=SupplierInvoiceResponse)
async def resolve_invoice_mismatch(
    invoice_id: int, req: MismatchResolutionRequest, db: AsyncSession = Depends(get_db)
):
    service = SupplierInvoiceService(db)
    try:
        return await service.resolve_mismatch(invoice_id, req.resolution_action, req.note)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/supplier-invoices/{invoice_id}/approve", response_model=SupplierInvoiceResponse)
async def approve_supplier_invoice(invoice_id: int, db: AsyncSession = Depends(get_db)):
    service = SupplierInvoiceService(db)
    try:
        return await service.approve_invoice(invoice_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# 11. Cost Transactions & Overview Metrics
@router.get("/cost-transactions", response_model=List[CostTransactionResponse])
async def list_cost_transactions(limit: int = 100, db: AsyncSession = Depends(get_db)):
    repo = CostTransactionRepository(db)
    return await repo.get_recent_transactions(limit)


@router.get("/overview/metrics", response_model=ErpOverviewMetricsResponse)
async def get_overview_metrics(db: AsyncSession = Depends(get_db)):
    service = ErpOverviewMetricsService(db)
    return await service.get_overview_metrics()
