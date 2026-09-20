import time
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.providers.contracts import InventoryProvider
from app.core.events import Event, event_bus
from .models import (
    Product,
    InventoryItem,
    Warehouse,
    StorageLocation,
    InventoryPosition,
    StockReservation,
    GoodsMovement,
    Supplier,
    PurchaseRequisition,
    PurchaseRequisitionLine,
    PurchaseOrder,
    PurchaseOrderLine,
    GoodsReceipt,
    GoodsReceiptLine,
    StockTransfer,
    StockTransferLine,
    SupplierInvoice,
    CostTransaction,
)
from .repository import (
    ProductRepository,
    InventoryRepository,
    WarehouseRepository,
    StorageLocationRepository,
    InventoryPositionRepository,
    StockReservationRepository,
    GoodsMovementRepository,
    SupplierRepository,
    PurchaseRequisitionRepository,
    PurchaseOrderRepository,
    GoodsReceiptRepository,
    StockTransferRepository,
    SupplierInvoiceRepository,
    CostTransactionRepository,
)
from .schemas import (
    ProductCreate,
    WarehouseCreate,
    StockAdjustmentRequest,
    SupplierCreate,
    SupplierUpdate,
    PurchaseRequisitionCreate,
    PurchaseOrderCreate,
    GoodsReceiptCreate,
    StockTransferCreate,
    SupplierInvoiceCreate,
    ErpOverviewMetricsResponse,
)


# ====================================================================
# BACKWARD-COMPATIBLE INVENTORY SERVICE (Preserved Provider Contract)
# ====================================================================

class InventoryService(InventoryProvider):
    def __init__(
        self,
        product_repo: Optional[ProductRepository] = None,
        inventory_repo: Optional[InventoryRepository] = None,
        position_repo: Optional[InventoryPositionRepository] = None,
    ):
        self.product_repo = product_repo
        self.inventory_repo = inventory_repo
        self.position_repo = position_repo

    async def create_product(self, data: ProductCreate) -> Product:
        if not self.product_repo or not self.inventory_repo:
            raise ValueError("Repositories not configured")

        product = Product(
            sku=data.sku,
            name=data.name,
            description=data.description,
            price=data.price,
            cost=data.cost,
        )
        created_product = await self.product_repo.create(product)

        # Create legacy inventory item
        inv = InventoryItem(
            product_id=created_product.id,
            warehouse=data.warehouse,
            quantity=data.initial_quantity,
        )
        await self.inventory_repo.create(inv)

        # Also initialize or sync canonical InventoryPosition if repo available
        if self.position_repo:
            pos = InventoryPosition(
                product_reference=data.sku,
                product_name=data.name,
                warehouse_id=1,
                on_hand_quantity=float(data.initial_quantity),
                unit_cost=float(data.cost),
            )
            await self.position_repo.create(pos)

        return created_product

    async def list_products(self, skip: int = 0, limit: int = 100) -> List[Product]:
        if not self.product_repo:
            return []
        return await self.product_repo.get_all(skip=skip, limit=limit)

    async def get_product(self, product_id: int) -> Optional[Product]:
        if not self.product_repo:
            return None
        return await self.product_repo.get_by_id(product_id)

    async def update_product(self, product_id: int, data: Any) -> Optional[Product]:
        if not self.product_repo:
            return None
        dump = data.model_dump(exclude_unset=True) if hasattr(data, "model_dump") else data
        return await self.product_repo.update(product_id, **dump)

    async def delete_product(self, product_id: int) -> bool:
        if not self.product_repo:
            return False
        return await self.product_repo.delete(product_id)

    async def list_inventory(self, skip: int = 0, limit: int = 100) -> List[InventoryItem]:
        if not self.inventory_repo:
            return []
        return await self.inventory_repo.get_all(skip=skip, limit=limit)

    async def update_stock(self, product_id: int, quantity_delta: int, warehouse: str = "MAIN") -> Dict[str, Any]:
        if not self.inventory_repo:
            return {"product_id": product_id, "quantity": quantity_delta}

        item = await self.inventory_repo.get_by_product_and_warehouse(product_id, warehouse)
        if not item:
            item = InventoryItem(product_id=product_id, warehouse=warehouse, quantity=max(0, quantity_delta))
            await self.inventory_repo.create(item)
            return {"product_id": product_id, "warehouse": warehouse, "quantity": item.quantity}

        new_quantity = item.quantity + quantity_delta
        if new_quantity < 0:
            raise ValueError(f"Insufficient stock for product {product_id}. Current: {item.quantity}")

        await self.inventory_repo.update(item.id, quantity=new_quantity)

        # Sync canonical position if product SKU can be found
        if self.product_repo and self.position_repo:
            prod = await self.product_repo.get_by_id(product_id)
            if prod:
                pos = await self.position_repo.get_by_product_and_warehouse(prod.sku, 1)
                if pos:
                    await self.position_repo.update(pos.id, on_hand_quantity=float(new_quantity))

        return {"product_id": product_id, "warehouse": warehouse, "quantity": new_quantity}

    # InventoryProvider contract methods
    async def check_stock(self, product_id: int, warehouse: str = "MAIN") -> int:
        if not self.inventory_repo:
            return 0
        item = await self.inventory_repo.get_by_product_and_warehouse(product_id, warehouse)
        return item.quantity if item else 0

    async def deduct_stock(self, product_id: int, quantity: int) -> bool:
        try:
            await self.update_stock(product_id, -quantity)
            return True
        except ValueError:
            return False

    async def restock(self, product_id: int, quantity: int) -> int:
        res = await self.update_stock(product_id, quantity)
        return res["quantity"]

    async def get_low_stock_items(self) -> List[InventoryItem]:
        if not self.inventory_repo:
            return []
        return await self.inventory_repo.get_low_stock()


