from typing import List, Optional
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.repository import BaseRepository
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
    PurchaseOrder,
    GoodsReceipt,
    StockTransfer,
    SupplierInvoice,
    CostTransaction,
)


# ====================================================================
# BACKWARD-COMPATIBLE REPOSITORIES
# ====================================================================

class ProductRepository(BaseRepository[Product]):
    def __init__(self, session: AsyncSession):
        super().__init__(Product, session)

    async def get_by_sku(self, sku: str) -> Optional[Product]:
        res = await self.session.execute(select(Product).filter(Product.sku == sku))
        return res.scalars().first()


class InventoryRepository(BaseRepository[InventoryItem]):
    def __init__(self, session: AsyncSession):
        super().__init__(InventoryItem, session)

    async def get_by_product_and_warehouse(self, product_id: int, warehouse: str = "MAIN") -> Optional[InventoryItem]:
        query = select(InventoryItem).filter(
            InventoryItem.product_id == product_id,
            InventoryItem.warehouse == warehouse,
        )
        res = await self.session.execute(query)
        return res.scalars().first()

    async def get_low_stock(self) -> List[InventoryItem]:
        query = select(InventoryItem).filter(InventoryItem.quantity <= InventoryItem.reorder_level)
        res = await self.session.execute(query)
        return list(res.scalars().all())


# ====================================================================
# CANONICAL ERP REPOSITORIES (SAP Fiori / S/4HANA Specification)
# ====================================================================

class WarehouseRepository(BaseRepository[Warehouse]):
    def __init__(self, session: AsyncSession):
        super().__init__(Warehouse, session)

    async def get_by_code(self, code: str) -> Optional[Warehouse]:
        res = await self.session.execute(
            select(Warehouse)
            .options(selectinload(Warehouse.storage_locations))
            .filter(Warehouse.code == code)
        )
        return res.scalars().first()

    async def get_with_locations(self, warehouse_id: int) -> Optional[Warehouse]:
        res = await self.session.execute(
            select(Warehouse)
            .options(selectinload(Warehouse.storage_locations))
            .filter(Warehouse.id == warehouse_id)
        )
        return res.scalars().first()

    async def get_all_with_locations(self) -> List[Warehouse]:
        res = await self.session.execute(
            select(Warehouse)
            .options(selectinload(Warehouse.storage_locations))
            .order_by(Warehouse.id)
        )
        return list(res.scalars().all())


class StorageLocationRepository(BaseRepository[StorageLocation]):
    def __init__(self, session: AsyncSession):
        super().__init__(StorageLocation, session)

    async def get_by_warehouse(self, warehouse_id: int) -> List[StorageLocation]:
        res = await self.session.execute(
            select(StorageLocation).filter(StorageLocation.warehouse_id == warehouse_id)
        )
        return list(res.scalars().all())


class InventoryPositionRepository(BaseRepository[InventoryPosition]):
    def __init__(self, session: AsyncSession):
        super().__init__(InventoryPosition, session)

    async def get_by_product_and_warehouse(
        self,
        product_reference: str,
        warehouse_id: int,
        storage_location_id: Optional[int] = None,
    ) -> Optional[InventoryPosition]:
        query = select(InventoryPosition).filter(
            InventoryPosition.product_reference == product_reference,
            InventoryPosition.warehouse_id == warehouse_id,
        )
        if storage_location_id is not None:
            query = query.filter(InventoryPosition.storage_location_id == storage_location_id)
        res = await self.session.execute(query)
        return res.scalars().first()

    async def get_positions_for_product(self, product_reference: str) -> List[InventoryPosition]:
        res = await self.session.execute(
            select(InventoryPosition)
            .filter(InventoryPosition.product_reference == product_reference)
            .order_by(InventoryPosition.warehouse_id)
        )
        return list(res.scalars().all())

    async def get_all_positions(
        self,
        warehouse_id: Optional[int] = None,
        product_reference: Optional[str] = None,
    ) -> List[InventoryPosition]:
        query = select(InventoryPosition).order_by(InventoryPosition.product_reference)
        if warehouse_id is not None:
            query = query.filter(InventoryPosition.warehouse_id == warehouse_id)
        if product_reference:
            query = query.filter(InventoryPosition.product_reference.ilike(f"%{product_reference}%"))
        res = await self.session.execute(query)
        return list(res.scalars().all())


