from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, ConfigDict, Field


# ----------------------------------------------------------------------
# Order Line & Compatibility Item Schemas
# ----------------------------------------------------------------------

class OrderItemBase(BaseModel):
    product_id: Optional[int] = None
    quantity: int = 1
    unit_price: float = 0.0
    product_name: Optional[str] = None
    sku: Optional[str] = None


class OrderItemCreate(OrderItemBase):
    pass


class OrderItemResponse(OrderItemBase):
    id: int
    line_total: Optional[float] = None
    fulfilled_quantity: Optional[int] = 0
    returned_quantity: Optional[int] = 0
    refunded_quantity: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)


class OrderLineCreate(BaseModel):
    product_id: Optional[int] = None
    variant_id: Optional[int] = None
    sku: Optional[str] = "GENERAL-SKU"
    name: str = "Product Item"
    variant_name: Optional[str] = None
    quantity: int = 1
    unit_price: float = 0.0
    discount_total: float = 0.0
    tax_total: float = 0.0


class OrderLineResponse(BaseModel):
    id: int
    order_id: int
    product_id: Optional[int] = None
    variant_id: Optional[int] = None
    external_product_id: Optional[str] = None
    external_variant_id: Optional[str] = None
    sku: str
    name: str
    variant_name: Optional[str] = None
    quantity: int
    unit_price: float
    discount_total: float
    tax_total: float
    line_total: float
    fulfilled_quantity: int
    returned_quantity: int
    refunded_quantity: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------------------------------------
# Financial & Transaction Schemas
# ----------------------------------------------------------------------

class OrderTransactionResponse(BaseModel):
    id: int
    order_id: int
    type: str  # AUTHORIZATION, CAPTURE, SALE, REFUND, VOID, MANUAL_PAYMENT
    status: str  # PENDING, SUCCESS, FAILED, CANCELLED
    amount: float
    currency: str
    payment_method: str
    provider_transaction_id: Optional[str] = None
    processed_at: datetime
    reference: Optional[str] = None
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class RecordPaymentRequest(BaseModel):
    amount: float = Field(gt=0, description="Payment amount must be greater than 0")
    payment_method: str = "BANK_TRANSFER"
    reference: Optional[str] = None
    note: Optional[str] = None


# ----------------------------------------------------------------------
# Fulfillment Schemas
# ----------------------------------------------------------------------

class FulfillmentLineItemRequest(BaseModel):
    order_line_id: int
    quantity: int = Field(gt=0)


class FulfillItemsRequest(BaseModel):
    location_reference: str = "MAIN"
    carrier: Optional[str] = "FedEx Priority Ground"
    tracking_number: Optional[str] = None
    tracking_url: Optional[str] = None
    items: List[FulfillmentLineItemRequest]


class FulfillmentResponse(BaseModel):
    id: int
    order_id: int
    fulfillment_group_id: Optional[int] = None
    status: str
    location_reference: str
    tracking_company: Optional[str] = None
    tracking_number: Optional[str] = None
    tracking_url: Optional[str] = None
    shipped_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    sync_status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------------------------------------
# Return & Refund Schemas
# ----------------------------------------------------------------------

class ReturnLineItemRequest(BaseModel):
    order_line_id: int
    quantity: int = Field(gt=0)
    reason: str = "NOT_AS_EXPECTED"


class CreateReturnRequest(BaseModel):
    reason_summary: Optional[str] = "Customer requested return"
    items: List[ReturnLineItemRequest]


class ReviewReturnRequest(BaseModel):
    action: str = Field(..., pattern="^(APPROVE|DECLINE)$")
    reason: Optional[str] = None
    receiving_location: Optional[str] = "MAIN"


class ProcessReturnLineRequest(BaseModel):
    return_line_id: int
    condition: str = "GOOD"  # GOOD, DAMAGED, OTHER
    restock_disposition: str = "RESTOCK"  # RESTOCK, DO_NOT_RESTOCK, DAMAGED, INSPECTION_REQUIRED


class ProcessReturnRequest(BaseModel):
    items: List[ProcessReturnLineRequest]


class ReturnLineResponse(BaseModel):
    id: int
    return_id: int
    order_line_id: int
    quantity: int
    reason: str
    condition: str
    restock_disposition: str

    model_config = ConfigDict(from_attributes=True)