# ====================================================================
# CANONICAL ERP DOMAIN SERVICES (SAP Fiori / S/4HANA Specification)
# ====================================================================

class WarehouseService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = WarehouseRepository(session)
        self.loc_repo = StorageLocationRepository(session)

    async def create_warehouse(self, data: WarehouseCreate) -> Warehouse:
        wh = Warehouse(
            code=data.code.upper(),
            name=data.name,
            status=data.status,
            address=data.address,
            timezone=data.timezone,
            provider_reference=data.provider_reference,
            sync_status="SYNCED",
        )
        created_wh = await self.repo.create(wh)

        # Create default locations for new warehouse
        loc_main = StorageLocation(
            warehouse_id=created_wh.id,
            code="LOC-MAIN",
            name=f"{data.name} - Main Storage",
            type="MAIN",
        )
        loc_returns = StorageLocation(
            warehouse_id=created_wh.id,
            code="LOC-RETURNS",
            name=f"{data.name} - Returns & Inspection",
            type="RETURNS",
        )
        loc_blocked = StorageLocation(
            warehouse_id=created_wh.id,
            code="LOC-BLOCKED",
            name=f"{data.name} - Blocked Stock",
            type="BLOCKED_STOCK",
        )
        await self.loc_repo.create(loc_main)
        await self.loc_repo.create(loc_returns)
        await self.loc_repo.create(loc_blocked)

        return await self.repo.get_with_locations(created_wh.id) or created_wh

    async def list_warehouses(self) -> List[Warehouse]:
        warehouses = await self.repo.get_all_with_locations()
        if not warehouses:
            # Seed default warehouse if none exist
            default_wh = Warehouse(
                code="WH-MAIN",
                name="Main Distribution Center",
                status="ACTIVE",
                address="123 Logistics Way, Ho Chi Minh City",
            )
            created = await self.repo.create(default_wh)
            await self.loc_repo.create(
                StorageLocation(warehouse_id=created.id, code="LOC-MAIN", name="General Rack Area", type="MAIN")
            )
            await self.loc_repo.create(
                StorageLocation(warehouse_id=created.id, code="LOC-INSPECT", name="Quality Inspection", type="QUALITY_INSPECTION")
            )
            warehouses = await self.repo.get_all_with_locations()
        return warehouses

    async def get_warehouse(self, warehouse_id: int) -> Optional[Warehouse]:
        return await self.repo.get_with_locations(warehouse_id)


class StockAdjustmentService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.position_repo = InventoryPositionRepository(session)
        self.movement_repo = GoodsMovementRepository(session)
        self.inventory_repo = InventoryRepository(session)
        self.product_repo = ProductRepository(session)

    async def post_adjustment(self, data: StockAdjustmentRequest) -> InventoryPosition:
        position = await self.position_repo.get_by_product_and_warehouse(
            product_reference=data.product_reference,
            warehouse_id=data.warehouse_id,
            storage_location_id=data.storage_location_id,
        )

        delta = data.quantity if data.adjustment_type.upper() == "INCREASE" else -data.quantity
        old_on_hand = position.on_hand_quantity if position else 0.0
        new_on_hand = old_on_hand + delta

        if new_on_hand < 0.0:
            raise ValueError(f"Inventory invariant violation: on-hand quantity cannot be negative. Current: {old_on_hand}, delta: {delta}")

        if position and (position.reserved_quantity + position.blocked_quantity > new_on_hand):
            raise ValueError("Inventory invariant violation: on-hand quantity cannot be less than reserved + blocked stock.")

        if not position:
            position = InventoryPosition(
                product_reference=data.product_reference,
                product_name=data.product_reference,
                warehouse_id=data.warehouse_id,
                storage_location_id=data.storage_location_id,
                on_hand_quantity=new_on_hand,
            )
            position = await self.position_repo.create(position)
        else:
            await self.position_repo.update(
                position.id,
                on_hand_quantity=new_on_hand,
                version=position.version + 1,
            )
            position.on_hand_quantity = new_on_hand

        # Append audit GoodsMovement record
        movement_type = "ADJUSTMENT_IN" if delta >= 0 else "ADJUSTMENT_OUT"
        movement = GoodsMovement(
            movement_number=f"MV-ADJ-{int(time.time() * 1000)}",
            movement_type=movement_type,
            product_reference=data.product_reference,
            quantity=delta,
            unit=position.unit,
            from_warehouse_id=data.warehouse_id if delta < 0 else None,
            to_warehouse_id=data.warehouse_id if delta > 0 else None,
            from_location_id=data.storage_location_id if delta < 0 else None,
            to_location_id=data.storage_location_id if delta > 0 else None,
            reference_type="MANUAL_ADJUSTMENT",
            reference_id=f"ADJ-{data.reason_code}",
            reason_code=data.reason_code,
            note=data.note,
        )
        await self.movement_repo.create(movement)

        # Sync legacy InventoryItem if SKU matches
        prod = await self.product_repo.get_by_sku(data.product_reference)
        if prod:
            inv = await self.inventory_repo.get_by_product_and_warehouse(prod.id, "MAIN")
            if inv:
                await self.inventory_repo.update(inv.id, quantity=int(new_on_hand))

        await event_bus.publish(
            Event(
                name="erp.stock_adjusted",
                payload={
                    "product_reference": data.product_reference,
                    "warehouse_id": data.warehouse_id,
                    "delta": delta,
                    "new_on_hand": new_on_hand,
                    "reason_code": data.reason_code,
                },
            )
        )

        return position


