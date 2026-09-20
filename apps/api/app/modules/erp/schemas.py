from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


# ====================================================================
# BACKWARD-COMPATIBLE SCHEMAS (Preserved for existing OMS/BI contracts)
# ====================================================================

class ProductBase(BaseModel):
    sku: str
    name: str
    description: Optional[str] = None
    price: float
    cost: float = 0.0


class ProductCreate(ProductBase):
    initial_quantity: int = 0
    warehouse: str = "MAIN"


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    cost: Optional[float] = None


class ProductResponse(ProductBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InventoryItemResponse(BaseModel):
    id: int
    product_id: int
    warehouse: str
    quantity: int
    reorder_level: int
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class StockAdjustment(BaseModel):
    product_id: int
    quantity_delta: int  # can be positive (restock) or negative (deduct)
    warehouse: str = "MAIN"
    reason: Optional[str] = "Manual adjustment"


# ====================================================================
# CANONICAL ERP SCHEMAS (SAP Fiori / S/4HANA Specification)
# ====================================================================

class StorageLocationBase(BaseModel):
    code: str
    name: str
    type: str = "MAIN"  # MAIN, RETURNS, QUALITY_INSPECTION, BLOCKED_STOCK
    status: str = "ACTIVE"


class StorageLocationCreate(StorageLocationBase):
    pass


class StorageLocationResponse(StorageLocationBase):
    id: int
    warehouse_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class WarehouseBase(BaseModel):
    code: str
    name: str
    status: str = "ACTIVE"
    address: Optional[str] = None
    timezone: str = "Asia/Ho_Chi_Minh"
    provider_reference: Optional[str] = None


class WarehouseCreate(WarehouseBase):
    pass


class WarehouseResponse(WarehouseBase):
    id: int
    organization_id: str
    sync_status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    storage_locations: List[StorageLocationResponse] = []

    model_config = ConfigDict(from_attributes=True)


class InventoryPositionResponse(BaseModel):
    id: int
    organization_id: str
    product_reference: str
    product_name: Optional[str] = None
    warehouse_id: int
    storage_location_id: Optional[int] = None
    on_hand_quantity: float
    reserved_quantity: float
    blocked_quantity: float
    incoming_quantity: float
    available_quantity: float
    unit: str
    reorder_threshold: float
    unit_cost: float
    stock_status: str
    version: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class StockAdjustmentRequest(BaseModel):
    product_reference: str
    warehouse_id: int
    storage_location_id: Optional[int] = None
    adjustment_type: str = "INCREASE"  # INCREASE, DECREASE
    quantity: float
    reason_code: str  # CYCLE_COUNT, DAMAGED_GOODS, RECEIPT_POSTING, SCRAP, OTHER
    note: Optional[str] = None


class InventoryReservationRequest(BaseModel):
    product_reference: str
    warehouse_id: int
    storage_location_id: Optional[int] = None
    source_type: str = "OMS_ORDER"
    source_reference: str
    quantity: float
    unit: str = "pcs"


class StockReservationResponse(BaseModel):
    id: int
    product_reference: str
    warehouse_id: int
    storage_location_id: Optional[int] = None
    source_type: str
    source_reference: str
    quantity: float
    unit: str
    status: str
    expires_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GoodsMovementResponse(BaseModel):
    id: int
    organization_id: str
    movement_number: str
    movement_type: str
    product_reference: str
    quantity: float
    unit: str
    from_warehouse_id: Optional[int] = None
    from_location_id: Optional[int] = None
    to_warehouse_id: Optional[int] = None
    to_location_id: Optional[int] = None
    reference_type: Optional[str] = None
    reference_id: Optional[str] = None
    reason_code: Optional[str] = None
    note: Optional[str] = None
    actor_id: str
    posted_at: datetime
    provider_reference: Optional[str] = None
    sync_status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SupplierBase(BaseModel):
    supplier_code: str
    name: str
    status: str = "ACTIVE"  # ACTIVE, ON_HOLD, INACTIVE
    tax_identifier: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    payment_terms: str = "NET_30"
    currency: str = "VND"
    provider_reference: Optional[str] = None


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    tax_identifier: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    payment_terms: Optional[str] = None
    currency: Optional[str] = None


class SupplierResponse(SupplierBase):
    id: int
    organization_id: str
    sync_status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class PurchaseRequisitionLineCreate(BaseModel):
    product_reference: str
    description_snapshot: Optional[str] = None
    quantity: float
    unit: str = "pcs"
    estimated_unit_cost: float = 0.0
    currency: str = "VND"
    preferred_supplier_id: Optional[int] = None
    warehouse_id: Optional[int] = None
    storage_location_id: Optional[int] = None


class PurchaseRequisitionLineResponse(BaseModel):
    id: int
    requisition_id: int
    product_reference: str
    description_snapshot: Optional[str] = None
    quantity: float
    ordered_quantity: float
    unit: str
    estimated_unit_cost: float
    currency: str
    preferred_supplier_id: Optional[int] = None
    warehouse_id: Optional[int] = None
    storage_location_id: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PurchaseRequisitionCreate(BaseModel):
    requester_id: str = "procurement_user"
    needed_by: Optional[datetime] = None
    reason: Optional[str] = None
    lines: List[PurchaseRequisitionLineCreate] = []


class PurchaseRequisitionResponse(BaseModel):
    id: int
    organization_id: str
    requisition_number: str
    requester_id: str
    status: str
    needed_by: Optional[datetime] = None
    reason: Optional[str] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    lines: List[PurchaseRequisitionLineResponse] = []

    model_config = ConfigDict(from_attributes=True)


class RequisitionActionRequest(BaseModel):
    reason: Optional[str] = None


class PurchaseOrderLineCreate(BaseModel):
    product_reference: str
    description_snapshot: Optional[str] = None
    ordered_quantity: float
    unit: str = "pcs"
    unit_cost: float
    expected_delivery_date: Optional[datetime] = None


class PurchaseOrderLineResponse(BaseModel):
    id: int
    purchase_order_id: int
    product_reference: str
    description_snapshot: Optional[str] = None
    ordered_quantity: float
    received_quantity: float
    unit: str
    unit_cost: float
    line_total: float
    expected_delivery_date: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PurchaseOrderCreate(BaseModel):
    supplier_id: int
    buyer_id: str = "procurement_buyer"
    warehouse_id: int
    currency: str = "VND"
    tax_total: float = 0.0
    shipping_total: float = 0.0
    expected_delivery_date: Optional[datetime] = None
    notes: Optional[str] = None
    lines: List[PurchaseOrderLineCreate] = []


class PurchaseOrderResponse(BaseModel):
    id: int
    organization_id: str
    po_number: str
    supplier_id: int
    buyer_id: str
    status: str
    currency: str
    subtotal: float
    tax_total: float
    shipping_total: float
    grand_total: float
    order_date: datetime
    expected_delivery_date: Optional[datetime] = None
    warehouse_id: int
    provider_reference: Optional[str] = None
    sync_status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    lines: List[PurchaseOrderLineResponse] = []
    supplier: Optional[SupplierResponse] = None

    model_config = ConfigDict(from_attributes=True)


class POActionRequest(BaseModel):
    reason: Optional[str] = None


class GoodsReceiptLineCreate(BaseModel):
    purchase_order_line_id: Optional[int] = None
    product_reference: str
    expected_quantity: float = 0.0
    received_quantity: float
    accepted_quantity: float
    blocked_quantity: float = 0.0
    damaged_quantity: float = 0.0
    unit: str = "pcs"
    storage_location_id: Optional[int] = None
    note: Optional[str] = None


class GoodsReceiptLineResponse(BaseModel):
    id: int
    goods_receipt_id: int
    purchase_order_line_id: Optional[int] = None
    product_reference: str
    expected_quantity: float
    received_quantity: float
    accepted_quantity: float
    blocked_quantity: float
    damaged_quantity: float
    unit: str
    storage_location_id: Optional[int] = None
    note: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class GoodsReceiptCreate(BaseModel):
    purchase_order_id: Optional[int] = None
    warehouse_id: int
    received_by: str = "warehouse_clerk"
    supplier_delivery_reference: Optional[str] = None
    note: Optional[str] = None
    lines: List[GoodsReceiptLineCreate] = []


class GoodsReceiptResponse(BaseModel):
    id: int
    organization_id: str
    receipt_number: str
    purchase_order_id: Optional[int] = None
    warehouse_id: int
    status: str
    received_at: datetime
    received_by: str
    supplier_delivery_reference: Optional[str] = None
    note: Optional[str] = None
    provider_reference: Optional[str] = None
    sync_status: str
    created_at: datetime
    lines: List[GoodsReceiptLineResponse] = []

    model_config = ConfigDict(from_attributes=True)


class ReceiptReversalRequest(BaseModel):
    reason: str


class StockTransferLineCreate(BaseModel):
    product_reference: str
    requested_quantity: float
    unit: str = "pcs"


class StockTransferLineResponse(BaseModel):
    id: int
    stock_transfer_id: int
    product_reference: str
    requested_quantity: float
    shipped_quantity: float
    received_quantity: float
    unit: str

    model_config = ConfigDict(from_attributes=True)


class StockTransferCreate(BaseModel):
    from_warehouse_id: int
    to_warehouse_id: int
    created_by: str = "inventory_manager"
    notes: Optional[str] = None
    lines: List[StockTransferLineCreate] = []


class StockTransferResponse(BaseModel):
    id: int
    organization_id: str
    transfer_number: str
    from_warehouse_id: int
    to_warehouse_id: int
    status: str
    requested_at: datetime
    shipped_at: Optional[datetime] = None
    received_at: Optional[datetime] = None
    created_by: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    lines: List[StockTransferLineResponse] = []

    model_config = ConfigDict(from_attributes=True)


class StockTransferActionRequest(BaseModel):
    received_quantities: Optional[dict] = None  # map line_id -> quantity
    notes: Optional[str] = None


class SupplierInvoiceCreate(BaseModel):
    supplier_id: int
    purchase_order_id: Optional[int] = None
    subtotal: float
    tax_total: float = 0.0
    due_date: Optional[datetime] = None
    currency: str = "VND"


class SupplierInvoiceResponse(BaseModel):
    id: int
    organization_id: str
    invoice_number: str
    supplier_id: int
    purchase_order_id: Optional[int] = None
    status: str
    invoice_date: datetime
    due_date: Optional[datetime] = None
    currency: str
    subtotal: float
    tax_total: float
    grand_total: float
    matched_amount: float
    variance_amount: float
    match_status: str
    resolution_note: Optional[str] = None
    provider_reference: Optional[str] = None
    sync_status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    supplier: Optional[SupplierResponse] = None

    model_config = ConfigDict(from_attributes=True)


class MismatchResolutionRequest(BaseModel):
    resolution_action: str  # ACCEPT_VARIANCE, CORRECT_INVOICE, RETURN_TO_SUPPLIER
    note: str


class CostTransactionResponse(BaseModel):
    id: int
    organization_id: str
    type: str
    reference_type: str
    reference_id: str
    amount: float
    currency: str
    category: str
    posted_at: datetime
    note: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ErpOverviewMetricsResponse(BaseModel):
    total_stock_value: float
    low_stock_count: int
    blocked_stock_count: int
    incoming_quantity: float
    open_pos_count: int
    open_pos_value: float
    pos_awaiting_approval: int
    pos_overdue: int
    invoices_awaiting_review: int
    invoices_mismatch: int
    transfers_in_transit: int