class StockReservationRepository(BaseRepository[StockReservation]):
    def __init__(self, session: AsyncSession):
        super().__init__(StockReservation, session)

    async def get_active_by_product_and_source(
        self, product_reference: str, source_reference: str
    ) -> Optional[StockReservation]:
        query = select(StockReservation).filter(
            StockReservation.product_reference == product_reference,
            StockReservation.source_reference == source_reference,
            StockReservation.status == "ACTIVE",
        )
        res = await self.session.execute(query)
        return res.scalars().first()

    async def get_active_reservations_for_product(self, product_reference: str) -> List[StockReservation]:
        query = select(StockReservation).filter(
            StockReservation.product_reference == product_reference,
            StockReservation.status == "ACTIVE",
        )
        res = await self.session.execute(query)
        return list(res.scalars().all())


class GoodsMovementRepository(BaseRepository[GoodsMovement]):
    def __init__(self, session: AsyncSession):
        super().__init__(GoodsMovement, session)

    async def get_recent_movements(
        self,
        limit: int = 50,
        product_reference: Optional[str] = None,
        warehouse_id: Optional[int] = None,
    ) -> List[GoodsMovement]:
        query = select(GoodsMovement).order_by(desc(GoodsMovement.posted_at)).limit(limit)
        if product_reference:
            query = query.filter(GoodsMovement.product_reference == product_reference)
        if warehouse_id is not None:
            query = query.filter(
                (GoodsMovement.from_warehouse_id == warehouse_id) | (GoodsMovement.to_warehouse_id == warehouse_id)
            )
        res = await self.session.execute(query)
        return list(res.scalars().all())


class SupplierRepository(BaseRepository[Supplier]):
    def __init__(self, session: AsyncSession):
        super().__init__(Supplier, session)

    async def get_by_code(self, code: str) -> Optional[Supplier]:
        res = await self.session.execute(select(Supplier).filter(Supplier.supplier_code == code))
        return res.scalars().first()

    async def get_all_suppliers(self, status: Optional[str] = None) -> List[Supplier]:
        query = select(Supplier).order_by(Supplier.name)
        if status:
            query = query.filter(Supplier.status == status)
        res = await self.session.execute(query)
        return list(res.scalars().all())


class PurchaseRequisitionRepository(BaseRepository[PurchaseRequisition]):
    def __init__(self, session: AsyncSession):
        super().__init__(PurchaseRequisition, session)

    async def get_with_lines(self, requisition_id: int) -> Optional[PurchaseRequisition]:
        query = (
            select(PurchaseRequisition)
            .options(selectinload(PurchaseRequisition.lines))
            .filter(PurchaseRequisition.id == requisition_id)
        )
        res = await self.session.execute(query)
        return res.scalars().first()

    async def get_all_requisitions(self, status: Optional[str] = None) -> List[PurchaseRequisition]:
        query = select(PurchaseRequisition).options(selectinload(PurchaseRequisition.lines)).order_by(desc(PurchaseRequisition.created_at))
        if status:
            query = query.filter(PurchaseRequisition.status == status)
        res = await self.session.execute(query)
        return list(res.scalars().all())


class PurchaseOrderRepository(BaseRepository[PurchaseOrder]):
    def __init__(self, session: AsyncSession):
        super().__init__(PurchaseOrder, session)

    async def get_with_lines(self, po_id: int) -> Optional[PurchaseOrder]:
        query = (
            select(PurchaseOrder)
            .options(
                selectinload(PurchaseOrder.lines),
                selectinload(PurchaseOrder.supplier),
                selectinload(PurchaseOrder.warehouse),
            )
            .filter(PurchaseOrder.id == po_id)
        )
        res = await self.session.execute(query)
        return res.scalars().first()

    async def get_all_orders(
        self,
        supplier_id: Optional[int] = None,
        status: Optional[str] = None,
        warehouse_id: Optional[int] = None,
    ) -> List[PurchaseOrder]:
        query = (
            select(PurchaseOrder)
            .options(
                selectinload(PurchaseOrder.lines),
                selectinload(PurchaseOrder.supplier),
                selectinload(PurchaseOrder.warehouse),
            )
            .order_by(desc(PurchaseOrder.created_at))
        )
        if supplier_id is not None:
            query = query.filter(PurchaseOrder.supplier_id == supplier_id)
        if status:
            query = query.filter(PurchaseOrder.status == status)
        if warehouse_id is not None:
            query = query.filter(PurchaseOrder.warehouse_id == warehouse_id)
        res = await self.session.execute(query)
        return list(res.scalars().all())