class StockReservationService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.position_repo = InventoryPositionRepository(session)
        self.reservation_repo = StockReservationRepository(session)
        self.movement_repo = GoodsMovementRepository(session)

    async def check_availability(self, product_ref: str, warehouse_id: int, quantity: float) -> bool:
        pos = await self.position_repo.get_by_product_and_warehouse(product_ref, warehouse_id)
        if not pos:
            return False
        return pos.available_quantity >= quantity

    async def reserve_stock(
        self,
        product_ref: str,
        warehouse_id: int,
        source_ref: str,
        quantity: float,
        location_id: Optional[int] = None,
        source_type: str = "OMS_ORDER",
    ) -> StockReservation:
        pos = await self.position_repo.get_by_product_and_warehouse(product_ref, warehouse_id, location_id)
        if not pos or pos.available_quantity < quantity:
            avail = pos.available_quantity if pos else 0.0
            raise ValueError(f"Insufficient available stock for reservation of {product_ref}. Available: {avail}, Requested: {quantity}")

        # Update position
        new_reserved = pos.reserved_quantity + quantity
        await self.position_repo.update(pos.id, reserved_quantity=new_reserved)

        reservation = StockReservation(
            product_reference=product_ref,
            warehouse_id=warehouse_id,
            storage_location_id=location_id,
            source_type=source_type,
            source_reference=source_ref,
            quantity=quantity,
            status="ACTIVE",
        )
        created_res = await self.reservation_repo.create(reservation)

        await event_bus.publish(
            Event(
                name="erp.stock_reserved",
                payload={"reservation_id": created_res.id, "product": product_ref, "quantity": quantity, "source": source_ref},
            )
        )
        return created_res

    async def release_reservation(self, product_ref: str, source_ref: str) -> bool:
        res = await self.reservation_repo.get_active_by_product_and_source(product_ref, source_ref)
        if not res:
            return False

        pos = await self.position_repo.get_by_product_and_warehouse(product_ref, res.warehouse_id, res.storage_location_id)
        if pos:
            new_reserved = max(0.0, pos.reserved_quantity - res.quantity)
            await self.position_repo.update(pos.id, reserved_quantity=new_reserved)

        await self.reservation_repo.update(res.id, status="RELEASED")
        await event_bus.publish(
            Event(
                name="erp.stock_reservation_released",
                payload={"reservation_id": res.id, "product": product_ref, "source": source_ref},
            )
        )
        return True

    async def consume_reservation(self, product_ref: str, source_ref: str) -> bool:
        res = await self.reservation_repo.get_active_by_product_and_source(product_ref, source_ref)
        if not res:
            return False

        pos = await self.position_repo.get_by_product_and_warehouse(product_ref, res.warehouse_id, res.storage_location_id)
        if pos:
            new_reserved = max(0.0, pos.reserved_quantity - res.quantity)
            new_on_hand = max(0.0, pos.on_hand_quantity - res.quantity)
            await self.position_repo.update(pos.id, reserved_quantity=new_reserved, on_hand_quantity=new_on_hand)

            # Record consumption movement
            movement = GoodsMovement(
                movement_number=f"MV-RES-{int(time.time() * 1000)}",
                movement_type="RESERVATION_CONSUMPTION",
                product_reference=product_ref,
                quantity=-res.quantity,
                unit=pos.unit,
                from_warehouse_id=res.warehouse_id,
                reference_type=res.source_type,
                reference_id=res.source_reference,
            )
            await self.movement_repo.create(movement)

        await self.reservation_repo.update(res.id, status="CONSUMED")
        await event_bus.publish(
            Event(
                name="erp.stock_consumed",
                payload={"reservation_id": res.id, "product": product_ref, "quantity": res.quantity, "source": source_ref},
            )
        )
        return True


class SupplierService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = SupplierRepository(session)

    async def create_supplier(self, data: SupplierCreate) -> Supplier:
        existing = await self.repo.get_by_code(data.supplier_code)
        if existing:
            raise ValueError(f"Supplier code {data.supplier_code} already exists")

        supplier = Supplier(
            supplier_code=data.supplier_code.upper(),
            name=data.name,
            status=data.status,
            tax_identifier=data.tax_identifier,
            email=data.email,
            phone=data.phone,
            address=data.address,
            payment_terms=data.payment_terms,
            currency=data.currency,
            provider_reference=data.provider_reference,
        )
        return await self.repo.create(supplier)

    async def list_suppliers(self, status: Optional[str] = None) -> List[Supplier]:
        suppliers = await self.repo.get_all_suppliers(status)
        if not suppliers:
            # Seed default demo suppliers
            sup1 = Supplier(
                supplier_code="SUP-ABC",
                name="ABC Resin Corporation",
                status="ACTIVE",
                tax_identifier="TAX-VN-01020304",
                email="procurement@abcresin.vn",
                phone="+84 28 3822 1000",
                address="Industrial Park 2, Binh Duong",
                payment_terms="NET_30",
            )
            sup2 = Supplier(
                supplier_code="SUP-DELTA",
                name="Delta Packaging Materials",
                status="ACTIVE",
                tax_identifier="TAX-VN-05060708",
                email="sales@deltapack.com",
                phone="+84 28 3899 4400",
                address="Tan Binh Industrial Zone, HCMC",
                payment_terms="NET_60",
            )
            await self.repo.create(sup1)
            await self.repo.create(sup2)
            suppliers = await self.repo.get_all_suppliers(status)
        return suppliers

    async def get_supplier(self, supplier_id: int) -> Optional[Supplier]:
        return await self.repo.get_by_id(supplier_id)

    async def update_supplier(self, supplier_id: int, data: SupplierUpdate) -> Optional[Supplier]:
        dump = data.model_dump(exclude_unset=True)
        return await self.repo.update(supplier_id, **dump)

    async def toggle_hold(self, supplier_id: int) -> Supplier:
        sup = await self.repo.get_by_id(supplier_id)
        if not sup:
            raise ValueError("Supplier not found")
        new_status = "ON_HOLD" if sup.status == "ACTIVE" else "ACTIVE"
        await self.repo.update(supplier_id, status=new_status)
        sup.status = new_status
        return sup


