from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base


# ====================================================================
# BACKWARD-COMPATIBLE MODELS (Preserved for existing OMS/BI contracts)
# ====================================================================

class Product(Base):
    __tablename__ = "erp_products"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    sku = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(String(500), nullable=True)
    price = Column(Float, nullable=False)
    cost = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    inventory_items = relationship("InventoryItem", back_populates="product", cascade="all, delete-orphan")


class InventoryItem(Base):
    __tablename__ = "erp_inventory_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("erp_products.id"), nullable=False, index=True)
    warehouse = Column(String(100), default="MAIN", nullable=False)
    quantity = Column(Integer, default=0, nullable=False)
    reorder_level = Column(Integer, default=10, nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    product = relationship("Product", back_populates="inventory_items")


# ====================================================================
# CANONICAL ERP DOMAIN MODELS (SAP Fiori / S/4HANA Specification)
# ====================================================================

class Warehouse(Base):
    __tablename__ = "erp_warehouses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    organization_id = Column(String(100), default="default-org", nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    status = Column(String(50), default="ACTIVE", nullable=False)  # ACTIVE, INACTIVE
    address = Column(String(500), nullable=True)
    timezone = Column(String(100), default="Asia/Ho_Chi_Minh", nullable=False)
    provider_reference = Column(String(100), nullable=True)
    sync_status = Column(String(50), default="SYNCED", nullable=False)  # SYNCED, PENDING, FAILED
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    storage_locations = relationship("StorageLocation", back_populates="warehouse", cascade="all, delete-orphan")
    inventory_positions = relationship("InventoryPosition", back_populates="warehouse")


class StorageLocation(Base):
    __tablename__ = "erp_storage_locations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    warehouse_id = Column(Integer, ForeignKey("erp_warehouses.id", ondelete="CASCADE"), nullable=False, index=True)
    code = Column(String(50), nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(String(50), default="MAIN", nullable=False)  # MAIN, RETURNS, QUALITY_INSPECTION, BLOCKED_STOCK
    status = Column(String(50), default="ACTIVE", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    warehouse = relationship("Warehouse", back_populates="storage_locations")
    inventory_positions = relationship("InventoryPosition", back_populates="storage_location")


class InventoryPosition(Base):
    __tablename__ = "erp_inventory_positions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    organization_id = Column(String(100), default="default-org", nullable=False)
    product_reference = Column(String(100), index=True, nullable=False)  # SKU or product reference
    product_name = Column(String(255), nullable=True)
    warehouse_id = Column(Integer, ForeignKey("erp_warehouses.id", ondelete="CASCADE"), nullable=False, index=True)
    storage_location_id = Column(Integer, ForeignKey("erp_storage_locations.id", ondelete="SET NULL"), nullable=True, index=True)
    on_hand_quantity = Column(Float, default=0.0, nullable=False)
    reserved_quantity = Column(Float, default=0.0, nullable=False)
    blocked_quantity = Column(Float, default=0.0, nullable=False)
    incoming_quantity = Column(Float, default=0.0, nullable=False)
    unit = Column(String(50), default="pcs", nullable=False)
    reorder_threshold = Column(Float, default=10.0, nullable=False)
    unit_cost = Column(Float, default=0.0, nullable=False)
    version = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    warehouse = relationship("Warehouse", back_populates="inventory_positions")
    storage_location = relationship("StorageLocation", back_populates="inventory_positions")

    @property
    def available_quantity(self) -> float:
        return max(0.0, self.on_hand_quantity - self.reserved_quantity - self.blocked_quantity)

    @property
    def stock_status(self) -> str:
        avail = self.available_quantity
        if avail <= 0.0:
            return "OUT_OF_STOCK"
        elif avail <= self.reorder_threshold:
            return "LOW"
        elif self.blocked_quantity > 0:
            return "BLOCKED"
        elif avail > self.reorder_threshold * 5:
            return "OVERSTOCK"
        return "HEALTHY"


class StockReservation(Base):
    __tablename__ = "erp_stock_reservations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    organization_id = Column(String(100), default="default-org", nullable=False)
    product_reference = Column(String(100), index=True, nullable=False)
    warehouse_id = Column(Integer, ForeignKey("erp_warehouses.id"), nullable=False, index=True)
    storage_location_id = Column(Integer, ForeignKey("erp_storage_locations.id"), nullable=True)
    source_type = Column(String(50), default="OMS_ORDER", nullable=False)  # OMS_ORDER, MANUAL, PRODUCTION, TRANSFER
    source_reference = Column(String(100), index=True, nullable=False)  # e.g. order number
    quantity = Column(Float, nullable=False)
    unit = Column(String(50), default="pcs", nullable=False)
    status = Column(String(50), default="ACTIVE", nullable=False)  # ACTIVE, RELEASED, CONSUMED, CANCELLED, EXPIRED
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class GoodsMovement(Base):
    __tablename__ = "erp_goods_movements"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    organization_id = Column(String(100), default="default-org", nullable=False)
    movement_number = Column(String(50), unique=True, index=True, nullable=False)
    movement_type = Column(String(50), nullable=False)  # GOODS_RECEIPT, GOODS_ISSUE, TRANSFER_OUT, TRANSFER_IN, ADJUSTMENT_IN, ADJUSTMENT_OUT, RETURN_TO_SUPPLIER, RESERVATION_CONSUMPTION
    product_reference = Column(String(100), index=True, nullable=False)
    quantity = Column(Float, nullable=False)
    unit = Column(String(50), default="pcs", nullable=False)
    from_warehouse_id = Column(Integer, ForeignKey("erp_warehouses.id"), nullable=True)
    from_location_id = Column(Integer, ForeignKey("erp_storage_locations.id"), nullable=True)
    to_warehouse_id = Column(Integer, ForeignKey("erp_warehouses.id"), nullable=True)
    to_location_id = Column(Integer, ForeignKey("erp_storage_locations.id"), nullable=True)
    reference_type = Column(String(50), nullable=True)  # PURCHASE_ORDER, GOODS_RECEIPT, STOCK_TRANSFER, MANUAL_ADJUSTMENT, OMS_ORDER
    reference_id = Column(String(100), nullable=True)
    reason_code = Column(String(100), nullable=True)  # CYCLE_COUNT, DAMAGED_GOODS, RECEIPT_POSTING, TRANSFER_POSTING, RESTOCK
    note = Column(String(500), nullable=True)
    actor_id = Column(String(100), default="ops_operator", nullable=False)
    posted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    provider_reference = Column(String(100), nullable=True)
    sync_status = Column(String(50), default="SYNCED", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class Supplier(Base):
    __tablename__ = "erp_suppliers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    organization_id = Column(String(100), default="default-org", nullable=False)
    supplier_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    status = Column(String(50), default="ACTIVE", nullable=False)  # ACTIVE, ON_HOLD, INACTIVE
    tax_identifier = Column(String(100), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(100), nullable=True)
    address = Column(String(500), nullable=True)
    payment_terms = Column(String(100), default="NET_30", nullable=False)
    currency = Column(String(10), default="VND", nullable=False)
    provider_reference = Column(String(100), nullable=True)
    sync_status = Column(String(50), default="SYNCED", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    purchase_orders = relationship("PurchaseOrder", back_populates="supplier")
    invoices = relationship("SupplierInvoice", back_populates="supplier")


class PurchaseRequisition(Base):
    __tablename__ = "erp_purchase_requisitions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    organization_id = Column(String(100), default="default-org", nullable=False)
    requisition_number = Column(String(50), unique=True, index=True, nullable=False)
    requester_id = Column(String(100), default="procurement_user", nullable=False)
    status = Column(String(50), default="DRAFT", nullable=False)  # DRAFT, SUBMITTED, APPROVED, REJECTED, PARTIALLY_ORDERED, ORDERED, CANCELLED
    needed_by = Column(DateTime, nullable=True)
    reason = Column(String(500), nullable=True)
    rejection_reason = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    lines = relationship("PurchaseRequisitionLine", back_populates="requisition", cascade="all, delete-orphan")


class PurchaseRequisitionLine(Base):
    __tablename__ = "erp_purchase_requisition_lines"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    requisition_id = Column(Integer, ForeignKey("erp_purchase_requisitions.id", ondelete="CASCADE"), nullable=False, index=True)
    product_reference = Column(String(100), nullable=False)
    description_snapshot = Column(String(255), nullable=True)
    quantity = Column(Float, nullable=False)
    ordered_quantity = Column(Float, default=0.0, nullable=False)
    unit = Column(String(50), default="pcs", nullable=False)
    estimated_unit_cost = Column(Float, default=0.0, nullable=False)
    currency = Column(String(10), default="VND", nullable=False)
    preferred_supplier_id = Column(Integer, ForeignKey("erp_suppliers.id"), nullable=True)
    warehouse_id = Column(Integer, ForeignKey("erp_warehouses.id"), nullable=True)
    storage_location_id = Column(Integer, ForeignKey("erp_storage_locations.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    requisition = relationship("PurchaseRequisition", back_populates="lines")


class PurchaseOrder(Base):
    __tablename__ = "erp_purchase_orders"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    organization_id = Column(String(100), default="default-org", nullable=False)
    po_number = Column(String(50), unique=True, index=True, nullable=False)
    supplier_id = Column(Integer, ForeignKey("erp_suppliers.id"), nullable=False, index=True)
    buyer_id = Column(String(100), default="procurement_buyer", nullable=False)
    status = Column(String(50), default="DRAFT", nullable=False)  # DRAFT, PENDING_APPROVAL, APPROVED, SENT, PARTIALLY_RECEIVED, RECEIVED, CANCELLED, CLOSED
    currency = Column(String(10), default="VND", nullable=False)
    subtotal = Column(Float, default=0.0, nullable=False)
    tax_total = Column(Float, default=0.0, nullable=False)
    shipping_total = Column(Float, default=0.0, nullable=False)
    grand_total = Column(Float, default=0.0, nullable=False)
    order_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    expected_delivery_date = Column(DateTime, nullable=True)
    warehouse_id = Column(Integer, ForeignKey("erp_warehouses.id"), nullable=False, index=True)
    provider_reference = Column(String(100), nullable=True)
    sync_status = Column(String(50), default="SYNCED", nullable=False)
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    supplier = relationship("Supplier", back_populates="purchase_orders")
    warehouse = relationship("Warehouse")
    lines = relationship("PurchaseOrderLine", back_populates="purchase_order", cascade="all, delete-orphan")
    receipts = relationship("GoodsReceipt", back_populates="purchase_order")
    invoices = relationship("SupplierInvoice", back_populates="purchase_order")


class PurchaseOrderLine(Base):
    __tablename__ = "erp_purchase_order_lines"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    purchase_order_id = Column(Integer, ForeignKey("erp_purchase_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_reference = Column(String(100), nullable=False)
    description_snapshot = Column(String(255), nullable=True)
    ordered_quantity = Column(Float, nullable=False)
    received_quantity = Column(Float, default=0.0, nullable=False)
    unit = Column(String(50), default="pcs", nullable=False)
    unit_cost = Column(Float, nullable=False)
    line_total = Column(Float, nullable=False)
    expected_delivery_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    purchase_order = relationship("PurchaseOrder", back_populates="lines")


class GoodsReceipt(Base):
    __tablename__ = "erp_goods_receipts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    organization_id = Column(String(100), default="default-org", nullable=False)
    receipt_number = Column(String(50), unique=True, index=True, nullable=False)
    purchase_order_id = Column(Integer, ForeignKey("erp_purchase_orders.id"), nullable=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("erp_warehouses.id"), nullable=False, index=True)
    status = Column(String(50), default="POSTED", nullable=False)  # DRAFT, POSTED, REVERSED
    received_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    received_by = Column(String(100), default="warehouse_clerk", nullable=False)
    supplier_delivery_reference = Column(String(100), nullable=True)
    note = Column(String(500), nullable=True)
    provider_reference = Column(String(100), nullable=True)
    sync_status = Column(String(50), default="SYNCED", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    purchase_order = relationship("PurchaseOrder", back_populates="receipts")
    warehouse = relationship("Warehouse")
    lines = relationship("GoodsReceiptLine", back_populates="goods_receipt", cascade="all, delete-orphan")


class GoodsReceiptLine(Base):
    __tablename__ = "erp_goods_receipt_lines"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    goods_receipt_id = Column(Integer, ForeignKey("erp_goods_receipts.id", ondelete="CASCADE"), nullable=False, index=True)
    purchase_order_line_id = Column(Integer, ForeignKey("erp_purchase_order_lines.id"), nullable=True)
    product_reference = Column(String(100), nullable=False)
    expected_quantity = Column(Float, default=0.0, nullable=False)
    received_quantity = Column(Float, nullable=False)
    accepted_quantity = Column(Float, nullable=False)
    blocked_quantity = Column(Float, default=0.0, nullable=False)
    damaged_quantity = Column(Float, default=0.0, nullable=False)
    unit = Column(String(50), default="pcs", nullable=False)
    storage_location_id = Column(Integer, ForeignKey("erp_storage_locations.id"), nullable=True)
    note = Column(String(255), nullable=True)

    goods_receipt = relationship("GoodsReceipt", back_populates="lines")
    storage_location = relationship("StorageLocation")


class StockTransfer(Base):
    __tablename__ = "erp_stock_transfers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    organization_id = Column(String(100), default="default-org", nullable=False)
    transfer_number = Column(String(50), unique=True, index=True, nullable=False)
    from_warehouse_id = Column(Integer, ForeignKey("erp_warehouses.id"), nullable=False, index=True)
    to_warehouse_id = Column(Integer, ForeignKey("erp_warehouses.id"), nullable=False, index=True)
    status = Column(String(50), default="DRAFT", nullable=False)  # DRAFT, READY, IN_TRANSIT, PARTIALLY_RECEIVED, RECEIVED, CANCELLED
    requested_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    shipped_at = Column(DateTime, nullable=True)
    received_at = Column(DateTime, nullable=True)
    created_by = Column(String(100), default="inventory_manager", nullable=False)
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    from_warehouse = relationship("Warehouse", foreign_keys=[from_warehouse_id])
    to_warehouse = relationship("Warehouse", foreign_keys=[to_warehouse_id])
    lines = relationship("StockTransferLine", back_populates="stock_transfer", cascade="all, delete-orphan")


class StockTransferLine(Base):
    __tablename__ = "erp_stock_transfer_lines"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    stock_transfer_id = Column(Integer, ForeignKey("erp_stock_transfers.id", ondelete="CASCADE"), nullable=False, index=True)
    product_reference = Column(String(100), nullable=False)
    requested_quantity = Column(Float, nullable=False)
    shipped_quantity = Column(Float, default=0.0, nullable=False)
    received_quantity = Column(Float, default=0.0, nullable=False)
    unit = Column(String(50), default="pcs", nullable=False)

    stock_transfer = relationship("StockTransfer", back_populates="lines")


class SupplierInvoice(Base):
    __tablename__ = "erp_supplier_invoices"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    organization_id = Column(String(100), default="default-org", nullable=False)
    invoice_number = Column(String(50), unique=True, index=True, nullable=False)
    supplier_id = Column(Integer, ForeignKey("erp_suppliers.id"), nullable=False, index=True)
    purchase_order_id = Column(Integer, ForeignKey("erp_purchase_orders.id"), nullable=True, index=True)
    status = Column(String(50), default="PENDING_REVIEW", nullable=False)  # DRAFT, PENDING_REVIEW, MATCHED, MISMATCH, APPROVED, PAYMENT_READY, PAID, CANCELLED
    invoice_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    due_date = Column(DateTime, nullable=True)
    currency = Column(String(10), default="VND", nullable=False)
    subtotal = Column(Float, default=0.0, nullable=False)
    tax_total = Column(Float, default=0.0, nullable=False)
    grand_total = Column(Float, default=0.0, nullable=False)
    matched_amount = Column(Float, default=0.0, nullable=False)
    variance_amount = Column(Float, default=0.0, nullable=False)
    match_status = Column(String(50), default="PENDING", nullable=False)  # PENDING, MATCHED, QUANTITY_MISMATCH, PRICE_MISMATCH, MISSING_RECEIPT, MISSING_PO
    resolution_note = Column(String(500), nullable=True)
    provider_reference = Column(String(100), nullable=True)
    sync_status = Column(String(50), default="SYNCED", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    supplier = relationship("Supplier", back_populates="invoices")
    purchase_order = relationship("PurchaseOrder", back_populates="invoices")


class CostTransaction(Base):
    __tablename__ = "erp_cost_transactions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    organization_id = Column(String(100), default="default-org", nullable=False)
    type = Column(String(50), nullable=False)  # PURCHASE_COST, SHIPPING_COST, HANDLING_COST, ADJUSTMENT_COST
    reference_type = Column(String(50), nullable=False)  # PURCHASE_ORDER, GOODS_RECEIPT, SUPPLIER_INVOICE, STOCK_ADJUSTMENT
    reference_id = Column(String(100), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="VND", nullable=False)
    category = Column(String(50), default="OPERATIONAL", nullable=False)
    posted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    note = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
