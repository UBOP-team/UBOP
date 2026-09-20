from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class Order(Base):
    __tablename__ = "oms_orders"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    organization_id = Column(String(100), default="default", index=True, nullable=False)
    order_number = Column(String(100), unique=True, index=True, nullable=False)
    source_type = Column(String(50), default="INTERNAL", nullable=False)  # INTERNAL, SHOPIFY, AMAZON, etc.
    source_provider_id = Column(String(100), nullable=True)
    source_connection_id = Column(String(100), nullable=True)
    external_order_id = Column(String(100), nullable=True, index=True)

    customer_id = Column(Integer, nullable=True, index=True)
    customer_name = Column(String(255), nullable=True)
    customer_email = Column(String(255), nullable=True)
    customer_snapshot = Column(JSON, nullable=True)

    currency = Column(String(10), default="VND", nullable=False)
    subtotal = Column(Float, default=0.0, nullable=False)
    discount_total = Column(Float, default=0.0, nullable=False)
    shipping_total = Column(Float, default=0.0, nullable=False)
    tax_total = Column(Float, default=0.0, nullable=False)
    grand_total = Column(Float, default=0.0, nullable=False)
    total_amount = Column(Float, default=0.0, nullable=False)  # Backwards compatibility with BI and existing tests

    # 5 Independent State Dimensions (Section 3)
    order_state = Column(String(50), default="OPEN", nullable=False)  # OPEN, CANCELLED, ARCHIVED
    payment_state = Column(String(50), default="UNPAID", nullable=False)  # UNPAID, PENDING, AUTHORIZED, PARTIALLY_PAID, PAID, PARTIALLY_REFUNDED, REFUNDED, VOIDED
    fulfillment_state = Column(String(50), default="UNFULFILLED", nullable=False)  # UNFULFILLED, PARTIALLY_FULFILLED, FULFILLED, ON_HOLD, CANCELLED
    return_state = Column(String(50), default="NONE", nullable=False)  # NONE, REQUESTED, IN_PROGRESS, INSPECTION_COMPLETE, COMPLETED, DECLINED
    sync_status = Column(String(50), default="HEALTHY", nullable=False)  # HEALTHY, PENDING, SYNCING, DEGRADED, FAILED, DISCONNECTED

    status = Column(String(50), default="PENDING", nullable=False)  # Backwards compatibility with tests: PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED
    shipping_address = Column(String(500), nullable=True)

    placed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    cancelled_at = Column(DateTime, nullable=True)
    archived_at = Column(DateTime, nullable=True)
    last_synced_at = Column(DateTime, nullable=True)

    notes = Column(Text, nullable=True)
    tags = Column(String(500), nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    lines = relationship("OrderLine", back_populates="order", cascade="all, delete-orphan")
    transactions = relationship("OrderTransaction", back_populates="order", cascade="all, delete-orphan")
    fulfillment_groups = relationship("FulfillmentGroup", back_populates="order", cascade="all, delete-orphan")
    fulfillments = relationship("Fulfillment", back_populates="order", cascade="all, delete-orphan")
    returns = relationship("Return", back_populates="order", cascade="all, delete-orphan")
    refunds = relationship("Refund", back_populates="order", cascade="all, delete-orphan")
    events = relationship("OrderEvent", back_populates="order", cascade="all, delete-orphan")

    @property
    def items(self):
        """Backwards compatibility alias for order.lines"""
        return self.lines


class OrderLine(Base):
    __tablename__ = "oms_order_lines"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("oms_orders.id"), nullable=False, index=True)
    product_id = Column(Integer, nullable=True, index=True)
    variant_id = Column(Integer, nullable=True, index=True)

    external_product_id = Column(String(100), nullable=True)
    external_variant_id = Column(String(100), nullable=True)

    sku = Column(String(100), default="GENERAL-SKU", index=True, nullable=False)
    name = Column(String(255), default="Product Item", nullable=False)
    variant_name = Column(String(255), nullable=True)

    quantity = Column(Integer, default=1, nullable=False)
    unit_price = Column(Float, default=0.0, nullable=False)
    discount_total = Column(Float, default=0.0, nullable=False)
    tax_total = Column(Float, default=0.0, nullable=False)
    line_total = Column(Float, default=0.0, nullable=False)

    fulfilled_quantity = Column(Integer, default=0, nullable=False)
    returned_quantity = Column(Integer, default=0, nullable=False)
    refunded_quantity = Column(Integer, default=0, nullable=False)

    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    order = relationship("Order", back_populates="lines")

    @property
    def product_name(self):
        return self.name


# Backwards compatibility alias
OrderItem = OrderLine


class OrderTransaction(Base):
    __tablename__ = "oms_order_transactions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("oms_orders.id"), nullable=False, index=True)

    type = Column(String(50), default="SALE", nullable=False)  # AUTHORIZATION, CAPTURE, SALE, REFUND, VOID, MANUAL_PAYMENT
    status = Column(String(50), default="SUCCESS", nullable=False)  # PENDING, SUCCESS, FAILED, CANCELLED
    amount = Column(Float, default=0.0, nullable=False)
    currency = Column(String(10), default="VND", nullable=False)

    payment_method = Column(String(100), default="BANK_TRANSFER", nullable=False)
    provider_transaction_id = Column(String(150), nullable=True)
    processed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    reference = Column(String(150), nullable=True)
    notes = Column(Text, nullable=True)
    metadata_json = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    order = relationship("Order", back_populates="transactions")