class PurchaseRequisitionService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = PurchaseRequisitionRepository(session)

    async def create_requisition(self, data: PurchaseRequisitionCreate) -> PurchaseRequisition:
        req_num = f"PR-{int(time.time() * 1000)}"
        pr = PurchaseRequisition(
            requisition_number=req_num,
            requester_id=data.requester_id,
            status="DRAFT",
            needed_by=data.needed_by,
            reason=data.reason,
        )
        created_pr = await self.repo.create(pr)

        for line_data in data.lines:
            line = PurchaseRequisitionLine(
                requisition_id=created_pr.id,
                product_reference=line_data.product_reference,
                description_snapshot=line_data.description_snapshot or line_data.product_reference,
                quantity=line_data.quantity,
                unit=line_data.unit,
                estimated_unit_cost=line_data.estimated_unit_cost,
                currency=line_data.currency,
                preferred_supplier_id=line_data.preferred_supplier_id,
                warehouse_id=line_data.warehouse_id,
            )
            self.session.add(line)
        await self.session.commit()

        return await self.repo.get_with_lines(created_pr.id) or created_pr

    async def submit(self, pr_id: int) -> PurchaseRequisition:
        pr = await self.repo.get_with_lines(pr_id)
        if not pr:
            raise ValueError("Requisition not found")
        if pr.status != "DRAFT":
            raise ValueError(f"Cannot submit requisition in status {pr.status}")
        await self.repo.update(pr_id, status="SUBMITTED")
        pr.status = "SUBMITTED"
        return pr

    async def approve(self, pr_id: int) -> PurchaseRequisition:
        pr = await self.repo.get_with_lines(pr_id)
        if not pr:
            raise ValueError("Requisition not found")
        if pr.status != "SUBMITTED":
            raise ValueError(f"Cannot approve requisition in status {pr.status}")
        await self.repo.update(pr_id, status="APPROVED")
        pr.status = "APPROVED"
        await event_bus.publish(
            Event(name="erp.requisition_approved", payload={"requisition_id": pr.id, "requisition_number": pr.requisition_number})
        )
        return pr

    async def reject(self, pr_id: int, reason: str) -> PurchaseRequisition:
        pr = await self.repo.get_with_lines(pr_id)
        if not pr:
            raise ValueError("Requisition not found")
        if pr.status != "SUBMITTED":
            raise ValueError(f"Cannot reject requisition in status {pr.status}")
        await self.repo.update(pr_id, status="REJECTED", rejection_reason=reason)
        pr.status = "REJECTED"
        pr.rejection_reason = reason
        return pr

    async def list_requisitions(self, status: Optional[str] = None) -> List[PurchaseRequisition]:
        return await self.repo.get_all_requisitions(status)

    async def get_requisition(self, pr_id: int) -> Optional[PurchaseRequisition]:
        return await self.repo.get_with_lines(pr_id)