class ReturnResponse(BaseModel):
    id: int
    order_id: int
    return_number: str
    status: str
    reason_summary: Optional[str] = None
    requested_at: datetime
    approved_at: Optional[datetime] = None
    received_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    sync_status: str
    lines: List[ReturnLineResponse] = []

    model_config = ConfigDict(from_attributes=True)


class CreateRefundRequest(BaseModel):
    amount: float = Field(gt=0)
    reason: Optional[str] = "Customer return reimbursement"
    return_id: Optional[int] = None
    refund_method: str = "ORIGINAL_PAYMENT"


class RefundResponse(BaseModel):
    id: int
    order_id: int
    return_id: Optional[int] = None
    refund_number: str
    amount: float
    currency: str
    status: str
    reason: Optional[str] = None
    refund_method: str
    processed_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------------------------------------
# Timeline Event Schemas
# ----------------------------------------------------------------------

class OrderEventResponse(BaseModel):
    id: int
    order_id: int
    event_type: str
    actor_id: str
    summary: str
    metadata_json: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------------------------------------
# Product & Catalog Schemas
# ----------------------------------------------------------------------

class ProductVariantCreate(BaseModel):
    name: str
    sku: str
    barcode: Optional[str] = None
    price: float = 0.0
    compare_at_price: Optional[float] = None


class ProductVariantResponse(BaseModel):
    id: int
    product_id: int
    name: str
    sku: str
    barcode: Optional[str] = None
    price: float
    compare_at_price: Optional[float] = None
    sync_status: str

    model_config = ConfigDict(from_attributes=True)


class ProductCreate(BaseModel):
    name: str
    sku: Optional[str] = None
    price: float = 0.0
    description: Optional[str] = None
    status: str = "ACTIVE"
    variants: List[ProductVariantCreate] = []


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    price: Optional[float] = None


class ProductResponse(BaseModel):
    id: int
    name: str
    status: str
    description: Optional[str] = None
    sku: Optional[str] = None
    price: float
    sync_status: str
    created_at: datetime
    variants: List[ProductVariantResponse] = []

    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------------------------------------
# Order Request & Response Schemas
# ----------------------------------------------------------------------

class OrderCreate(BaseModel):
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    shipping_address: Optional[str] = "100 Silicon Ave, Suite 400, San Jose, CA 95134"
    currency: str = "VND"
    source_type: str = "INTERNAL"
    source_provider_id: Optional[str] = None
    external_order_id: Optional[str] = None
    discount_total: Optional[float] = 0.0
    shipping_total: Optional[float] = 0.0
    tax_total: Optional[float] = 0.0
    notes: Optional[str] = None
    tags: Optional[str] = None
    items: List[OrderItemCreate] = []
    lines: Optional[List[OrderLineCreate]] = None


class OrderStatusUpdate(BaseModel):
    status: str  # PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED


class CancelOrderRequest(BaseModel):
    reason: str = "Customer requested order cancellation"
    restock: bool = True
    refund_payment: bool = False


class OrderResponse(BaseModel):
    id: int
    order_number: str
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_snapshot: Optional[Dict[str, Any]] = None

    currency: str
    subtotal: float
    discount_total: float
    shipping_total: float
    tax_total: float
    grand_total: float
    total_amount: float  # Backwards compatibility

    order_state: str
    payment_state: str
    fulfillment_state: str
    return_state: str
    sync_status: str
    status: str  # Backwards compatibility

    shipping_address: Optional[str] = None
    source_type: str
    source_provider_id: Optional[str] = None
    external_order_id: Optional[str] = None

    placed_at: datetime
    cancelled_at: Optional[datetime] = None
    archived_at: Optional[datetime] = None
    last_synced_at: Optional[datetime] = None

    notes: Optional[str] = None
    tags: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    items: List[OrderItemResponse] = []
    lines: List[OrderLineResponse] = []
    transactions: List[OrderTransactionResponse] = []
    fulfillments: List[FulfillmentResponse] = []
    returns: List[ReturnResponse] = []
    refunds: List[RefundResponse] = []
    events: List[OrderEventResponse] = []

    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------------------------------------
# Overview Metrics
# ----------------------------------------------------------------------

class OmsOverviewMetrics(BaseModel):
    orders_today: int
    revenue_today: float
    unfulfilled_count: int
    unpaid_count: int
    returns_needing_work: int
    sync_failures_count: int
    needs_attention: List[Dict[str, Any]] = []
    fulfillment_workload: Dict[str, int] = {}
    provider_health: List[Dict[str, Any]] = []