class FulfillmentGroup(Base):
    __tablename__ = "oms_fulfillment_groups"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("oms_orders.id"), nullable=False, index=True)

    location_reference = Column(String(100), default="MAIN", nullable=False)
    provider_reference = Column(String(100), nullable=True)
    status = Column(String(50), default="OPEN", nullable=False)  # OPEN, IN_PROGRESS, COMPLETED, CANCELLED, ON_HOLD

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    order = relationship("Order", back_populates="fulfillment_groups")


class Fulfillment(Base):
    __tablename__ = "oms_fulfillments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("oms_orders.id"), nullable=False, index=True)
    fulfillment_group_id = Column(Integer, ForeignKey("oms_fulfillment_groups.id"), nullable=True)

    status = Column(String(50), default="SHIPPED", nullable=False)  # PENDING, IN_PROGRESS, SHIPPED, DELIVERED, FAILED, CANCELLED
    location_reference = Column(String(100), default="MAIN", nullable=False)

    tracking_company = Column(String(100), nullable=True)
    tracking_number = Column(String(150), nullable=True)
    tracking_url = Column(String(500), nullable=True)

    shipped_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    delivered_at = Column(DateTime, nullable=True)

    provider_reference = Column(String(100), nullable=True)
    sync_status = Column(String(50), default="HEALTHY", nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    order = relationship("Order", back_populates="fulfillments")


class Return(Base):
    __tablename__ = "oms_returns"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("oms_orders.id"), nullable=False, index=True)
    return_number = Column(String(100), unique=True, index=True, nullable=False)

    status = Column(String(50), default="REQUESTED", nullable=False)  # REQUESTED, APPROVED, DECLINED, IN_PROGRESS, INSPECTION_COMPLETE, COMPLETED, CANCELLED
    reason_summary = Column(String(255), nullable=True)

    requested_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    approved_at = Column(DateTime, nullable=True)
    received_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)

    provider_reference = Column(String(100), nullable=True)
    sync_status = Column(String(50), default="HEALTHY", nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    order = relationship("Order", back_populates="returns")
    lines = relationship("ReturnLine", back_populates="return_record", cascade="all, delete-orphan")


class ReturnLine(Base):
    __tablename__ = "oms_return_lines"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    return_id = Column(Integer, ForeignKey("oms_returns.id"), nullable=False, index=True)
    order_line_id = Column(Integer, ForeignKey("oms_order_lines.id"), nullable=False, index=True)

    quantity = Column(Integer, default=1, nullable=False)
    reason = Column(String(100), default="NOT_AS_EXPECTED", nullable=False)  # DAMAGED, WRONG_ITEM, NOT_AS_EXPECTED, SIZE_OR_VARIANT, CUSTOMER_CHANGED_MIND, OTHER
    condition = Column(String(50), default="GOOD", nullable=False)  # GOOD, DAMAGED, OTHER
    restock_disposition = Column(String(50), default="RESTOCK", nullable=False)  # RESTOCK, DO_NOT_RESTOCK, DAMAGED, INSPECTION_REQUIRED

    return_record = relationship("Return", back_populates="lines")


class Refund(Base):
    __tablename__ = "oms_refunds"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("oms_orders.id"), nullable=False, index=True)
    return_id = Column(Integer, ForeignKey("oms_returns.id"), nullable=True, index=True)
    refund_number = Column(String(100), unique=True, index=True, nullable=False)

    amount = Column(Float, default=0.0, nullable=False)
    currency = Column(String(10), default="VND", nullable=False)
    status = Column(String(50), default="SUCCEEDED", nullable=False)  # PENDING, SUCCEEDED, FAILED, CANCELLED
    reason = Column(String(255), nullable=True)
    refund_method = Column(String(100), default="ORIGINAL_PAYMENT", nullable=False)

    provider_reference = Column(String(100), nullable=True)
    processed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    order = relationship("Order", back_populates="refunds")


class OmsProduct(Base):
    __tablename__ = "oms_products"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    organization_id = Column(String(100), default="default", index=True, nullable=False)

    name = Column(String(255), nullable=False)
    status = Column(String(50), default="ACTIVE", nullable=False)  # ACTIVE, DRAFT, ARCHIVED
    description = Column(Text, nullable=True)
    sku = Column(String(100), nullable=True, index=True)
    price = Column(Float, default=0.0, nullable=False)

    provider_reference = Column(String(100), nullable=True)
    sync_status = Column(String(50), default="HEALTHY", nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    variants = relationship("OmsProductVariant", back_populates="product", cascade="all, delete-orphan")


class OmsProductVariant(Base):
    __tablename__ = "oms_product_variants"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("oms_products.id"), nullable=False, index=True)

    name = Column(String(255), nullable=False)
    sku = Column(String(100), unique=True, index=True, nullable=False)
    barcode = Column(String(100), nullable=True)

    price = Column(Float, default=0.0, nullable=False)
    compare_at_price = Column(Float, nullable=True)

    external_reference = Column(String(100), nullable=True)
    sync_status = Column(String(50), default="HEALTHY", nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    product = relationship("OmsProduct", back_populates="variants")


# Module-level aliases
Product = OmsProduct
ProductVariant = OmsProductVariant


class OrderEvent(Base):
    __tablename__ = "oms_order_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("oms_orders.id"), nullable=False, index=True)

    event_type = Column(String(100), nullable=False)
    actor_id = Column(String(100), default="system", nullable=False)
    summary = Column(String(500), nullable=False)
    metadata_json = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    order = relationship("Order", back_populates="events")