class PurchaseOrderService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = PurchaseOrderRepository(session)
        self.supplier_repo = SupplierRepository(session)

    async def create_order(self, data: PurchaseOrderCreate) -> PurchaseOrder:
        supplier = await self.supplier_repo.get_by_id(data.supplier_id)
        if not supplier:
            raise ValueError("Supplier not found")
        if supplier.status == "ON_HOLD":
            raise ValueError("Supplier is ON_HOLD. Purchase orders cannot be issued to suppliers on hold.")

        subtotal = sum(line.ordered_quantity * line.unit_cost for line in data.lines)
        grand_total = subtotal + data.tax_total + data.shipping_total
        po_num = f"PO-{int(time.time() * 1000)}"

        po = PurchaseOrder(
            po_number=po_num,
            supplier_id=data.supplier_id,
            buyer_id=data.buyer_id,
            status="DRAFT",
            currency=data.currency,
            subtotal=subtotal,
            tax_total=data.tax_total,
            shipping_total=data.shipping_total,
            grand_total=grand_total,
            expected_delivery_date=data.expected_delivery_date,
            warehouse_id=data.warehouse_id,
            notes=data.notes,
        )
        created_po = await self.repo.create(po)

        for l_data in data.lines:
            line = PurchaseOrderLine(
                purchase_order_id=created_po.id,
                product_reference=l_data.product_reference,
                description_snapshot=l_data.description_snapshot or l_data.product_reference,
                ordered_quantity=l_data.ordered_quantity,
                received_quantity=0.0,
                unit=l_data.unit,
                unit_cost=l_data.unit_cost,
                line_total=l_data.ordered_quantity * l_data.unit_cost,
                expected_delivery_date=l_data.expected_delivery_date or data.expected_delivery_date,
            )
            self.session.add(line)
        await self.session.commit()

        return await self.repo.get_with_lines(created_po.id) or created_po

    async def submit(self, po_id: int) -> PurchaseOrder:
        po = await self.repo.get_with_lines(po_id)
        if not po:
            raise ValueError("Purchase order not found")
        if po.status != "DRAFT":
            raise ValueError(f"Cannot submit PO in status {po.status}")
        await self.repo.update(po_id, status="PENDING_APPROVAL")
        po.status = "PENDING_APPROVAL"
        return po

    async def approve(self, po_id: int) -> PurchaseOrder:
        po = await self.repo.get_with_lines(po_id)
        if not po:
            raise ValueError("Purchase order not found")
        if po.status != "PENDING_APPROVAL":
            raise ValueError(f"Cannot approve PO in status {po.status}")
        await self.repo.update(po_id, status="APPROVED")
        po.status = "APPROVED"
        await event_bus.publish(
            Event(name="erp.po_approved", payload={"po_id": po.id, "po_number": po.po_number, "grand_total": po.grand_total})
        )
        return po

    async def send_to_supplier(self, po_id: int) -> PurchaseOrder:
        po = await self.repo.get_with_lines(po_id)
        if not po:
            raise ValueError("Purchase order not found")
        if po.status != "APPROVED":
            raise ValueError(f"Cannot send PO in status {po.status}")
        await self.repo.update(po_id, status="SENT")
        po.status = "SENT"
        return po

    async def cancel(self, po_id: int, reason: str = "") -> PurchaseOrder:
        po = await self.repo.get_with_lines(po_id)
        if not po:
            raise ValueError("Purchase order not found")
        if po.status in ["PARTIALLY_RECEIVED", "RECEIVED", "CLOSED"]:
            raise ValueError(f"Cannot cancel purchase order with received goods (status: {po.status})")
        await self.repo.update(po_id, status="CANCELLED")
        po.status = "CANCELLED"
        return po

    async def list_orders(
        self, supplier_id: Optional[int] = None, status: Optional[str] = None, warehouse_id: Optional[int] = None
    ) -> List[PurchaseOrder]:
        return await self.repo.get_all_orders(supplier_id, status, warehouse_id)

    async def get_order(self, po_id: int) -> Optional[PurchaseOrder]:
        return await self.repo.get_with_lines(po_id)


