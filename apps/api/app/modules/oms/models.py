from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base


class Order(Base):
    __tablename__ = "oms_orders"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_number = Column(String(100), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, nullable=False, index=True)
    status = Column(String(50), default="PENDING", nullable=False)  # PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED
    total_amount = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "oms_order_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("oms_orders.id"), nullable=False, index=True)
    product_id = Column(Integer, nullable=False, index=True)
    quantity = Column(Integer, default=1, nullable=False)
    unit_price = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")
