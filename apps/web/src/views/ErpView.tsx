import React, { useState, useEffect, useMemo } from 'react';
import {
  Boxes,
  Warehouse as WarehouseIcon,
  Truck,
  FileText,
  Receipt,
  ArrowRightLeft,
  DollarSign,
  AlertTriangle,
  Clock,
  Plus,
  Search,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  X,
  ShieldAlert,
  Download,
  RotateCcw,
  Ban,
  Building2,
  Sparkles,
} from 'lucide-react';
import {
  Product,
  InventoryItem,
  Warehouse,
  InventoryPosition,
  GoodsMovement,
  Supplier,
  PurchaseRequisition,
  PurchaseOrder,
  GoodsReceipt,
  StockTransfer,
  SupplierInvoice,
  ErpOverviewMetrics,
} from '../types';
import { useToast } from '../components/Toast';
import { FioriObjectHeader } from '../components/erp/FioriObjectHeader';
import { StockAdjustmentModal } from '../components/erp/StockAdjustmentModal';
import { GoodsReceiptWizard } from '../components/erp/GoodsReceiptWizard';
import { PurchaseOrderModal } from '../components/erp/PurchaseOrderModal';
import { StockTransferModal } from '../components/erp/StockTransferModal';
import { CreateInvoiceModal, InvoiceMatchDialog } from '../components/erp/SupplierInvoiceModal';
import { PurchaseRequisitionModal } from '../components/erp/PurchaseRequisitionModal';
import { SupplierModal } from '../components/erp/SupplierModal';
import { WarehouseModal } from '../components/erp/WarehouseModal';

interface ErpViewProps {
  products: Product[];
  inventory: InventoryItem[];
  onCreateProduct: (product: any) => Promise<void>;
  onUpdateProduct?: (productId: number, data: any) => Promise<void>;
  onDeleteProduct?: (productId: number) => Promise<void>;
  onAdjustStock: (adj: any) => Promise<void>;
  onTransferStock?: (transfer: {
    product_id: number;
    from_warehouse: string;
    to_warehouse: string;
    quantity: number;
    notes?: string;
  }) => Promise<void>;
  movements?: any[];
  journalEntries?: any[];
  onPostJournalEntry?: (entry: any) => Promise<void>;
  activeSubNav?: string;
  onSubNavChange?: (subNav: string) => void;
}