class GoodsReceiptService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.receipt_repo = GoodsReceiptRepository(session)
        self.po_repo = PurchaseOrderRepository(session)
        self.position_repo = InventoryPositionRepository(session)
        self.movement_repo = GoodsMovementRepository(session)

    async def post_receipt(self, data: GoodsReceiptCreate) -> GoodsReceipt:
        po: Optional[PurchaseOrder] = None
        if data.purchase_order_id:
            po = await self.po_repo.get_with_lines(data.purchase_order_id)
            if not po:
                raise ValueError("Purchase order not found")
            if po.status not in ["APPROVED", "SENT", "PARTIALLY_RECEIVED"]:
                raise ValueError(f"Cannot receive goods for PO in status {po.status}")

        receipt_num = f"GR-{int(time.time() * 1000)}"
        receipt = GoodsReceipt(
            receipt_number=receipt_num,
            purchase_order_id=data.purchase_order_id,
            warehouse_id=data.warehouse_id,
            status="POSTED",
            received_by=data.received_by,
            supplier_delivery_reference=data.supplier_delivery_reference,
            note=data.note,
        )
        created_receipt = await self.receipt_repo.create(receipt)

        for l_data in data.lines:
            total_classified = l_data.accepted_quantity + l_data.blocked_quantity + l_data.damaged_quantity
            if total_classified != l_data.received_quantity:
                raise ValueError(
                    f"Quantity reconciliation failed: accepted ({l_data.accepted_quantity}) + "
                    f"blocked ({l_data.blocked_quantity}) + damaged ({l_data.damaged_quantity}) != "
                    f"received ({l_data.received_quantity})"
                )

            # Check remaining PO quantity if line is linked
            if po and l_data.purchase_order_line_id:
                po_line = next((line for line in po.lines if line.id == l_data.purchase_order_line_id), None)
                if po_line:
                    remaining = po_line.ordered_quantity - po_line.received_quantity
                    if l_data.received_quantity > remaining:
                        raise ValueError(
                            f"Over-receipt blocked: received {l_data.received_quantity} exceeds remaining {remaining} for {l_data.product_reference}"
                        )
                    po_line.received_quantity += l_data.received_quantity

            # Save receipt line
            rcpt_line = GoodsReceiptLine(
                goods_receipt_id=created_receipt.id,
                purchase_order_line_id=l_data.purchase_order_line_id,
                product_reference=l_data.product_reference,
                expected_quantity=l_data.expected_quantity,
                received_quantity=l_data.received_quantity,
                accepted_quantity=l_data.accepted_quantity,
                blocked_quantity=l_data.blocked_quantity,
                damaged_quantity=l_data.damaged_quantity,
                unit=l_data.unit,
                storage_location_id=l_data.storage_location_id,
                note=l_data.note,
            )
            self.session.add(rcpt_line)

            # Update Inventory Position atomically
            pos = await self.position_repo.get_by_product_and_warehouse(
                l_data.product_reference, data.warehouse_id, l_data.storage_location_id
            )
            if not pos:
                pos = InventoryPosition(
                    product_reference=l_data.product_reference,
                    product_name=l_data.product_reference,
                    warehouse_id=data.warehouse_id,
                    storage_location_id=l_data.storage_location_id,
                    on_hand_quantity=l_data.accepted_quantity,
                    blocked_quantity=l_data.blocked_quantity,
                )
                await self.position_repo.create(pos)
            else:
                await self.position_repo.update(
                    pos.id,
                    on_hand_quantity=pos.on_hand_quantity + l_data.accepted_quantity,
                    blocked_quantity=pos.blocked_quantity + l_data.blocked_quantity,
                )

            # Post GoodsMovement
            movement = GoodsMovement(
                movement_number=f"MV-GR-{int(time.time() * 1000)}",
                movement_type="GOODS_RECEIPT",
                product_reference=l_data.product_reference,
                quantity=l_data.accepted_quantity,
                unit=l_data.unit,
                to_warehouse_id=data.warehouse_id,
                to_location_id=l_data.storage_location_id,
                reference_type="GOODS_RECEIPT",
                reference_id=receipt_num,
                reason_code="RECEIPT_POSTING",
                note=f"Receipt from PO {po.po_number if po else 'DIRECT'}",
            )
            await self.movement_repo.create(movement)

        # Recalculate PO overall status
        if po:
            all_received = all(po_line_item.received_quantity >= po_line_item.ordered_quantity for po_line_item in po.lines)
            new_po_status = "RECEIVED" if all_received else "PARTIALLY_RECEIVED"
            await self.po_repo.update(po.id, status=new_po_status)

        await self.session.commit()
        await event_bus.publish(
            Event(
                name="erp.goods_receipt_posted",
                payload={"receipt_id": created_receipt.id, "receipt_number": receipt_num, "warehouse_id": data.warehouse_id},
            )
        )

        return await self.receipt_repo.get_with_lines(created_receipt.id) or created_receipt

    async def reverse_receipt(self, receipt_id: int, reason: str) -> GoodsReceipt:
        receipt = await self.receipt_repo.get_with_lines(receipt_id)
        if not receipt:
            raise ValueError("Goods receipt not found")
        if receipt.status != "POSTED":
            raise ValueError(f"Cannot reverse receipt in status {receipt.status}")

        po: Optional[PurchaseOrder] = None
        if receipt.purchase_order_id:
            po = await self.po_repo.get_with_lines(receipt.purchase_order_id)

        for line in receipt.lines:
            # Revert inventory position
            pos = await self.position_repo.get_by_product_and_warehouse(
                line.product_reference, receipt.warehouse_id, line.storage_location_id
            )
            if pos:
                new_on_hand = max(0.0, pos.on_hand_quantity - line.accepted_quantity)
                new_blocked = max(0.0, pos.blocked_quantity - line.blocked_quantity)
                await self.position_repo.update(pos.id, on_hand_quantity=new_on_hand, blocked_quantity=new_blocked)

            # Create reverse GoodsMovement
            rev_mv = GoodsMovement(
                movement_number=f"MV-REV-{int(time.time() * 1000)}",
                movement_type="RETURN_TO_SUPPLIER",
                product_reference=line.product_reference,
                quantity=-line.accepted_quantity,
                unit=line.unit,
                from_warehouse_id=receipt.warehouse_id,
                from_location_id=line.storage_location_id,
                reference_type="RECEIPT_REVERSAL",
                reference_id=receipt.receipt_number,
                reason_code="REVERSAL",
                note=reason,
            )
            await self.movement_repo.create(rev_mv)

            # Revert PO line received quantity
            if po and line.purchase_order_line_id:
                po_line = next((item for item in po.lines if item.id == line.purchase_order_line_id), None)
                if po_line:
                    po_line.received_quantity = max(0.0, po_line.received_quantity - line.received_quantity)

        # Recalculate PO status
        if po:
            any_received = any(item.received_quantity > 0 for item in po.lines)
            new_po_status = "PARTIALLY_RECEIVED" if any_received else "SENT"
            await self.po_repo.update(po.id, status=new_po_status)

        await self.receipt_repo.update(receipt.id, status="REVERSED", note=f"Reversed: {reason}")
        receipt.status = "REVERSED"
        await self.session.commit()

        await event_bus.publish(
            Event(name="erp.goods_receipt_reversed", payload={"receipt_id": receipt.id, "reason": reason})
        )
        return receipt

    async def list_receipts(self, po_id: Optional[int] = None, warehouse_id: Optional[int] = None) -> List[GoodsReceipt]:
        return await self.receipt_repo.get_all_receipts(po_id, warehouse_id)

    async def get_receipt(self, receipt_id: int) -> Optional[GoodsReceipt]:
        return await self.receipt_repo.get_with_lines(receipt_id)