class GoodsReceiptRepository(BaseRepository[GoodsReceipt]):
    def __init__(self, session: AsyncSession):
        super().__init__(GoodsReceipt, session)

    async def get_with_lines(self, receipt_id: int) -> Optional[GoodsReceipt]:
        query = (
            select(GoodsReceipt)
            .options(selectinload(GoodsReceipt.lines))
            .filter(GoodsReceipt.id == receipt_id)
        )
        res = await self.session.execute(query)
        return res.scalars().first()

    async def get_all_receipts(
        self,
        po_id: Optional[int] = None,
        warehouse_id: Optional[int] = None,
    ) -> List[GoodsReceipt]:
        query = (
            select(GoodsReceipt)
            .options(selectinload(GoodsReceipt.lines))
            .order_by(desc(GoodsReceipt.received_at))
        )
        if po_id is not None:
            query = query.filter(GoodsReceipt.purchase_order_id == po_id)
        if warehouse_id is not None:
            query = query.filter(GoodsReceipt.warehouse_id == warehouse_id)
        res = await self.session.execute(query)
        return list(res.scalars().all())


class StockTransferRepository(BaseRepository[StockTransfer]):
    def __init__(self, session: AsyncSession):
        super().__init__(StockTransfer, session)

    async def get_with_lines(self, transfer_id: int) -> Optional[StockTransfer]:
        query = (
            select(StockTransfer)
            .options(
                selectinload(StockTransfer.lines),
                selectinload(StockTransfer.from_warehouse),
                selectinload(StockTransfer.to_warehouse),
            )
            .filter(StockTransfer.id == transfer_id)
        )
        res = await self.session.execute(query)
        return res.scalars().first()

    async def get_all_transfers(self, status: Optional[str] = None) -> List[StockTransfer]:
        query = (
            select(StockTransfer)
            .options(
                selectinload(StockTransfer.lines),
                selectinload(StockTransfer.from_warehouse),
                selectinload(StockTransfer.to_warehouse),
            )
            .order_by(desc(StockTransfer.requested_at))
        )
        if status:
            query = query.filter(StockTransfer.status == status)
        res = await self.session.execute(query)
        return list(res.scalars().all())


class SupplierInvoiceRepository(BaseRepository[SupplierInvoice]):
    def __init__(self, session: AsyncSession):
        super().__init__(SupplierInvoice, session)

    async def get_with_details(self, invoice_id: int) -> Optional[SupplierInvoice]:
        query = (
            select(SupplierInvoice)
            .options(
                selectinload(SupplierInvoice.supplier),
                selectinload(SupplierInvoice.purchase_order),
            )
            .filter(SupplierInvoice.id == invoice_id)
        )
        res = await self.session.execute(query)
        return res.scalars().first()

    async def get_all_invoices(
        self,
        status: Optional[str] = None,
        supplier_id: Optional[int] = None,
    ) -> List[SupplierInvoice]:
        query = (
            select(SupplierInvoice)
            .options(
                selectinload(SupplierInvoice.supplier),
                selectinload(SupplierInvoice.purchase_order),
            )
            .order_by(desc(SupplierInvoice.created_at))
        )
        if status:
            query = query.filter(SupplierInvoice.status == status)
        if supplier_id is not None:
            query = query.filter(SupplierInvoice.supplier_id == supplier_id)
        res = await self.session.execute(query)
        return list(res.scalars().all())


class CostTransactionRepository(BaseRepository[CostTransaction]):
    def __init__(self, session: AsyncSession):
        super().__init__(CostTransaction, session)

    async def get_recent_transactions(self, limit: int = 100) -> List[CostTransaction]:
        query = select(CostTransaction).order_by(desc(CostTransaction.posted_at)).limit(limit)
        res = await self.session.execute(query)
        return list(res.scalars().all())