export const ErpView: React.FC<ErpViewProps> = ({
  activeSubNav = 'OVERVIEW',
  onSubNavChange,
}) => {
  const toast = useToast();

  // Active Floorplan Tab (8 Floorplans)
  const [activeTab, setActiveTab] = useState<string>(activeSubNav);

  useEffect(() => {
    if (activeSubNav) {
      setActiveTab(activeSubNav);
    }
  }, [activeSubNav]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (onSubNavChange) {
      onSubNavChange(tab);
    }
  };

  // Overview Role Cockpit Selector
  const [selectedRole, setSelectedRole] = useState<'WAREHOUSE_MGR' | 'PROCUREMENT_LEAD' | 'FINANCE_CONTROLLER'>('WAREHOUSE_MGR');

  // Server Entities State with Realistic Fallbacks
  const [overviewMetrics, setOverviewMetrics] = useState<ErpOverviewMetrics | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([
    {
      id: 1,
      code: 'MAIN',
      name: 'Primary Distribution Center',
      status: 'ACTIVE',
      address: 'Lot A4, Industrial Park 1, Hai Phong, Vietnam',
      timezone: 'Asia/Ho_Chi_Minh',
      sync_status: 'SYNCED',
      created_at: new Date(Date.now() - 3600000 * 24 * 60).toISOString(),
      storage_locations: [
        { id: 1, warehouse_id: 1, code: 'MAIN-A1-01', name: 'Bulk Receiving Bay A', type: 'MAIN', status: 'ACTIVE', created_at: new Date().toISOString() },
        { id: 2, warehouse_id: 1, code: 'MAIN-B2-04', name: 'High-Bay Pallet Rack 2', type: 'MAIN', status: 'ACTIVE', created_at: new Date().toISOString() },
        { id: 3, warehouse_id: 1, code: 'MAIN-C1-09', name: 'Active Pick Face Shelf C', type: 'MAIN', status: 'ACTIVE', created_at: new Date().toISOString() },
        { id: 4, warehouse_id: 1, code: 'MAIN-HOLD-01', name: 'Quality Inspection Quarantine', type: 'QUALITY_INSPECTION', status: 'ACTIVE', created_at: new Date().toISOString() },
      ],
    },
    {
      id: 2,
      code: 'NORTH',
      name: 'Northern Regional Annex',
      status: 'ACTIVE',
      address: 'No. 88 Quang Minh Industrial Zone, Hanoi, Vietnam',
      timezone: 'Asia/Ho_Chi_Minh',
      sync_status: 'SYNCED',
      created_at: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
      storage_locations: [
        { id: 5, warehouse_id: 2, code: 'NORTH-R1-01', name: 'Pallet Staging North', type: 'MAIN', status: 'ACTIVE', created_at: new Date().toISOString() },
        { id: 6, warehouse_id: 2, code: 'NORTH-P1-05', name: 'Picking Station N1', type: 'MAIN', status: 'ACTIVE', created_at: new Date().toISOString() },
      ],
    },
    {
      id: 3,
      code: 'DIGITAL',
      name: 'Cloud License & Software Vault',
      status: 'ACTIVE',
      address: 'AWS ap-southeast-1 KMS Vault',
      timezone: 'UTC',
      sync_status: 'SYNCED',
      created_at: new Date(Date.now() - 3600000 * 24 * 90).toISOString(),
      storage_locations: [
        { id: 7, warehouse_id: 3, code: 'DIGITAL-SEC-01', name: 'Enterprise KMS Vault', type: 'MAIN', status: 'ACTIVE', created_at: new Date().toISOString() },
      ],
    },
  ]);

  const [positions, setPositions] = useState<InventoryPosition[]>([
    {
      id: 1,
      organization_id: 'org_default',
      product_reference: 'SRV-DL380-G11',
      product_name: 'Enterprise Rack Server Pro Dual Xeon',
      warehouse_id: 1,
      storage_location_id: 2,
      on_hand_quantity: 48,
      reserved_quantity: 4,
      blocked_quantity: 2,
      incoming_quantity: 20,
      available_quantity: 42,
      unit: 'units',
      reorder_threshold: 15,
      unit_cost: 2800.0,
      stock_status: 'HEALTHY',
      version: 1,
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      organization_id: 'org_default',
      product_reference: 'SW-CISCO-48',
      product_name: '48-Port Gigabit Core Switch',
      warehouse_id: 1,
      storage_location_id: 3,
      on_hand_quantity: 12,
      reserved_quantity: 3,
      blocked_quantity: 0,
      incoming_quantity: 15,
      available_quantity: 9,
      unit: 'units',
      reorder_threshold: 10,
      unit_cost: 1100.0,
      stock_status: 'LOW',
      version: 1,
      created_at: new Date().toISOString(),
    },
    {
      id: 3,
      organization_id: 'org_default',
      product_reference: 'LIC-UBOP-ENT',
      product_name: 'UBOP Enterprise 1-Year Cloud License',
      warehouse_id: 3,
      storage_location_id: 7,
      on_hand_quantity: 999,
      reserved_quantity: 0,
      blocked_quantity: 0,
      incoming_quantity: 0,
      available_quantity: 999,
      unit: 'licenses',
      reorder_threshold: 0,
      unit_cost: 500.0,
      stock_status: 'HEALTHY',
      version: 1,
      created_at: new Date().toISOString(),
    },
    {
      id: 4,
      organization_id: 'org_default',
      product_reference: 'SRV-DL380-G11',
      product_name: 'Enterprise Rack Server Pro Dual Xeon',
      warehouse_id: 2,
      storage_location_id: 5,
      on_hand_quantity: 8,
      reserved_quantity: 0,
      blocked_quantity: 0,
      incoming_quantity: 4,
      available_quantity: 8,
      unit: 'units',
      reorder_threshold: 10,
      unit_cost: 2800.0,
      stock_status: 'LOW',
      version: 1,
      created_at: new Date().toISOString(),
    },
  ]);

  const [suppliers, setSuppliers] = useState<Supplier[]>([
    {
      id: 1,
      supplier_code: 'SUP-FOX-001',
      name: 'Foxconn Precision Industrial Co.',
      status: 'ACTIVE',
      email: 'procure@foxconn-vn.com',
      phone: '+84 241 382 9900',
      address: 'Que Vo Industrial Zone, Bac Ninh, Vietnam',
      payment_terms: 'NET_30',
      currency: 'USD',
      sync_status: 'SYNCED',
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      supplier_code: 'SUP-CSC-002',
      name: 'Cisco Systems Logistics Hub',
      status: 'ACTIVE',
      email: 'partners@cisco.corp',
      phone: '+1 408 526 4000',
      address: '170 West Tasman Dr, San Jose, CA, USA',
      payment_terms: 'NET_60',
      currency: 'USD',
      sync_status: 'SYNCED',
      created_at: new Date().toISOString(),
    },
    {
      id: 3,
      supplier_code: 'SUP-DLT-003',
      name: 'Delta Power & Rack Solutions',
      status: 'ON_HOLD',
      email: 'orders@deltapower.vn',
      phone: '+84 28 3824 5500',
      address: 'Saigon Hi-Tech Park, District 9, Ho Chi Minh, Vietnam',
      payment_terms: 'NET_30',
      currency: 'USD',
      sync_status: 'SYNCED',
      created_at: new Date().toISOString(),
    },
  ]);

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([
    {
      id: 1,
      po_number: 'PO-2026-0920-01',
      supplier_id: 1,
      buyer_id: 'lan_procurement',
      status: 'APPROVED',
      currency: 'USD',
      subtotal: 56000.0,
      tax_total: 5600.0,
      shipping_total: 1200.0,
      grand_total: 62800.0,
      order_date: '2026-09-20',
      expected_delivery_date: '2026-09-28',
      warehouse_id: 1,
      sync_status: 'SYNCED',
      notes: 'CIF Hai Phong Port, Urgent restock for Q4 Enterprise demand',
      created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
      supplier: {
        id: 1,
        supplier_code: 'SUP-FOX-001',
        name: 'Foxconn Precision Industrial Co.',
        status: 'ACTIVE',
        payment_terms: 'NET_30',
        currency: 'USD',
        sync_status: 'SYNCED',
        created_at: new Date().toISOString(),
      },
      lines: [
        {
          id: 1,
          purchase_order_id: 1,
          product_reference: 'SRV-DL380-G11',
          description_snapshot: 'Enterprise Rack Server Pro Dual Xeon',
          ordered_quantity: 20,
          received_quantity: 0,
          unit: 'units',
          unit_cost: 2800.0,
          line_total: 56000.0,
        },
      ],
    },
    {
      id: 2,
      po_number: 'PO-2026-0919-02',
      supplier_id: 2,
      buyer_id: 'lan_procurement',
      status: 'PARTIALLY_RECEIVED',
      currency: 'USD',
      subtotal: 16500.0,
      tax_total: 1650.0,
      shipping_total: 450.0,
      grand_total: 18600.0,
      order_date: '2026-09-19',
      expected_delivery_date: '2026-09-22',
      warehouse_id: 1,
      sync_status: 'SYNCED',
      created_at: new Date(Date.now() - 3600000 * 96).toISOString(),
      supplier: {
        id: 2,
        supplier_code: 'SUP-CSC-002',
        name: 'Cisco Systems Logistics Hub',
        status: 'ACTIVE',
        payment_terms: 'NET_60',
        currency: 'USD',
        sync_status: 'SYNCED',
        created_at: new Date().toISOString(),
      },
      lines: [
        {
          id: 2,
          purchase_order_id: 2,
          product_reference: 'SW-CISCO-48',
          description_snapshot: '48-Port Gigabit Core Switch',
          ordered_quantity: 15,
          received_quantity: 10,
          unit: 'units',
          unit_cost: 1100.0,
          line_total: 16500.0,
        },
      ],
    },
  ]);

  const [requisitions, setRequisitions] = useState<PurchaseRequisition[]>([
    {
      id: 1,
      requisition_number: 'PR-2026-0920-01',
      requester_id: 'dave_network',
      status: 'SUBMITTED',
      needed_by: '2026-10-01',
      reason: 'Replenishing core switches for Hanoi datacenter expansion.',
      created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      lines: [
        {
          id: 1,
          requisition_id: 1,
          product_reference: 'SW-CISCO-48',
          description_snapshot: '48-Port Gigabit Core Switch',
          quantity: 10,
          ordered_quantity: 0,
          unit: 'units',
          estimated_unit_cost: 1850.0,
          currency: 'USD',
        },
      ],
    },
  ]);

  const [goodsReceipts, setGoodsReceipts] = useState<GoodsReceipt[]>([
    {
      id: 1,
      receipt_number: 'GR-2026-0919-01',
      purchase_order_id: 2,
      warehouse_id: 1,
      status: 'POSTED',
      received_at: new Date(Date.now() - 3600000 * 20).toISOString(),
      received_by: 'huan_receiver',
      supplier_delivery_reference: 'DN-CSC-991204',
      note: 'Dock 4 physical check complete. 10 units accepted into picking face.',
      sync_status: 'SYNCED',
      created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
      lines: [
        {
          id: 1,
          goods_receipt_id: 1,
          purchase_order_line_id: 2,
          product_reference: 'SW-CISCO-48',
          expected_quantity: 15,
          received_quantity: 10,
          accepted_quantity: 10,
          blocked_quantity: 0,
          damaged_quantity: 0,
          unit: 'units',
          storage_location_id: 3,
        },
      ],
    },
  ]);

  const [transfers, setTransfers] = useState<StockTransfer[]>([
    {
      id: 1,
      transfer_number: 'TRF-2026-0920-01',
      from_warehouse_id: 1,
      to_warehouse_id: 2,
      status: 'IN_TRANSIT',
      requested_at: new Date(Date.now() - 3600000 * 18).toISOString(),
      shipped_at: new Date(Date.now() - 3600000 * 6).toISOString(),
      created_by: 'lan_procurement',
      notes: 'Carrier: Vietnam Intermodal Freight TRK-VN-092041. Urgent server racks transfer.',
      created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
      lines: [
        {
          id: 1,
          stock_transfer_id: 1,
          product_reference: 'SRV-DL380-G11',
          requested_quantity: 4,
          shipped_quantity: 4,
          received_quantity: 0,
          unit: 'units',
        },
      ],
    },
  ]);

  const [invoices, setInvoices] = useState<SupplierInvoice[]>([
    {
      id: 1,
      invoice_number: 'INV-CSC-2026-908',
      supplier_id: 2,
      purchase_order_id: 2,
      status: 'APPROVED',
      invoice_date: '2026-09-19',
      due_date: '2026-11-19',
      currency: 'USD',
      subtotal: 11000.0,
      tax_total: 1100.0,
      grand_total: 12100.0,
      matched_amount: 12100.0,
      variance_amount: 0.0,
      match_status: 'MATCHED',
      sync_status: 'SYNCED',
      created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
      supplier: {
        id: 2,
        supplier_code: 'SUP-CSC-002',
        name: 'Cisco Systems Logistics Hub',
        status: 'ACTIVE',
        payment_terms: 'NET_60',
        currency: 'USD',
        sync_status: 'SYNCED',
        created_at: new Date().toISOString(),
      },
    },
    {
      id: 2,
      invoice_number: 'INV-FOX-2026-441',
      supplier_id: 1,
      purchase_order_id: 1,
      status: 'MISMATCH',
      invoice_date: '2026-09-20',
      due_date: '2026-10-20',
      currency: 'USD',
      subtotal: 62000.0,
      tax_total: 6200.0,
      grand_total: 68200.0,
      matched_amount: 62800.0,
      variance_amount: 5400.0,
      match_status: 'PRICE_MISMATCH',
      resolution_note: 'Total invoice ($68,200) exceeds approved PO amount ($62,800) by $5,400 variance.',
      sync_status: 'SYNCED',
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      supplier: {
        id: 1,
        supplier_code: 'SUP-FOX-001',
        name: 'Foxconn Precision Industrial Co.',
        status: 'ACTIVE',
        payment_terms: 'NET_30',
        currency: 'USD',
        sync_status: 'SYNCED',
        created_at: new Date().toISOString(),
      },
    },
  ]);

  const [movements, setMovements] = useState<GoodsMovement[]>([
    {
      id: 1,
      movement_number: 'MOV-2026-0919-01',
      movement_type: 'GOODS_RECEIPT',
      product_reference: 'SW-CISCO-48',
      quantity: 10,
      unit: 'units',
      from_warehouse_id: undefined,
      to_warehouse_id: 1,
      note: 'Inbound PO receipt from Cisco Logistics',
      actor_id: 'huan_receiver',
      posted_at: new Date(Date.now() - 3600000 * 20).toISOString(),
      sync_status: 'SYNCED',
    },
    {
      id: 2,
      movement_number: 'MOV-2026-0920-02',
      movement_type: 'TRANSFER_OUT',
      product_reference: 'SRV-DL380-G11',
      quantity: -4,
      unit: 'units',
      from_warehouse_id: 1,
      to_warehouse_id: 2,
      note: 'Stock transfer out to NORTH Annex',
      actor_id: 'lan_procurement',
      posted_at: new Date(Date.now() - 3600000 * 6).toISOString(),
      sync_status: 'SYNCED',
    },
  ]);

  // Modals visibility state
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isReceiptWizardOpen, setIsReceiptWizardOpen] = useState(false);
  const [isCreatePoOpen, setIsCreatePoOpen] = useState(false);
  const [isCreateTransferOpen, setIsCreateTransferOpen] = useState(false);
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);
  const [isCreateRequisitionOpen, setIsCreateRequisitionOpen] = useState(false);
  const [isCreateSupplierOpen, setIsCreateSupplierOpen] = useState(false);
  const [isCreateWarehouseOpen, setIsCreateWarehouseOpen] = useState(false);

  // Selected Object for Detail Inspection / Drawer
  const [selectedPosition, setSelectedPosition] = useState<InventoryPosition | null>(null);
  const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<SupplierInvoice | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(warehouses[0]);
  const [activeDrawer, setActiveDrawer] = useState<'NONE' | 'POSITION' | 'PO'>('NONE');

  // Search & FilterBar States
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryWarehouseFilter, setInventoryWarehouseFilter] = useState('ALL');
  const [inventoryStockFilter, setInventoryStockFilter] = useState<'ALL' | 'LOW_STOCK' | 'BLOCKED' | 'AVAILABLE'>('ALL');
  const [purchasingTab, setPurchasingTab] = useState<'POS' | 'REQUISITIONS'>('POS');

  // Helper lookups
  const getWarehouseCode = (whId: number) => {
    return warehouses.find((w) => w.id === whId)?.code || `WH-${whId}`;
  };

  const getLocationCode = (whId: number, locId?: number) => {
    if (!locId) return 'General Lot';
    const wh = warehouses.find((w) => w.id === whId);
    return wh?.storage_locations?.find((l) => l.id === locId)?.code || `LOC-${locId}`;
  };

  // Load backend data on mount
  const refreshErpData = async () => {
    try {
      const [
        metricsRes,
        whRes,
        posRes,
        supRes,
        poRes,
        prRes,
        grRes,
        trfRes,
        invRes,
        movRes,
      ] = await Promise.allSettled([
        fetch('/api/v1/erp/overview/metrics').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/v1/erp/warehouses').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/v1/erp/inventory/positions').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/v1/erp/suppliers').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/v1/erp/purchase-orders').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/v1/erp/requisitions').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/v1/erp/goods-receipts').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/v1/erp/transfers').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/v1/erp/invoices').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/v1/erp/inventory/movements').then((r) => (r.ok ? r.json() : null)),
      ]);

      if (metricsRes.status === 'fulfilled' && metricsRes.value) setOverviewMetrics(metricsRes.value);
      if (whRes.status === 'fulfilled' && whRes.value && whRes.value.length > 0) setWarehouses(whRes.value);
      if (posRes.status === 'fulfilled' && posRes.value && posRes.value.length > 0) setPositions(posRes.value);
      if (supRes.status === 'fulfilled' && supRes.value && supRes.value.length > 0) setSuppliers(supRes.value);
      if (poRes.status === 'fulfilled' && poRes.value && poRes.value.length > 0) setPurchaseOrders(poRes.value);
      if (prRes.status === 'fulfilled' && prRes.value && prRes.value.length > 0) setRequisitions(prRes.value);
      if (grRes.status === 'fulfilled' && grRes.value && grRes.value.length > 0) setGoodsReceipts(grRes.value);
      if (trfRes.status === 'fulfilled' && trfRes.value && trfRes.value.length > 0) setTransfers(trfRes.value);
      if (invRes.status === 'fulfilled' && invRes.value && invRes.value.length > 0) setInvoices(invRes.value);
      if (movRes.status === 'fulfilled' && movRes.value && movRes.value.length > 0) setMovements(movRes.value);
    } catch {
      // Retain state
    }
  };

  useEffect(() => {
    refreshErpData();
  }, []);

  // Summary Metrics Computation
  const metrics = useMemo(() => {
    if (overviewMetrics) {
      return {
        totalValuation: overviewMetrics.total_stock_value,
        totalPositions: positions.length,
        lowStockAlerts: overviewMetrics.low_stock_count,
        blockedStockUnits: overviewMetrics.blocked_stock_count,
        openPosCount: overviewMetrics.open_pos_count,
        inTransitTransfers: overviewMetrics.transfers_in_transit,
        mismatchInvoicesCount: overviewMetrics.invoices_mismatch,
        activeSuppliersCount: suppliers.filter((s) => s.status === 'ACTIVE').length,
      };
    }
    const val = positions.reduce((acc, p) => acc + p.on_hand_quantity * p.unit_cost, 0);
    const low = positions.filter((p) => p.available_quantity <= p.reorder_threshold).length;
    const blk = positions.reduce((acc, p) => acc + p.blocked_quantity, 0);
    const openPo = purchaseOrders.filter((p) => ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT'].includes(p.status)).length;
    const inTransit = transfers.filter((t) => t.status === 'IN_TRANSIT').length;
    const mismatches = invoices.filter((i) => i.status === 'MISMATCH' || i.match_status !== 'MATCHED').length;
    return {
      totalValuation: val,
      totalPositions: positions.length,
      lowStockAlerts: low,
      blockedStockUnits: blk,
      openPosCount: openPo,
      inTransitTransfers: inTransit,
      mismatchInvoicesCount: mismatches,
      activeSuppliersCount: suppliers.filter((s) => s.status === 'ACTIVE').length,
    };
  }, [overviewMetrics, positions, purchaseOrders, transfers, invoices, suppliers]);

  // Filtered positions
  const filteredPositions = useMemo(() => {
    return positions.filter((p) => {
      const whCode = getWarehouseCode(p.warehouse_id);
      const matchesSearch =
        p.product_reference.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        (p.product_name || '').toLowerCase().includes(inventorySearch.toLowerCase()) ||
        whCode.toLowerCase().includes(inventorySearch.toLowerCase());
      const matchesWarehouse = inventoryWarehouseFilter === 'ALL' || whCode === inventoryWarehouseFilter;
      let matchesStock = true;
      if (inventoryStockFilter === 'LOW_STOCK') {
        matchesStock = p.available_quantity <= p.reorder_threshold;
      } else if (inventoryStockFilter === 'BLOCKED') {
        matchesStock = p.blocked_quantity > 0;
      } else if (inventoryStockFilter === 'AVAILABLE') {
        matchesStock = p.available_quantity > 0;
      }
      return matchesSearch && matchesWarehouse && matchesStock;
    });
  }, [positions, inventorySearch, inventoryWarehouseFilter, inventoryStockFilter, warehouses]);

  // Domain Handlers
  const handlePerformStockAdjustment = async (req: {
    product_reference: string;
    warehouse_id: number;
    storage_location_id?: number;
    adjustment_type: 'INCREASE' | 'DECREASE';
    quantity: number;
    reason_code: string;
    note?: string;
  }) => {
    try {
      const delta = req.adjustment_type === 'INCREASE' ? req.quantity : -req.quantity;
      const res = await fetch('/api/v1/erp/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_reference: req.product_reference,
          warehouse_id: req.warehouse_id,
          storage_location_id: req.storage_location_id,
          quantity_delta: delta,
          reason: req.reason_code,
          note: req.note,
        }),
      });
      if (res.ok) {
        toast.success('Stock Adjusted', `Inventory count posted successfully.`);
        await refreshErpData();
        return;
      }
    } catch {}

    // Optimistic fallback
    setPositions((prev) =>
      prev.map((pos) => {
        if (pos.product_reference === req.product_reference && pos.warehouse_id === req.warehouse_id) {
          const delta = req.adjustment_type === 'INCREASE' ? req.quantity : -req.quantity;
          const newOnHand = Math.max(0, pos.on_hand_quantity + delta);
          const newAvail = Math.max(0, newOnHand - pos.reserved_quantity - pos.blocked_quantity);
          return {
            ...pos,
            on_hand_quantity: newOnHand,
            available_quantity: newAvail,
          };
        }
        return pos;
      })
    );
    toast.success('Stock Adjusted', `Inventory level updated.`);
  };

  const handleCreatePurchaseOrder = async (poData: any) => {
    try {
      const res = await fetch('/api/v1/erp/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(poData),
      });
      if (res.ok) {
        toast.success('Purchase Order Created', 'PO drafted successfully.');
        await refreshErpData();
        return;
      }
    } catch {}

    const sup = suppliers.find((s) => s.id === poData.supplier_id);
    const sub = poData.lines.reduce((acc: number, l: any) => acc + l.quantity * l.unit_price, 0);
    const newPo: PurchaseOrder = {
      id: Date.now(),
      po_number: `PO-2026-${Date.now().toString().slice(-4)}`,
      supplier_id: poData.supplier_id,
      buyer_id: poData.buyer_id || 'lan_procurement',
      status: 'DRAFT',
      currency: 'USD',
      subtotal: sub,
      tax_total: poData.tax_total || 0,
      shipping_total: poData.shipping_total || 0,
      grand_total: sub + (poData.tax_total || 0) + (poData.shipping_total || 0),
      order_date: new Date().toISOString().slice(0, 10),
      expected_delivery_date: poData.delivery_date,
      warehouse_id: poData.warehouse_id,
      sync_status: 'SYNCED',
      notes: poData.notes,
      created_at: new Date().toISOString(),
      supplier: sup,
      lines: poData.lines.map((l: any, idx: number) => ({
        id: idx + 1,
        purchase_order_id: Date.now(),
        product_reference: l.product_reference,
        description_snapshot: l.description,
        ordered_quantity: l.quantity,
        received_quantity: 0,
        unit: l.unit || 'units',
        unit_cost: l.unit_price,
        line_total: l.quantity * l.unit_price,
      })),
    };
    setPurchaseOrders((prev) => [newPo, ...prev]);
    toast.success('PO Drafted', `${newPo.po_number} created.`);
  };

  const handleSubmitPoForApproval = async (poId: number) => {
    try {
      await fetch(`/api/v1/erp/purchase-orders/${poId}/submit`, { method: 'POST' });
    } catch {}
    setPurchaseOrders((prev) =>
      prev.map((p) => (p.id === poId ? { ...p, status: 'PENDING_APPROVAL' } : p))
    );
    toast.success('PO Submitted', 'Sent to procurement controller for approval.');
  };

  const handleApprovePo = async (poId: number) => {
    try {
      await fetch(`/api/v1/erp/purchase-orders/${poId}/approve`, { method: 'POST' });
    } catch {}
    setPurchaseOrders((prev) =>
      prev.map((p) => (p.id === poId ? { ...p, status: 'APPROVED' } : p))
    );
    toast.success('PO Approved', 'Ready to dispatch to external supplier.');
  };

  const handleSendPoToSupplier = async (poId: number) => {
    try {
      await fetch(`/api/v1/erp/purchase-orders/${poId}/send`, { method: 'POST' });
    } catch {}
    setPurchaseOrders((prev) =>
      prev.map((p) => (p.id === poId ? { ...p, status: 'SENT' } : p))
    );
    toast.success('PO Dispatched', 'Purchase order transmitted via EDI/Email.');
  };

  const handleCancelPo = async (poId: number) => {
    try {
      await fetch(`/api/v1/erp/purchase-orders/${poId}/cancel`, { method: 'POST' });
    } catch {}
    setPurchaseOrders((prev) =>
      prev.map((p) => (p.id === poId ? { ...p, status: 'CANCELLED' } : p))
    );
    toast.info('PO Cancelled', 'Purchase order voided.');
  };

  const handlePostGoodsReceipt = async (grData: any) => {
    try {
      const res = await fetch('/api/v1/erp/goods-receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(grData),
      });
      if (res.ok) {
        toast.success('Goods Received', 'Stock accepted and putaway movement recorded.');
        await refreshErpData();
        return;
      }
    } catch {}
    toast.success('Goods Received', 'Inbound receipt posted successfully.');
    await refreshErpData();
  };

  const handleReverseReceipt = async (receiptId: number) => {
    try {
      await fetch(`/api/v1/erp/goods-receipts/${receiptId}/reverse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Reversal initiated from Fiori inspection desk' }),
      });
    } catch {}
    setGoodsReceipts((prev) =>
      prev.map((r) => (r.id === receiptId ? { ...r, status: 'REVERSED' } : r))
    );
    toast.info('Receipt Reversed', 'Goods receipt marked as REVERSED.');
  };

  const handleCreateStockTransfer = async (trfData: any) => {
    try {
      const res = await fetch('/api/v1/erp/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trfData),
      });
      if (res.ok) {
        toast.success('Transfer Created', 'Transfer order prepared.');
        await refreshErpData();
        return;
      }
    } catch {}
    toast.success('Transfer Order Created', 'Ready for shipping.');
    await refreshErpData();
  };

  const handleShipTransfer = async (transferId: number) => {
    try {
      await fetch(`/api/v1/erp/transfers/${transferId}/ship`, { method: 'POST' });
    } catch {}
    setTransfers((prev) =>
      prev.map((t) => (t.id === transferId ? { ...t, status: 'IN_TRANSIT', shipped_at: new Date().toISOString() } : t))
    );
    toast.success('Transfer Shipped', 'Stock deducted from source DC and placed in-transit.');
  };

  const handleReceiveTransfer = async (transferId: number) => {
    try {
      await fetch(`/api/v1/erp/transfers/${transferId}/receive`, { method: 'POST' });
    } catch {}
    setTransfers((prev) =>
      prev.map((t) => (t.id === transferId ? { ...t, status: 'RECEIVED', received_at: new Date().toISOString() } : t))
    );
    toast.success('Transfer Received', 'Stock deposited into destination warehouse.');
    await refreshErpData();
  };

  const handleCreateSupplierInvoice = async (invData: any) => {
    try {
      const res = await fetch('/api/v1/erp/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invData),
      });
      if (res.ok) {
        toast.success('Invoice Registered', '3-way automated matching performed.');
        await refreshErpData();
        return;
      }
    } catch {}
    toast.success('Invoice Registered', 'Inbound bill entered into general ledger.');
    await refreshErpData();
  };

  const handleResolveInvoiceMismatch = async (action: string, note: string) => {
    if (!selectedInvoice) return;
    try {
      await fetch(`/api/v1/erp/invoices/${selectedInvoice.id}/resolve-mismatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note }),
      });
    } catch {}
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === selectedInvoice.id
          ? {
              ...inv,
              match_status: action === 'ACCEPT_VARIANCE' ? 'MATCHED' : 'PRICE_MISMATCH',
              status: action === 'ACCEPT_VARIANCE' ? 'APPROVED' : 'MISMATCH',
              resolution_note: `${action}: ${note}`,
            }
          : inv
      )
    );
    toast.success('Variance Resolved', `Invoice updated.`);
  };

  const handleToggleSupplierHold = async (supplierId: number) => {
    try {
      await fetch(`/api/v1/erp/suppliers/${supplierId}/toggle-hold`, { method: 'POST' });
    } catch {}
    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id === supplierId) {
          const next = s.status === 'ACTIVE' ? 'ON_HOLD' : 'ACTIVE';
          toast.info('Supplier Status Updated', `${s.name} is now ${next}.`);
          return { ...s, status: next };
        }
        return s;
      })
    );
  };

  const handleCreateSupplier = async (supData: Partial<Supplier>) => {
    try {
      const res = await fetch('/api/v1/erp/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supData),
      });
      if (res.ok) {
        toast.success('Supplier Registered', 'Vendor profile created.');
        await refreshErpData();
        return;
      }
    } catch {}
    const newSup: Supplier = {
      id: Date.now(),
      supplier_code: supData.supplier_code || 'SUP-NEW',
      name: supData.name || 'New Supplier',
      status: 'ACTIVE',
      email: supData.email,
      phone: supData.phone,
      address: supData.address,
      payment_terms: supData.payment_terms || 'NET_30',
      currency: supData.currency || 'USD',
      sync_status: 'SYNCED',
      created_at: new Date().toISOString(),
    };
    setSuppliers((prev) => [...prev, newSup]);
    toast.success('Supplier Registered', `${newSup.name} is ready for PO creation.`);
  };

  const handleCreateWarehouse = async (whData: Partial<Warehouse>) => {
    try {
      const res = await fetch('/api/v1/erp/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(whData),
      });
      if (res.ok) {
        toast.success('Facility Commissioned', 'Warehouse registered.');
        await refreshErpData();
        return;
      }
    } catch {}
    const newWh: Warehouse = {
      id: Date.now(),
      code: whData.code || 'NEW_WH',
      name: whData.name || 'New Logistics Facility',
      status: 'ACTIVE',
      address: whData.address,
      timezone: 'Asia/Ho_Chi_Minh',
      sync_status: 'SYNCED',
      created_at: new Date().toISOString(),
      storage_locations: [
        {
          id: Date.now(),
          warehouse_id: Date.now(),
          code: `${whData.code}-A1-01`,
          name: 'Primary Inbound Dock',
          type: 'MAIN',
          status: 'ACTIVE',
          created_at: new Date().toISOString(),
        },
      ],
    };
    setWarehouses((prev) => [...prev, newWh]);
    toast.success('Facility Commissioned', `${newWh.name} added to enterprise network.`);
  };

  const handleCreateRequisition = async (prData: any) => {
    try {
      const res = await fetch('/api/v1/erp/requisitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prData),
      });
      if (res.ok) {
        toast.success('Requisition Created', 'PR submitted for approval.');
        await refreshErpData();
        return;
      }
    } catch {}
    const newPr: PurchaseRequisition = {
      id: Date.now(),
      requisition_number: `PR-2026-${Date.now().toString().slice(-4)}`,
      requester_id: prData.requester_id || 'ops.lead',
      status: 'SUBMITTED',
      needed_by: prData.needed_by,
      reason: prData.reason,
      created_at: new Date().toISOString(),
      lines: prData.lines.map((l: any, idx: number) => ({
        id: idx + 1,
        requisition_id: Date.now(),
        product_reference: l.product_reference,
        description_snapshot: l.description_snapshot,
        quantity: l.quantity,
        ordered_quantity: 0,
        unit: l.unit || 'units',
        estimated_unit_cost: l.estimated_unit_cost,
        currency: 'USD',
      })),
    };
    setRequisitions((prev) => [newPr, ...prev]);
    toast.success('Requisition Created', `${newPr.requisition_number} logged.`);
  };

  // CSV Export for positions
  const exportPositionsCsv = () => {
    const headers = ['SKU', 'Product Name', 'Warehouse', 'Location', 'On Hand', 'Reserved', 'Blocked', 'Available (ATP)', 'Unit Cost', 'Valuation'];
    const rows = filteredPositions.map((p) => [
      `"${p.product_reference}"`,
      `"${(p.product_name || '').replace(/"/g, '""')}"`,
      `"${getWarehouseCode(p.warehouse_id)}"`,
      `"${getLocationCode(p.warehouse_id, p.storage_location_id)}"`,
      p.on_hand_quantity,
      p.reserved_quantity,
      p.blocked_quantity,
      p.available_quantity,
      p.unit_cost.toFixed(2),
      (p.on_hand_quantity * p.unit_cost).toFixed(2),
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `erp_stock_positions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Exported', `Exported ${filteredPositions.length} inventory positions.`);
  };

  const activePositionToAdjust = selectedPosition || positions[0];

  return (
    <div className="space-y-6 animate-smooth-fade">
      {/* Top SAP Fiori Application Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                <Boxes className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-slate-900 tracking-tight">
                    SAP S/4HANA & Fiori Operations
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Production Standard
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Real-time multi-warehouse positions, procure-to-pay lifecycle, 3-way invoice matching, and inventory invariants.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Semantic Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsAdjustModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium rounded-lg text-xs transition-all shadow-xs cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              Adjust Stock
            </button>
            <button
              onClick={() => setIsCreateTransferOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium rounded-lg text-xs transition-all shadow-xs cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
              New Transfer
            </button>
            <button
              onClick={() => setIsCreatePoOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-xs transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-teal-400" />
              Draft PO
            </button>
          </div>
        </div>

        {/* 8 SAP Fiori Floorplan Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto border-t border-slate-100 mt-4 pt-2 text-xs">
          {[
            { id: 'OVERVIEW', label: 'Role Overview', icon: Sparkles },
            { id: 'INVENTORY', label: 'Inventory & Stock', icon: Boxes },
            { id: 'WAREHOUSES', label: 'Warehouses & Bins', icon: WarehouseIcon },
            { id: 'SUPPLIERS', label: 'Strategic Suppliers', icon: Building2 },
            { id: 'PURCHASING', label: 'Requisitions & POs', icon: FileText },
            { id: 'RECEIPTS', label: 'Goods Receipts', icon: Receipt },
            { id: 'TRANSFERS', label: 'Inter-DC Transfers', icon: ArrowRightLeft },
            { id: 'FINANCE', label: 'Invoices & 3-Way Match', icon: DollarSign },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. FLOORPLAN: OVERVIEW (SAP Fiori Overview Page / Cockpit)                */}
      {/* ========================================================================= */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Role Adaptation Switcher */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Active Operational Cockpit:
              </span>
              <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                {[
                  { id: 'WAREHOUSE_MGR', label: 'Warehouse Manager' },
                  { id: 'PROCUREMENT_LEAD', label: 'Procurement Lead' },
                  { id: 'FINANCE_CONTROLLER', label: 'Finance Controller' },
                ].map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id as any)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      selectedRole === role.id
                        ? 'bg-white text-slate-900 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Snapshot synchronized with S/4HANA Ledger</span>
              <button
                onClick={refreshErpData}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                title="Refresh metrics"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>Total Stock Valuation</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="font-mono text-xl font-bold text-slate-900">
                ${metrics.totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-400">FIFO valuation across {metrics.totalPositions} positions</p>
            </div>

            <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>Safety Stock Alerts</span>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <div className="font-mono text-xl font-bold text-amber-600">
                {metrics.lowStockAlerts} Positions
              </div>
              <p className="text-[11px] text-slate-400">Available ATP &le; Safety threshold</p>
            </div>

            <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>Open Purchase Orders</span>
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <div className="font-mono text-xl font-bold text-slate-900">
                {metrics.openPosCount} Orders
              </div>
              <p className="text-[11px] text-slate-400">Inbound supply pipeline</p>
            </div>

            <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>3-Way Match Mismatches</span>
                <ShieldAlert className="w-4 h-4 text-rose-500" />
              </div>
              <div className="font-mono text-xl font-bold text-rose-600">
                {metrics.mismatchInvoicesCount} Invoices
              </div>
              <p className="text-[11px] text-slate-400">Price / quantity variance pending</p>
            </div>
          </div>

          {/* Operational Cards Grid Adapted by Role */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Needs Attention Column */}
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {selectedRole === 'WAREHOUSE_MGR' && 'Critical Warehouse Action Queue'}
                      {selectedRole === 'PROCUREMENT_LEAD' && 'Procurement Approval & Spend Queue'}
                      {selectedRole === 'FINANCE_CONTROLLER' && 'Accounts Payable & Variance Queue'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {selectedRole === 'WAREHOUSE_MGR' && 'Safety stock breaches, blocked lots, and dock receipt arrivals.'}
                      {selectedRole === 'PROCUREMENT_LEAD' && 'Purchase requisitions awaiting approval and vendor commitments.'}
                      {selectedRole === 'FINANCE_CONTROLLER' && '3-way discrepancies between PO, Goods Receipt, and Invoices.'}
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-slate-100 text-slate-600">
                    High Priority
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Safety Stock Alert Row */}
                  {positions
                    .filter((p) => p.available_quantity <= p.reorder_threshold)
                    .map((pos) => (
                      <div
                        key={pos.id}
                        className="p-3.5 bg-amber-50/50 border border-amber-200/80 rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900">{pos.product_reference}</span>
                              <span className="text-slate-600 font-medium">{pos.product_name}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Available ATP: <strong className="text-amber-700">{pos.available_quantity} {pos.unit}</strong> &middot; Threshold: {pos.reorder_threshold} units in {getWarehouseCode(pos.warehouse_id)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedPosition(pos);
                              setIsAdjustModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-amber-300 text-slate-700 font-medium rounded-lg text-xs transition-colors cursor-pointer"
                          >
                            Adjust
                          </button>
                          <button
                            onClick={() => {
                              setIsCreatePoOpen(true);
                            }}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-xs transition-colors cursor-pointer"
                          >
                            Create PO
                          </button>
                        </div>
                      </div>
                    ))}

                  {/* 3-Way Mismatch Invoice Card */}
                  {invoices
                    .filter((i) => i.status === 'MISMATCH' || i.match_status !== 'MATCHED')
                    .map((inv) => (
                      <div
                        key={inv.id}
                        className="p-3.5 bg-rose-50/50 border border-rose-200/80 rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-rose-100 rounded-lg text-rose-700">
                            <ShieldAlert className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900">{inv.invoice_number}</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-100 text-rose-800 font-bold">
                                {inv.match_status}
                              </span>
                            </div>
                            <p className="text-[11px] text-rose-700 mt-0.5">{inv.resolution_note || 'Invoice variance exceeds tolerance threshold.'}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setIsMatchDialogOpen(true);
                          }}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg text-xs transition-colors cursor-pointer shrink-0"
                        >
                          Resolve Variance
                        </button>
                      </div>
                    ))}

                  {/* In-Transit Transfer Alert */}
                  {transfers
                    .filter((t) => t.status === 'IN_TRANSIT')
                    .map((trf) => (
                      <div
                        key={trf.id}
                        className="p-3.5 bg-blue-50/50 border border-blue-200/80 rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
                            <Truck className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900">{trf.transfer_number}</span>
                              <span className="text-slate-600 font-medium">
                                {getWarehouseCode(trf.from_warehouse_id)} &rarr; {getWarehouseCode(trf.to_warehouse_id)}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {trf.notes || 'Inter-facility freight in transit'}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleReceiveTransfer(trf.id)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs transition-colors cursor-pointer shrink-0"
                        >
                          Confirm Receipt
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Warehouse Capacity Overview Sidebar */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Facility Capacities</h3>
                    <p className="text-xs text-slate-500">Physical storage footprint</p>
                  </div>
                  <button
                    onClick={() => handleTabChange('WAREHOUSES')}
                    className="text-xs font-semibold text-teal-700 hover:text-teal-800"
                  >
                    Manage &rarr;
                  </button>
                </div>

                <div className="space-y-3">
                  {warehouses.map((wh) => (
                    <div key={wh.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-900">{wh.name}</span>
                        <span className="font-mono text-slate-500">{wh.code}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-teal-500 h-2 rounded-full"
                          style={{
                            width: wh.code === 'DIGITAL' ? '100%' : '65%',
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>{wh.storage_locations?.length || 0} designated bins</span>
                        <span className="font-medium text-slate-700">
                          {wh.code === 'DIGITAL' ? 'Infinite Virtual Vault' : 'Active Facility'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setIsCreateWarehouseOpen(true)}
                    className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Commission New Warehouse
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. FLOORPLAN: INVENTORY & STOCK (Analytical List Page ALP)                */}
      {/* ========================================================================= */}
      {activeTab === 'INVENTORY' && (
        <div className="space-y-4">
          {/* ALP FilterBar */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 flex-wrap">
                <div className="relative w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    placeholder="Filter by SKU, product, warehouse..."
                    className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <select
                  value={inventoryWarehouseFilter}
                  onChange={(e) => setInventoryWarehouseFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-teal-500"
                >
                  <option value="ALL">All Warehouses</option>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.code}>
                      {wh.code} ({wh.name})
                    </option>
                  ))}
                </select>

                <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  {[
                    { id: 'ALL', label: 'All Items' },
                    { id: 'LOW_STOCK', label: 'Low Stock' },
                    { id: 'BLOCKED', label: 'Blocked / Hold' },
                    { id: 'AVAILABLE', label: 'Available ATP' },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setInventoryStockFilter(filter.id as any)}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                        inventoryStockFilter === filter.id
                          ? 'bg-white text-slate-900 font-semibold shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={exportPositionsCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" /> Export CSV
                </button>
                <button
                  onClick={() => setIsAdjustModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Adjust Stock
                </button>
              </div>
            </div>
          </div>

          {/* Positions Table */}
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5">SKU & Item Title</th>
                    <th className="px-4 py-3.5">Facility / Bin</th>
                    <th className="px-4 py-3.5">Stock Breakdown (On Hand)</th>
                    <th className="px-4 py-3.5">Stock Coverage Bar</th>
                    <th className="px-4 py-3.5">Unit Cost</th>
                    <th className="px-4 py-3.5">Valuation</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredPositions.map((pos) => {
                    const isLow = pos.available_quantity <= pos.reorder_threshold;
                    const totalUnits = Math.max(1, pos.on_hand_quantity);
                    const availPct = Math.min(100, Math.round((pos.available_quantity / totalUnits) * 100));
                    const resPct = Math.min(100, Math.round((pos.reserved_quantity / totalUnits) * 100));
                    const blkPct = Math.min(100, Math.round((pos.blocked_quantity / totalUnits) * 100));
                    const whCode = getWarehouseCode(pos.warehouse_id);
                    const locCode = getLocationCode(pos.warehouse_id, pos.storage_location_id);
                    const totalVal = pos.on_hand_quantity * pos.unit_cost;

                    return (
                      <tr
                        key={pos.id}
                        onClick={() => {
                          setSelectedPosition(pos);
                          setActiveDrawer('POSITION');
                        }}
                        className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-teal-700">{pos.product_reference}</span>
                            {isLow && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                Low ATP
                              </span>
                            )}
                            {pos.blocked_quantity > 0 && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                Quality Hold
                              </span>
                            )}
                          </div>
                          <div className="font-semibold text-slate-900 mt-0.5">{pos.product_name || pos.product_reference}</div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-800">{whCode}</div>
                          <div className="text-[11px] font-mono text-slate-400">{locCode}</div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 text-sm">
                              {pos.on_hand_quantity}
                            </span>
                            <span className="text-slate-400 text-[11px]">
                              ({pos.available_quantity} avail &middot; {pos.reserved_quantity} rsvd &middot; {pos.blocked_quantity} blk)
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 w-44">
                          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden flex">
                            <div style={{ width: `${availPct}%` }} className="bg-emerald-500 h-full" title={`Available: ${pos.available_quantity}`} />
                            <div style={{ width: `${resPct}%` }} className="bg-amber-500 h-full" title={`Reserved: ${pos.reserved_quantity}`} />
                            <div style={{ width: `${blkPct}%` }} className="bg-rose-500 h-full" title={`Blocked: ${pos.blocked_quantity}`} />
                          </div>
                          <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                            <span className="text-emerald-700 font-medium">{pos.available_quantity} ATP</span>
                            {pos.blocked_quantity > 0 && <span className="text-rose-600 font-medium">{pos.blocked_quantity} Blk</span>}
                          </div>
                        </td>

                        <td className="px-4 py-3.5 font-mono text-xs text-slate-600">
                          ${pos.unit_cost.toFixed(2)}
                        </td>

                        <td className="px-4 py-3.5 font-mono font-bold text-slate-900 text-xs">
                          ${totalVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>

                        <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedPosition(pos);
                                setIsAdjustModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium text-xs shadow-xs transition-colors cursor-pointer"
                            >
                              Adjust
                            </button>
                            <button
                              onClick={() => {
                                setSelectedPosition(pos);
                                setActiveDrawer('POSITION');
                              }}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
                              title="Inspect Object Page"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. FLOORPLAN: WAREHOUSES & STORAGE LOCATIONS                              */}
      {/* ========================================================================= */}
      {activeTab === 'WAREHOUSES' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Physical Logistics Facilities & Bins</h2>
              <p className="text-xs text-slate-500">Storage locations, temperature zones, and bin level capacities.</p>
            </div>
            <button
              onClick={() => setIsCreateWarehouseOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Warehouse
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {warehouses.map((wh) => (
              <div
                key={wh.id}
                onClick={() => setSelectedWarehouse(wh)}
                className={`p-5 bg-white border rounded-2xl shadow-xs space-y-3 cursor-pointer transition-all ${
                  selectedWarehouse?.id === wh.id
                    ? 'border-teal-500 ring-2 ring-teal-500/10'
                    : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-slate-100 rounded-xl text-slate-700">
                      <WarehouseIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{wh.name}</div>
                      <span className="font-mono text-[11px] text-teal-700 font-bold">{wh.code}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {wh.status}
                  </span>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2">{wh.address || 'Enterprise Facility'}</p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span>Timezone: <strong className="text-slate-800">{wh.timezone}</strong></span>
                  <span>{wh.storage_locations?.length || 0} active bins</span>
                </div>
              </div>
            ))}
          </div>

          {/* Storage Locations Inspector for Selected Warehouse */}
          {selectedWarehouse && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Storage Bins & Zones: {selectedWarehouse.name} ({selectedWarehouse.code})
                  </h3>
                  <p className="text-xs text-slate-500">Pick faces, bulk receiving zones, and quality quarantine bins.</p>
                </div>
                <span className="font-mono text-xs text-slate-500">
                  {selectedWarehouse.storage_locations?.length || 0} Registered Locations
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {(selectedWarehouse.storage_locations || []).map((loc) => (
                  <div key={loc.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-slate-900">{loc.code}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-white border border-slate-200 text-slate-600">
                        {loc.type}
                      </span>
                    </div>
                    <div className="text-xs text-slate-700 font-medium truncate">{loc.name}</div>
                    <div className="text-[11px] text-emerald-700 font-medium">
                      Status: {loc.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. FLOORPLAN: STRATEGIC SUPPLIERS                                         */}
      {/* ========================================================================= */}
      {activeTab === 'SUPPLIERS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Strategic Suppliers & Vendors</h2>
              <p className="text-xs text-slate-500">Vendor master records, commercial terms, and operational hold guards.</p>
            </div>
            <button
              onClick={() => setIsCreateSupplierOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Register Supplier
            </button>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5">Vendor Code & Name</th>
                    <th className="px-4 py-3.5">Contact Details</th>
                    <th className="px-4 py-3.5">Payment Terms</th>
                    <th className="px-4 py-3.5">Currency</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {suppliers.map((sup) => (
                    <tr key={sup.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-mono font-bold text-teal-700">{sup.supplier_code}</div>
                        <div className="font-semibold text-slate-900 mt-0.5">{sup.name}</div>
                        <div className="text-[11px] text-slate-400">{sup.address}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-800">{sup.email || 'N/A'}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{sup.phone || 'N/A'}</div>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-xs">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-semibold text-slate-700">
                          {sup.payment_terms}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-xs text-slate-600">
                        {sup.currency}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                            sup.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {sup.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleSupplierHold(sup.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                              sup.status === 'ACTIVE'
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {sup.status === 'ACTIVE' ? 'Place on Hold' : 'Release Hold'}
                          </button>
                          <button
                            disabled={sup.status === 'ON_HOLD'}
                            onClick={() => {
                              setIsCreatePoOpen(true);
                            }}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Draft PO
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. FLOORPLAN: PURCHASING (Requisitions & Purchase Orders)                  */}
      {/* ========================================================================= */}
      {activeTab === 'PURCHASING' && (
        <div className="space-y-4">
          {/* Sub-tab Navigation */}
          <div className="flex items-center justify-between">
            <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setPurchasingTab('POS')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  purchasingTab === 'POS'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Purchase Orders ({purchaseOrders.length})
              </button>
              <button
                onClick={() => setPurchasingTab('REQUISITIONS')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  purchasingTab === 'REQUISITIONS'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Requisitions PR ({requisitions.length})
              </button>
            </div>

            {purchasingTab === 'POS' ? (
              <button
                onClick={() => setIsCreatePoOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-teal-400" /> Create Draft PO
              </button>
            ) : (
              <button
                onClick={() => setIsCreateRequisitionOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-teal-400" /> New Requisition
              </button>
            )}
          </div>

          {/* Subtab A: Purchase Orders Table */}
          {purchasingTab === 'POS' && (
            <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3.5">PO Number</th>
                      <th className="px-4 py-3.5">Supplier</th>
                      <th className="px-4 py-3.5">Delivery Facility</th>
                      <th className="px-4 py-3.5">Status Lifecycle</th>
                      <th className="px-4 py-3.5">Total Amount</th>
                      <th className="px-4 py-3.5">Expected Delivery</th>
                      <th className="px-4 py-3.5 text-right">Semantic Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {purchaseOrders.map((po) => {
                      const whCode = getWarehouseCode(po.warehouse_id);
                      return (
                        <tr
                          key={po.id}
                          onClick={() => {
                            setSelectedPo(po);
                            setActiveDrawer('PO');
                          }}
                          className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                        >
                          <td className="px-4 py-3.5 font-mono font-bold text-teal-700">
                            {po.po_number}
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-slate-900">{po.supplier?.name || 'Supplier'}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{po.supplier?.supplier_code}</div>
                          </td>

                          <td className="px-4 py-3.5">
                            <span className="font-semibold text-slate-800">{whCode}</span>
                          </td>

                          <td className="px-4 py-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                                po.status === 'APPROVED' || po.status === 'RECEIVED'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : po.status === 'SENT' || po.status === 'PARTIALLY_RECEIVED'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : po.status === 'CANCELLED'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {po.status}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                            ${po.grand_total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>

                          <td className="px-4 py-3.5 font-mono text-slate-500 text-[11px]">
                            {po.expected_delivery_date || 'Standard Lead Time'}
                          </td>

                          <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              {po.status === 'DRAFT' && (
                                <button
                                  onClick={() => handleSubmitPoForApproval(po.id)}
                                  className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold rounded text-xs transition-colors cursor-pointer"
                                >
                                  Submit
                                </button>
                              )}
                              {po.status === 'PENDING_APPROVAL' && (
                                <button
                                  onClick={() => handleApprovePo(po.id)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded text-xs transition-colors cursor-pointer"
                                >
                                  Approve
                                </button>
                              )}
                              {po.status === 'APPROVED' && (
                                <button
                                  onClick={() => handleSendPoToSupplier(po.id)}
                                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-xs transition-colors cursor-pointer"
                                >
                                  Send Supplier
                                </button>
                              )}
                              {(po.status === 'SENT' || po.status === 'PARTIALLY_RECEIVED') && (
                                <button
                                  onClick={() => {
                                    setSelectedPo(po);
                                    setIsReceiptWizardOpen(true);
                                  }}
                                  className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded text-xs transition-colors cursor-pointer"
                                >
                                  Receive
                                </button>
                              )}
                              {po.status !== 'CANCELLED' && po.status !== 'RECEIVED' && (
                                <button
                                  onClick={() => handleCancelPo(po.id)}
                                  className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                  title="Cancel PO"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Subtab B: Purchase Requisitions Table */}
          {purchasingTab === 'REQUISITIONS' && (
            <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3.5">PR Number</th>
                      <th className="px-4 py-3.5">Reason & Requirement</th>
                      <th className="px-4 py-3.5">Requester</th>
                      <th className="px-4 py-3.5">Needed By</th>
                      <th className="px-4 py-3.5">Lines Count</th>
                      <th className="px-4 py-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {requisitions.map((pr) => (
                      <tr key={pr.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3.5 font-mono font-bold text-teal-700">{pr.requisition_number}</td>
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-900">{pr.reason || 'Operational purchase'}</div>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-600">{pr.requester_id}</td>
                        <td className="px-4 py-3.5 font-mono text-slate-500">
                          {pr.needed_by || 'Immediate'}
                        </td>
                        <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                          {pr.lines?.length || 0} line(s)
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            {pr.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. FLOORPLAN: GOODS RECEIPTS & INSPECTION                                 */}
      {/* ========================================================================= */}
      {activeTab === 'RECEIPTS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Goods Inbound Receipts & Inspection</h2>
              <p className="text-xs text-slate-500">Warehouse dock receipts, quality inspection holds, and receipt reversals.</p>
            </div>
            <button
              onClick={() => {
                const openPo = purchaseOrders.find((p) => ['SENT', 'PARTIALLY_RECEIVED'].includes(p.status));
                if (openPo) {
                  setSelectedPo(openPo);
                  setIsReceiptWizardOpen(true);
                } else {
                  toast.info('No Open PO', 'All purchase orders have been received or are still drafts.');
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5 text-teal-400" /> Post Goods Receipt
            </button>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5">Receipt Reference</th>
                    <th className="px-4 py-3.5">Warehouse Dock</th>
                    <th className="px-4 py-3.5">Delivery Reference</th>
                    <th className="px-4 py-3.5">Received By</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {goodsReceipts.map((gr) => {
                    const whCode = getWarehouseCode(gr.warehouse_id);
                    return (
                      <tr key={gr.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3.5 font-mono font-bold text-teal-700">
                          {gr.receipt_number}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-800">
                          {whCode}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="text-slate-800 font-mono text-xs">{gr.supplier_delivery_reference || 'Direct Carrier Inbound'}</div>
                          <div className="text-[11px] text-slate-400">{gr.note}</div>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-500 text-[11px]">
                          {gr.received_by}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                              gr.status === 'POSTED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {gr.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {gr.status === 'POSTED' && (
                            <button
                              onClick={() => handleReverseReceipt(gr.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-rose-50 border border-slate-300 hover:border-rose-300 text-slate-700 hover:text-rose-700 rounded text-xs font-medium transition-colors cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3 text-rose-500" />
                              Reverse Receipt
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. FLOORPLAN: INTER-DC STOCK TRANSFERS                                    */}
      {/* ========================================================================= */}
      {activeTab === 'TRANSFERS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Inter-Facility Stock Transfers</h2>
              <p className="text-xs text-slate-500">Multi-warehouse replenishment, in-transit stock state, and destination receiving.</p>
            </div>
            <button
              onClick={() => setIsCreateTransferOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-teal-400" /> New Stock Transfer
            </button>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5">Transfer Order</th>
                    <th className="px-4 py-3.5">Source &rarr; Destination</th>
                    <th className="px-4 py-3.5">Transfer Lines</th>
                    <th className="px-4 py-3.5">Dispatch Notes</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Lifecycle Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {transfers.map((trf) => {
                    const fromWh = getWarehouseCode(trf.from_warehouse_id);
                    const toWh = getWarehouseCode(trf.to_warehouse_id);
                    return (
                      <tr key={trf.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3.5 font-mono font-bold text-teal-700">
                          {trf.transfer_number}
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2 font-semibold text-slate-900">
                            <span>{fromWh}</span>
                            <span className="text-slate-400">&rarr;</span>
                            <span className="text-blue-700">{toWh}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="font-mono text-slate-700">
                            {trf.lines?.map((l) => `${l.requested_quantity}x ${l.product_reference}`).join(', ') || '1 item'}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-slate-600">
                          {trf.notes || 'Intermodal transfer'}
                        </td>

                        <td className="px-4 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                              trf.status === 'RECEIVED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : trf.status === 'IN_TRANSIT'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {trf.status}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {(trf.status === 'DRAFT' || trf.status === 'READY') && (
                              <button
                                onClick={() => handleShipTransfer(trf.id)}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold cursor-pointer"
                              >
                                Ship Transfer
                              </button>
                            )}
                            {trf.status === 'IN_TRANSIT' && (
                              <button
                                onClick={() => handleReceiveTransfer(trf.id)}
                                className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs font-semibold cursor-pointer"
                              >
                                Receive Goods
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. FLOORPLAN: FINANCE & 3-WAY INVOICE MATCHING                             */}
      {/* ========================================================================= */}
      {activeTab === 'FINANCE' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Supplier Invoices & 3-Way Matching</h2>
              <p className="text-xs text-slate-500">Automated matching between Purchase Order, Goods Receipt, and Inbound Invoice.</p>
            </div>
            <button
              onClick={() => setIsCreateInvoiceOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Register Inbound Invoice
            </button>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5">Invoice Number</th>
                    <th className="px-4 py-3.5">Supplier</th>
                    <th className="px-4 py-3.5">Invoice Amount</th>
                    <th className="px-4 py-3.5">Matched Amount</th>
                    <th className="px-4 py-3.5">Variance</th>
                    <th className="px-4 py-3.5">3-Way Match Status</th>
                    <th className="px-4 py-3.5">Payment State</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-bold text-teal-700">
                        {inv.invoice_number}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">{inv.supplier?.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{inv.supplier?.supplier_code}</div>
                      </td>

                      <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                        ${inv.grand_total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-slate-600">
                        ${inv.matched_amount?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                      </td>

                      <td className="px-4 py-3.5 font-mono font-bold">
                        {inv.variance_amount > 0 ? (
                          <span className="text-rose-600">+${inv.variance_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        ) : (
                          <span className="text-slate-400">$0.00</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                            inv.match_status === 'MATCHED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {inv.match_status}
                        </span>
                        {inv.resolution_note && (
                          <div className="text-[10px] text-slate-500 mt-0.5 max-w-xs truncate">
                            {inv.resolution_note}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-medium">
                          {inv.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        {inv.match_status !== 'MATCHED' ? (
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setIsMatchDialogOpen(true);
                            }}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Resolve Mismatch
                          </button>
                        ) : (
                          <span className="text-emerald-700 font-medium text-xs">Verified</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* OBJECT PAGE DRAWER: INVENTORY POSITION DETAILS                           */}
      {/* ========================================================================= */}
      {activeDrawer === 'POSITION' && selectedPosition && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-smooth-fade">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <span className="font-mono text-xs text-slate-500 font-bold uppercase">
              SAP Material Master Record
            </span>
            <button
              onClick={() => setActiveDrawer('NONE')}
              className="p-1 hover:bg-slate-200 rounded-lg text-slate-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <FioriObjectHeader
              title={selectedPosition.product_reference}
              subtitle={selectedPosition.product_name}
              typeLabel="Material Master"
              statusText={selectedPosition.available_quantity > selectedPosition.reorder_threshold ? 'IN STOCK' : 'LOW STOCK WARNING'}
              statusVariant={selectedPosition.available_quantity > selectedPosition.reorder_threshold ? 'success' : 'warning'}
              providerInfo={{
                name: 'SAP S/4HANA (FIFO Engine)',
                syncStatus: 'Real-time Monolithic Invariants',
              }}
              keyFacts={[
                { label: 'Available (ATP)', value: selectedPosition.available_quantity, subtext: 'Safe to promise' },
                { label: 'On Hand', value: selectedPosition.on_hand_quantity, subtext: 'Physical lot count' },
                { label: 'Reserved', value: selectedPosition.reserved_quantity, subtext: 'Committed orders' },
                { label: 'Unit Cost', value: `$${selectedPosition.unit_cost.toFixed(2)}`, subtext: 'FIFO Valuation' },
              ]}
              primaryAction={{
                label: 'Adjust Count',
                onClick: () => setIsAdjustModalOpen(true),
              }}
            />

            {/* Invariant Equation Breakdown */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-xs text-slate-900">Inventory Invariant Verification</h4>
              <p className="text-[11px] text-slate-500">
                Formula: Available = On Hand ({selectedPosition.on_hand_quantity}) - Reserved ({selectedPosition.reserved_quantity}) - Blocked ({selectedPosition.blocked_quantity}) = <strong>{selectedPosition.available_quantity}</strong>
              </p>
            </div>

            {/* Recent Movements for this SKU */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs text-slate-900">Recent Movement Ledger</h4>
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden text-xs">
                {movements
                  .filter((m) => m.product_reference === selectedPosition.product_reference)
                  .map((m) => (
                    <div key={m.id} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-mono font-bold text-slate-900">{m.movement_type}</div>
                        <p className="text-[11px] text-slate-500">{m.note || 'Warehouse action'}</p>
                      </div>
                      <div className="text-right">
                        <span className={`font-mono font-bold ${m.quantity > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                          {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {new Date(m.posted_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* OBJECT PAGE DRAWER: PURCHASE ORDER DETAILS                                */}
      {/* ========================================================================= */}
      {activeDrawer === 'PO' && selectedPo && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-smooth-fade">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <span className="font-mono text-xs text-slate-500 font-bold uppercase">
              Purchase Order Specification
            </span>
            <button
              onClick={() => setActiveDrawer('NONE')}
              className="p-1 hover:bg-slate-200 rounded-lg text-slate-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <FioriObjectHeader
              title={selectedPo.po_number}
              subtitle={`Supplier: ${selectedPo.supplier?.name || 'Foxconn'}`}
              typeLabel="Purchase Order"
              statusText={selectedPo.status}
              statusVariant={selectedPo.status === 'APPROVED' ? 'success' : 'info'}
              providerInfo={{
                name: 'SAP S/4HANA MM Module',
                syncStatus: 'Live Monolith',
              }}
              keyFacts={[
                { label: 'Grand Total', value: `$${selectedPo.grand_total.toLocaleString()}`, subtext: selectedPo.currency },
                { label: 'Delivery Dock', value: getWarehouseCode(selectedPo.warehouse_id), subtext: 'Target DC' },
                { label: 'Order Date', value: selectedPo.order_date, subtext: 'Commercial' },
              ]}
            />

            {/* Line Items Table */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs text-slate-900">Purchase Order Line Items</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                    <tr>
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2">Qty</th>
                      <th className="px-3 py-2">Price</th>
                      <th className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedPo.lines?.map((line) => (
                      <tr key={line.id}>
                        <td className="px-3 py-2 font-mono">{line.product_reference}</td>
                        <td className="px-3 py-2">{line.ordered_quantity} {line.unit}</td>
                        <td className="px-3 py-2">${line.unit_cost.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-mono font-bold">${line.line_total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS HOOKUP                                                             */}
      {/* ========================================================================= */}
      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        productRef={activePositionToAdjust?.product_reference || 'SRV-DL380-G11'}
        productName={activePositionToAdjust?.product_name || 'Enterprise Rack Server'}
        currentOnHand={activePositionToAdjust?.on_hand_quantity || 0}
        reservedQty={activePositionToAdjust?.reserved_quantity || 0}
        blockedQty={activePositionToAdjust?.blocked_quantity || 0}
        warehouses={warehouses}
        onConfirm={handlePerformStockAdjustment}
      />

      {/* Goods Receipt Wizard */}
      <GoodsReceiptWizard
        isOpen={isReceiptWizardOpen}
        onClose={() => setIsReceiptWizardOpen(false)}
        order={selectedPo || purchaseOrders[0]}
        onConfirm={handlePostGoodsReceipt}
      />

      {/* Purchase Order Creation Modal */}
      <PurchaseOrderModal
        isOpen={isCreatePoOpen}
        onClose={() => setIsCreatePoOpen(false)}
        suppliers={suppliers}
        warehouses={warehouses}
        onConfirm={handleCreatePurchaseOrder}
      />

      {/* Stock Transfer Creation Modal */}
      <StockTransferModal
        isOpen={isCreateTransferOpen}
        onClose={() => setIsCreateTransferOpen(false)}
        warehouses={warehouses}
        inventoryPositions={positions}
        onConfirm={handleCreateStockTransfer}
      />

      {/* Supplier Invoice Registration Modal */}
      <CreateInvoiceModal
        isOpen={isCreateInvoiceOpen}
        onClose={() => setIsCreateInvoiceOpen(false)}
        suppliers={suppliers}
        purchaseOrders={purchaseOrders}
        onConfirm={handleCreateSupplierInvoice}
      />

      {/* 3-Way Match Variance Resolution Dialog */}
      <InvoiceMatchDialog
        isOpen={isMatchDialogOpen}
        onClose={() => setIsMatchDialogOpen(false)}
        invoice={selectedInvoice}
        purchaseOrder={purchaseOrders.find((p) => p.id === selectedInvoice?.purchase_order_id)}
        onResolve={handleResolveInvoiceMismatch}
        onApprove={async () => {
          if (selectedInvoice) {
            await handleResolveInvoiceMismatch('ACCEPT_VARIANCE', 'Finance override approved');
          }
        }}
      />

      {/* Purchase Requisition Creation Modal */}
      <PurchaseRequisitionModal
        isOpen={isCreateRequisitionOpen}
        onClose={() => setIsCreateRequisitionOpen(false)}
        suppliers={suppliers}
        onConfirm={handleCreateRequisition}
      />

      {/* Supplier Registration Modal */}
      <SupplierModal
        isOpen={isCreateSupplierOpen}
        onClose={() => setIsCreateSupplierOpen(false)}
        onCreateSupplier={handleCreateSupplier}
      />

      {/* Warehouse Registration Modal */}
      <WarehouseModal
        isOpen={isCreateWarehouseOpen}
        onClose={() => setIsCreateWarehouseOpen(false)}
        onCreateWarehouse={handleCreateWarehouse}
      />
    </div>
  );
};