class StockTransferService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.transfer_repo = StockTransferRepository(session)
        self.position_repo = InventoryPositionRepository(session)
        self.movement_repo = GoodsMovementRepository(session)

    async def create_transfer(self, data: StockTransferCreate) -> StockTransfer:
        if data.from_warehouse_id == data.to_warehouse_id:
            raise ValueError("Source and destination warehouses cannot be the same")

        for line in data.lines:
            pos = await self.position_repo.get_by_product_and_warehouse(line.product_reference, data.from_warehouse_id)
            avail = pos.available_quantity if pos else 0.0
            if avail < line.requested_quantity:
                raise ValueError(
                    f"Insufficient stock in source warehouse for {line.product_reference}. Available: {avail}, Requested: {line.requested_quantity}"
                )

        transfer_num = f"ST-{int(time.time() * 1000)}"
        transfer = StockTransfer(
            transfer_number=transfer_num,
            from_warehouse_id=data.from_warehouse_id,
            to_warehouse_id=data.to_warehouse_id,
            status="READY",
            created_by=data.created_by,
            notes=data.notes,
        )
        created_transfer = await self.transfer_repo.create(transfer)

        for l_data in data.lines:
            line_obj = StockTransferLine(
                stock_transfer_id=created_transfer.id,
                product_reference=l_data.product_reference,
                requested_quantity=l_data.requested_quantity,
                shipped_quantity=0.0,
                received_quantity=0.0,
                unit=l_data.unit,
            )
            self.session.add(line_obj)
        await self.session.commit()

        return await self.transfer_repo.get_with_lines(created_transfer.id) or created_transfer

    async def ship_transfer(self, transfer_id: int) -> StockTransfer:
        transfer = await self.transfer_repo.get_with_lines(transfer_id)
        if not transfer:
            raise ValueError("Stock transfer not found")
        if transfer.status not in ["DRAFT", "READY"]:
            raise ValueError(f"Cannot ship transfer in status {transfer.status}")

        for line in transfer.lines:
            pos = await self.position_repo.get_by_product_and_warehouse(line.product_reference, transfer.from_warehouse_id)
            if not pos or pos.available_quantity < line.requested_quantity:
                avail = pos.available_quantity if pos else 0.0
                raise ValueError(f"Insufficient stock for {line.product_reference} during shipping. Available: {avail}")

            await self.position_repo.update(pos.id, on_hand_quantity=pos.on_hand_quantity - line.requested_quantity)
            line.shipped_quantity = line.requested_quantity

            # Record TRANSFER_OUT movement
            mv = GoodsMovement(
                movement_number=f"MV-TR-OUT-{int(time.time() * 1000)}",
                movement_type="TRANSFER_OUT",
                product_reference=line.product_reference,
                quantity=-line.requested_quantity,
                unit=line.unit,
                from_warehouse_id=transfer.from_warehouse_id,
                reference_type="STOCK_TRANSFER",
                reference_id=transfer.transfer_number,
                reason_code="TRANSFER_POSTING",
            )
            await self.movement_repo.create(mv)

        now = datetime.now(timezone.utc)
        await self.transfer_repo.update(transfer.id, status="IN_TRANSIT", shipped_at=now)
        transfer.status = "IN_TRANSIT"
        transfer.shipped_at = now
        await self.session.commit()

        return transfer

    async def receive_transfer(self, transfer_id: int, received_quantities: Optional[Dict[int, float]] = None) -> StockTransfer:
        transfer = await self.transfer_repo.get_with_lines(transfer_id)
        if not transfer:
            raise ValueError("Stock transfer not found")
        if transfer.status != "IN_TRANSIT":
            raise ValueError(f"Cannot receive transfer in status {transfer.status}")

        for line in transfer.lines:
            rcv_qty = (
                float(received_quantities[line.id])
                if (received_quantities and line.id in received_quantities)
                else line.shipped_quantity
            )
            line.received_quantity = rcv_qty

            # Add to destination warehouse
            pos = await self.position_repo.get_by_product_and_warehouse(line.product_reference, transfer.to_warehouse_id)
            if not pos:
                pos = InventoryPosition(
                    product_reference=line.product_reference,
                    product_name=line.product_reference,
                    warehouse_id=transfer.to_warehouse_id,
                    on_hand_quantity=rcv_qty,
                )
                await self.position_repo.create(pos)
            else:
                await self.position_repo.update(pos.id, on_hand_quantity=pos.on_hand_quantity + rcv_qty)

            # Record TRANSFER_IN movement
            mv = GoodsMovement(
                movement_number=f"MV-TR-IN-{int(time.time() * 1000)}",
                movement_type="TRANSFER_IN",
                product_reference=line.product_reference,
                quantity=rcv_qty,
                unit=line.unit,
                to_warehouse_id=transfer.to_warehouse_id,
                reference_type="STOCK_TRANSFER",
                reference_id=transfer.transfer_number,
                reason_code="TRANSFER_POSTING",
            )
            await self.movement_repo.create(mv)

        now = datetime.now(timezone.utc)
        await self.transfer_repo.update(transfer.id, status="RECEIVED", received_at=now)
        transfer.status = "RECEIVED"
        transfer.received_at = now
        await self.session.commit()

        return transfer

    async def list_transfers(self, status: Optional[str] = None) -> List[StockTransfer]:
        return await self.transfer_repo.get_all_transfers(status)

    async def get_transfer(self, transfer_id: int) -> Optional[StockTransfer]:
        return await self.transfer_repo.get_with_lines(transfer_id)


class SupplierInvoiceService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = SupplierInvoiceRepository(session)
        self.po_repo = PurchaseOrderRepository(session)
        self.cost_repo = CostTransactionRepository(session)

    async def create_invoice(self, data: SupplierInvoiceCreate) -> SupplierInvoice:
        inv_num = f"INV-{int(time.time() * 1000)}"
        grand_total = data.subtotal + data.tax_total

        matched_amount = 0.0
        variance_amount = 0.0
        match_status = "PENDING"
        status = "PENDING_REVIEW"

        if data.purchase_order_id:
            po = await self.po_repo.get_with_lines(data.purchase_order_id)
            if po:
                variance = grand_total - po.grand_total
                variance_amount = variance
                if abs(variance) < 0.01:
                    match_status = "MATCHED"
                    matched_amount = grand_total
                    status = "MATCHED"
                else:
                    match_status = "PRICE_MISMATCH"
                    status = "MISMATCH"

        invoice = SupplierInvoice(
            invoice_number=inv_num,
            supplier_id=data.supplier_id,
            purchase_order_id=data.purchase_order_id,
            status=status,
            due_date=data.due_date,
            currency=data.currency,
            subtotal=data.subtotal,
            tax_total=data.tax_total,
            grand_total=grand_total,
            matched_amount=matched_amount,
            variance_amount=variance_amount,
            match_status=match_status,
        )
        created_inv = await self.repo.create(invoice)
        return await self.repo.get_with_details(created_inv.id) or created_inv

    async def resolve_mismatch(self, invoice_id: int, action: str, note: str) -> SupplierInvoice:
        inv = await self.repo.get_with_details(invoice_id)
        if not inv:
            raise ValueError("Supplier invoice not found")
        if inv.status != "MISMATCH":
            raise ValueError(f"Invoice not in MISMATCH status (current: {inv.status})")

        new_status = "MATCHED" if action == "ACCEPT_VARIANCE" else "PENDING_REVIEW"
        await self.repo.update(
            invoice_id,
            status=new_status,
            match_status="MATCHED" if action == "ACCEPT_VARIANCE" else "PENDING",
            resolution_note=f"Action: {action}. Note: {note}",
        )
        return await self.repo.get_with_details(invoice_id) or inv

    async def approve_invoice(self, invoice_id: int) -> SupplierInvoice:
        inv = await self.repo.get_with_details(invoice_id)
        if not inv:
            raise ValueError("Supplier invoice not found")
        if inv.status not in ["MATCHED", "PENDING_REVIEW"]:
            raise ValueError(f"Cannot approve invoice in status {inv.status}")

        await self.repo.update(invoice_id, status="APPROVED")

        # Record operational cost transaction
        cost = CostTransaction(
            type="PURCHASE_COST",
            reference_type="SUPPLIER_INVOICE",
            reference_id=inv.invoice_number,
            amount=inv.grand_total,
            currency=inv.currency,
            category="OPERATIONAL",
            note=f"Approved invoice {inv.invoice_number}",
        )
        await self.cost_repo.create(cost)

        return await self.repo.get_with_details(invoice_id) or inv

    async def list_invoices(self, status: Optional[str] = None, supplier_id: Optional[int] = None) -> List[SupplierInvoice]:
        return await self.repo.get_all_invoices(status, supplier_id)

    async def get_invoice(self, invoice_id: int) -> Optional[SupplierInvoice]:
        return await self.repo.get_with_details(invoice_id)


class ErpOverviewMetricsService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.position_repo = InventoryPositionRepository(session)
        self.po_repo = PurchaseOrderRepository(session)
        self.inv_repo = SupplierInvoiceRepository(session)
        self.transfer_repo = StockTransferRepository(session)

    async def get_overview_metrics(self) -> ErpOverviewMetricsResponse:
        positions = await self.position_repo.get_all_positions()
        pos = await self.po_repo.get_all_orders()
        invoices = await self.inv_repo.get_all_invoices()
        transfers = await self.transfer_repo.get_all_transfers()

        total_val = sum(p.on_hand_quantity * p.unit_cost for p in positions)
        low_count = sum(1 for p in positions if p.stock_status in ["LOW", "OUT_OF_STOCK"])
        blocked_count = sum(1 for p in positions if p.blocked_quantity > 0)
        incoming = sum(p.incoming_quantity for p in positions)

        open_pos = [o for o in pos if o.status in ["DRAFT", "PENDING_APPROVAL", "APPROVED", "SENT", "PARTIALLY_RECEIVED"]]
        open_pos_count = len(open_pos)
        open_pos_val = sum(o.grand_total for o in open_pos)
        pos_awaiting = sum(1 for o in pos if o.status == "PENDING_APPROVAL")

        # Overdue POs: expected_delivery_date in the past and still open
        now = datetime.now(timezone.utc)
        pos_overdue = sum(
            1 for o in open_pos if o.expected_delivery_date and o.expected_delivery_date.replace(tzinfo=timezone.utc) < now
        )

        inv_review = sum(1 for i in invoices if i.status == "PENDING_REVIEW")
        inv_mismatch = sum(1 for i in invoices if i.status == "MISMATCH")
        trans_transit = sum(1 for t in transfers if t.status == "IN_TRANSIT")

        return ErpOverviewMetricsResponse(
            total_stock_value=total_val,
            low_stock_count=low_count,
            blocked_stock_count=blocked_count,
            incoming_quantity=incoming,
            open_pos_count=open_pos_count,
            open_pos_value=open_pos_val,
            pos_awaiting_approval=pos_awaiting,
            pos_overdue=pos_overdue,
            invoices_awaiting_review=inv_review,
            invoices_mismatch=inv_mismatch,
            transfers_in_transit=trans_transit,
        )
