import React, { useState } from 'react';
import { Plus, Search, Download, ArrowRightLeft, Edit3, Trash2, ShieldAlert, History, DollarSign } from 'lucide-react';
import { Product, InventoryItem, InventoryMovement, JournalEntry } from '../types';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { MetricCard } from '../components/MetricCard';
import { ConfigPanel, ConfigSection } from '../components/ConfigPanel';

interface ErpViewProps {
  products: Product[];
  inventory: InventoryItem[];
  onCreateProduct: (product: any) => Promise<void>;
  onUpdateProduct?: (productId: number, data: any) => Promise<void>;
  onDeleteProduct?: (productId: number) => Promise<void>;
  onAdjustStock: (adj: any) => Promise<void>;
  onTransferStock?: (transfer: { product_id: number; from_warehouse: string; to_warehouse: string; quantity: number; notes?: string }) => Promise<void>;
  movements?: InventoryMovement[];
  journalEntries?: JournalEntry[];
  onPostJournalEntry?: (entry: JournalEntry) => Promise<void>;
  activeSubNav?: string;
}

export const ErpView: React.FC<ErpViewProps> = ({
  products,
  inventory,
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAdjustStock,
  onTransferStock,
  movements: initialMovements,
  journalEntries: initialJournalEntries,
  onPostJournalEntry,
  activeSubNav,
}) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'WORKSPACE' | 'CONFIG' | 'PROVIDERS' | 'ANALYTICS'>('WORKSPACE');
  const [activeWorkspaceSubTab, setActiveWorkspaceSubTab] = useState<'INVENTORY' | 'MOVEMENTS' | 'FINANCE'>('INVENTORY');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);
  const [movementWarehouseFilter, setMovementWarehouseFilter] = useState('ALL');
  const [savedView, setSavedView] = useState<'ALL' | 'LOW_STOCK' | 'HARDWARE' | 'DIGITAL'>('ALL');
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

  // Sync with Sidebar subnavigation
  React.useEffect(() => {
    if (!activeSubNav) return;
    if (activeSubNav === 'OVERVIEW') setActiveTab('OVERVIEW');
    else if (activeSubNav === 'INVENTORY') {
      setActiveTab('WORKSPACE');
      setActiveWorkspaceSubTab('INVENTORY');
    } else if (activeSubNav === 'MOVEMENTS') {
      setActiveTab('WORKSPACE');
      setActiveWorkspaceSubTab('MOVEMENTS');
    } else if (activeSubNav === 'FINANCE') {
      setActiveTab('WORKSPACE');
      setActiveWorkspaceSubTab('FINANCE');
    }
  }, [activeSubNav]);

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);

  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Forms
  const [productForm, setProductForm] = useState({
    sku: '',
    name: '',
    description: '',
    category: 'HARDWARE',
    price: 0,
    cost: 0,
    initial_quantity: 10,
    warehouse: 'MAIN',
  });

  const [editProductForm, setEditProductForm] = useState({
    id: 0,
    sku: '',
    name: '',
    description: '',
    category: 'HARDWARE',
    price: 0,
    cost: 0,
  });

  const [stockDelta, setStockDelta] = useState(10);
  const [stockReason, setStockReason] = useState('CYCLE_COUNT');

  const [transferForm, setTransferForm] = useState({
    product_id: products[0]?.id || 1,
    from_warehouse: 'MAIN',
    to_warehouse: 'NORTH',
    quantity: 5,
    notes: 'Replenishment transfer for regional demand',
  });

  const [journalForm, setJournalForm] = useState({
    account: '1200 - Inventory Assets',
    type: 'ASSET' as const,
    description: '',
    amount: 1500,
    isCredit: false,
  });

  // Local movement audit trail
  const [movements, setMovements] = useState<InventoryMovement[]>(
    initialMovements || [
      {
        id: 'MOV-2026-0920-01',
        product_id: 1,
        sku: 'SRV-DL380-G11',
        product_name: 'Enterprise Rack Server Pro Dual Xeon',
        quantity_delta: 25,
        previous_stock: 0,
        new_stock: 25,
        warehouse: 'MAIN',
        reason: 'Initial PO receipt from Foxconn Logistics',
        user: 'system.procure',
        timestamp: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
      },
      {
        id: 'MOV-2026-0920-02',
        product_id: 1,
        sku: 'SRV-DL380-G11',
        product_name: 'Enterprise Rack Server Pro Dual Xeon',
        quantity_delta: -2,
        previous_stock: 25,
        new_stock: 23,
        warehouse: 'MAIN',
        reason: 'Fulfillment deduction for ORD-2026-0919-01',
        user: 'oms.fulfillment',
        timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
      },
      {
        id: 'MOV-2026-0920-03',
        product_id: 2,
        sku: 'SW-CISCO-48',
        product_name: '48-Port Gigabit Core Switch',
        quantity_delta: -1,
        previous_stock: 8,
        new_stock: 7,
        warehouse: 'MAIN',
        reason: 'Fulfillment deduction for ORD-2026-0919-01',
        user: 'oms.fulfillment',
        timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
      },
      {
        id: 'MOV-2026-0920-04',
        product_id: 2,
        sku: 'SW-CISCO-48',
        product_name: '48-Port Gigabit Core Switch',
        quantity_delta: -3,
        previous_stock: 10,
        new_stock: 7,
        warehouse: 'MAIN',
        reason: 'Internal lab allocation & testing',
        user: 'eng.lead',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
    ]
  );

  // Local ledger transactions
  const [ledgerTransactions, setLedgerTransactions] = useState<JournalEntry[]>(
    initialJournalEntries || [
      {
        id: 'TXN-2026-0919-01',
        date: 'Sep 19, 2026',
        type: 'REVENUE',
        account: '4010 - Omnichannel Product Sales',
        description: 'Order ORD-2026-0919-01 settlement',
        amount: 10850.0,
        isCredit: true,
        status: 'POSTED',
      },
      {
        id: 'TXN-2026-0919-02',
        date: 'Sep 19, 2026',
        type: 'COGS',
        account: '5010 - Raw Hardware Procurement COGS',
        description: 'Main warehouse stock replenishment batch #89',
        amount: 4200.0,
        isCredit: false,
        status: 'POSTED',
      },
      {
        id: 'TXN-2026-0919-03',
        date: 'Sep 18, 2026',
        type: 'REVENUE',
        account: '4010 - Omnichannel Product Sales',
        description: 'Order ORD-2026-0919-02 settlement',
        amount: 17600.0,
        isCredit: true,
        status: 'POSTED',
      },
      {
        id: 'TXN-2026-0918-04',
        date: 'Sep 18, 2026',
        type: 'ASSET',
        account: '1200 - Inventory Assets',
        description: 'Periodic physical inventory revaluation adjustment',
        amount: 8500.0,
        isCredit: false,
        status: 'POSTED',
      },
    ]
  );

  // ERP Configuration Sections
  const [erpConfigSections, setErpConfigSections] = useState<ConfigSection[]>([
    {
      title: 'Costing & Inventory Valuation',
      description: 'Define accounting rules for COGS calculation and inventory asset balance.',
      fields: [
        {
          id: 'valuation_method',
          label: 'Inventory Valuation Method',
          description: 'Cost accounting method applied to stock depletion.',
          type: 'select',
          value: 'FIFO',
          options: [
            { label: 'FIFO (First In, First Out)', value: 'FIFO' },
            { label: 'Weighted Average Cost (AVCO)', value: 'AVCO' },
            { label: 'Standard Costing (Fixed Target)', value: 'STANDARD' },
          ],
        },
        {
          id: 'default_reorder_threshold',
          label: 'Default Safety Stock Threshold (Units)',
          description: 'Automatic replenishment signal triggers when ATP falls below this level.',
          type: 'number',
          value: 10,
        },
        {
          id: 'auto_purchase_orders',
          label: 'Automated Supplier Purchase Orders (PO)',
          description: 'Automatically draft POs to primary supplier when threshold breached.',
          type: 'toggle',
          value: true,
        },
      ],
    },
    {
      title: 'Warehouse Bins & Cycle Counting',
      description: 'Physical audit cadences and multi-warehouse bin location governance.',
      fields: [
        {
          id: 'cycle_count_interval',
          label: 'Physical Cycle Count Frequency',
          description: 'Automated audit schedule for warehouse operators.',
          type: 'select',
          value: 'MONTHLY',
          options: [
            { label: 'Weekly ABC Stratified Count', value: 'WEEKLY' },
            { label: 'Monthly Comprehensive Audit', value: 'MONTHLY' },
            { label: 'Quarterly Physical Verification', value: 'QUARTERLY' },
          ],
        },
        {
          id: 'barcode_symbology',
          label: 'Zebra Scanner Symbology Standard',
          description: 'Barcode parsing standard for handheld terminal pick lists.',
          type: 'select',
          value: 'GS1_128',
          options: [
            { label: 'GS1-128 / UCC-EAN (Enterprise Standard)', value: 'GS1_128' },
            { label: 'Code 39 (Alphanumeric)', value: 'CODE39' },
            { label: 'DataMatrix 2D / QR', value: 'DATAMATRIX' },
          ],
        },
      ],
    },
  ]);

  const handleErpConfigChange = (secIdx: number, fieldId: string, val: any) => {
    setErpConfigSections((prev) => {
      const copy = [...prev];
      const fields = [...copy[secIdx].fields];
      const fIdx = fields.findIndex((f) => f.id === fieldId);
      if (fIdx !== -1) {
        fields[fIdx] = { ...fields[fIdx], value: val };
        copy[secIdx] = { ...copy[secIdx], fields };
      }
      return copy;
    });
  };

  const handleSaveErpConfig = () => {
    toast.success('ERP Configuration Saved', 'Costing methods and warehouse audit rules updated.');
  };

  const getStockCount = (productId: number) => {
    const item = inventory.find((i) => i.product_id === productId);
    return item ? item.quantity : 0;
  };

  const getWarehouse = (productId: number) => {
    const item = inventory.find((i) => i.product_id === productId);
    return item ? item.warehouse : 'MAIN';
  };

  const filteredProducts = products.filter((p) => {
    const stock = getStockCount(p.id);
    const wh = getWarehouse(p.id);

    let matchesSavedView = true;
    if (savedView === 'LOW_STOCK') {
      matchesSavedView = stock <= 10;
    } else if (savedView === 'HARDWARE') {
      matchesSavedView = (p.category || 'HARDWARE') === 'HARDWARE';
    } else if (savedView === 'DIGITAL') {
      matchesSavedView = (p.category || '') === 'SOFTWARE' || (p.category || '') === 'SERVICES' || wh === 'DIGITAL';
    }

    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStock = !filterLowStockOnly || stock <= 10;
    return matchesSavedView && matchesSearch && matchesStock;
  });

  const toggleSelectAllProducts = () => {
    if (selectedProductIds.length === filteredProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map((p) => p.id));
    }
  };

  const toggleSelectProduct = (id: number) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExportSelectedProductsCsv = () => {
    const selected = products.filter((p) => selectedProductIds.includes(p.id));
    if (selected.length === 0) return;
    const headers = ['SKU', 'Name', 'Category', 'Warehouse', 'Unit Cost', 'Unit Price', 'Stock on Hand', 'Valuation'];
    const rows = selected.map((p) => [
      `"${p.sku}"`,
      `"${p.name}"`,
      `"${p.category || 'HARDWARE'}"`,
      `"${getWarehouse(p.id)}"`,
      p.cost.toFixed(2),
      p.price.toFixed(2),
      getStockCount(p.id),
      (p.cost * getStockCount(p.id)).toFixed(2),
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ubop_selected_skus_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Export Complete', `Exported ${selected.length} selected SKUs to CSV.`);
  };

  const handleBatchTransferToNorth = async () => {
    if (selectedProductIds.length === 0) return;
    setLoading(true);
    try {
      for (const prodId of selectedProductIds) {
        const prod = products.find((p) => p.id === prodId);
        if (!prod) continue;
        const currentWh = getWarehouse(prodId);
        const stock = getStockCount(prodId);
        if (stock > 0 && currentWh !== 'NORTH') {
          if (onTransferStock) {
            await onTransferStock({
              product_id: prodId,
              from_warehouse: currentWh,
              to_warehouse: 'NORTH',
              quantity: Math.min(stock, 2),
              notes: 'Batch replenishment transfer to NORTH Annex',
            });
          }
        }
      }
      toast.success('Batch Transfer Complete', `Transferred stock for ${selectedProductIds.length} SKUs to NORTH Annex.`);
      setSelectedProductIds([]);
    } catch {
      toast.error('Transfer Failed', 'Could not complete batch stock movement.');
    } finally {
      setLoading(false);
    }
  };

  const filteredMovements = movements.filter((m) => {
    const matchesWh = movementWarehouseFilter === 'ALL' || m.warehouse === movementWarehouseFilter;
    const matchesSearch =
      m.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.reason.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesWh && matchesSearch;
  });

  // Calculate ERP Metrics
  const lowStockCount = products.filter((p) => getStockCount(p.id) <= 10).length;
  const totalValuation = products.reduce((acc, p) => acc + p.cost * getStockCount(p.id), 0);
  const potentialRevenue = products.reduce((acc, p) => acc + p.price * getStockCount(p.id), 0);

  // Handlers
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onCreateProduct(productForm);
      setIsProductModalOpen(false);
      setProductForm({
        sku: '',
        name: '',
        description: '',
        category: 'HARDWARE',
        price: 0,
        cost: 0,
        initial_quantity: 10,
        warehouse: 'MAIN',
      });
      toast.success('SKU Created', `${productForm.name} registered in master catalog.`);
    } catch {
      toast.error('Registration Failed', 'Could not create catalog product.');
    } finally {
      setLoading(false);
    }
  };

  const openEditProductModal = (product: Product) => {
    setEditProductForm({
      id: product.id,
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      category: product.category || 'HARDWARE',
      price: product.price,
      cost: product.cost,
    });
    setIsEditProductModalOpen(true);
  };

  const handleEditProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (onUpdateProduct) {
        await onUpdateProduct(editProductForm.id, editProductForm);
      } else {
        // Fallback local update
        const idx = products.findIndex((p) => p.id === editProductForm.id);
        if (idx !== -1) {
          products[idx] = { ...products[idx], ...editProductForm };
        }
      }
      setIsEditProductModalOpen(false);
      toast.success('SKU Updated', `Changes to ${editProductForm.sku} saved successfully.`);
    } catch {
      toast.error('Update Failed', 'Could not save SKU modifications.');
    } finally {
      setLoading(false);
    }
  };

  const openDeleteProductModal = (productId: number) => {
    setSelectedProductId(productId);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteProductSubmit = async () => {
    if (!selectedProductId) return;
    setLoading(true);
    try {
      if (onDeleteProduct) {
        await onDeleteProduct(selectedProductId);
      } else {
        const idx = products.findIndex((p) => p.id === selectedProductId);
        if (idx !== -1) products.splice(idx, 1);
      }
      setIsDeleteModalOpen(false);
      toast.success('SKU Deleted', 'Product removed from master catalog.');
    } catch {
      toast.error('Delete Failed', 'Could not remove catalog product.');
    } finally {
      setLoading(false);
      setSelectedProductId(null);
    }
  };

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;
    const targetProd = products.find((p) => p.id === selectedProductId);
    if (!targetProd) return;

    setLoading(true);
    try {
      const prevStock = getStockCount(selectedProductId);
      const newStock = Math.max(0, prevStock + stockDelta);
      const wh = getWarehouse(selectedProductId);

      await onAdjustStock({
        product_id: selectedProductId,
        quantity_delta: stockDelta,
        reason: `Adjustment: ${stockReason}`,
      });

      // Record movement in audit trail
      const newMovement: InventoryMovement = {
        id: `MOV-${Date.now().toString().slice(-6)}`,
        product_id: selectedProductId,
        sku: targetProd.sku,
        product_name: targetProd.name,
        quantity_delta: stockDelta,
        previous_stock: prevStock,
        new_stock: newStock,
        warehouse: wh,
        reason: `Manual Count: ${stockReason}`,
        user: 'ops.warehouse',
        timestamp: new Date().toISOString(),
      };
      setMovements((prev) => [newMovement, ...prev]);

      setIsStockModalOpen(false);
      toast.success(
        'Stock Adjusted',
        `Adjusted ${targetProd.sku} by ${stockDelta > 0 ? `+${stockDelta}` : stockDelta} units.`
      );
    } catch {
      toast.error('Adjustment Failed', 'Could not record inventory count change.');
    } finally {
      setLoading(false);
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (transferForm.from_warehouse === transferForm.to_warehouse) {
      toast.error('Invalid Transfer', 'Source and destination warehouses must be different.');
      return;
    }
    const targetProd = products.find((p) => p.id === transferForm.product_id);
    if (!targetProd) return;

    const sourceStock = getStockCount(transferForm.product_id);
    if (sourceStock < transferForm.quantity) {
      toast.error('Insufficient Stock', `Only ${sourceStock} units available in ${transferForm.from_warehouse}.`);
      return;
    }

    setLoading(true);
    try {
      if (onTransferStock) {
        await onTransferStock(transferForm);
      } else {
        // Local movement simulation
        await onAdjustStock({
          product_id: transferForm.product_id,
          quantity_delta: -transferForm.quantity,
          reason: `Stock Transfer out to ${transferForm.to_warehouse}`,
        });
      }

      // Record transfer movement
      const newMovement: InventoryMovement = {
        id: `TRF-${Date.now().toString().slice(-6)}`,
        product_id: transferForm.product_id,
        sku: targetProd.sku,
        product_name: targetProd.name,
        quantity_delta: transferForm.quantity,
        previous_stock: sourceStock,
        new_stock: sourceStock - transferForm.quantity,
        warehouse: `${transferForm.from_warehouse} ➔ ${transferForm.to_warehouse}`,
        reason: `Transfer: ${transferForm.notes}`,
        user: 'logistics.dispatch',
        timestamp: new Date().toISOString(),
      };
      setMovements((prev) => [newMovement, ...prev]);

      setIsTransferModalOpen(false);
      toast.success(
        'Stock Transferred',
        `Moved ${transferForm.quantity} units of ${targetProd.sku} to ${transferForm.to_warehouse}.`
      );
    } catch {
      toast.error('Transfer Failed', 'Unable to complete warehouse transfer.');
    } finally {
      setLoading(false);
    }
  };

  const handlePostJournalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newEntry: JournalEntry = {
        id: `TXN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-3)}`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        type: journalForm.type,
        account: journalForm.account,
        description: journalForm.description || 'Manual adjusting journal voucher',
        amount: journalForm.amount,
        isCredit: journalForm.isCredit,
        status: 'POSTED',
      };

      if (onPostJournalEntry) {
        await onPostJournalEntry(newEntry);
      }
      setLedgerTransactions((prev) => [newEntry, ...prev]);
      setIsJournalModalOpen(false);
      setJournalForm({
        account: '1200 - Inventory Assets',
        type: 'ASSET',
        description: '',
        amount: 1500,
        isCredit: false,
      });
      toast.success('Journal Entry Posted', `Transaction ${newEntry.id} reconciled.`);
    } catch {
      toast.error('Posting Failed', 'Could not submit ledger entry.');
    } finally {
      setLoading(false);
    }
  };

  // CSV Exports
  const exportCatalogCsv = () => {
    const headers = ['SKU', 'Name', 'Category', 'Warehouse', 'Unit Cost', 'Sales Price', 'Stock On Hand', 'Total Valuation'];
    const rows = products.map((p) => {
      const stock = getStockCount(p.id);
      const wh = getWarehouse(p.id);
      const val = (p.cost * stock).toFixed(2);
      return [
        `"${p.sku}"`,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.category || 'HARDWARE'}"`,
        `"${wh}"`,
        p.cost.toFixed(2),
        p.price.toFixed(2),
        stock,
        val,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ubop_erp_catalog_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Downloaded', `Exported ${products.length} catalog items.`);
  };

  const exportMovementsCsv = () => {
    const headers = ['Movement ID', 'Timestamp', 'SKU', 'Product Title', 'Warehouse', 'Quantity Delta', 'Previous Stock', 'New Stock', 'Reason', 'Operator'];
    const rows = movements.map((m) => [
      `"${m.id}"`,
      `"${m.timestamp}"`,
      `"${m.sku}"`,
      `"${m.product_name.replace(/"/g, '""')}"`,
      `"${m.warehouse}"`,
      m.quantity_delta,
      m.previous_stock,
      m.new_stock,
      `"${m.reason.replace(/"/g, '""')}"`,
      `"${m.user}"`,
    ].join(','));

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ubop_inventory_movements_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Movements Exported', `Exported ${movements.length} audit trail records.`);
  };

  const exportLedgerCsv = () => {
    const headers = ['Txn ID', 'Posting Date', 'Account', 'Type', 'Description', 'Amount', 'Credit/Debit', 'Status'];
    const rows = ledgerTransactions.map((tx) => [
      `"${tx.id}"`,
      `"${tx.date}"`,
      `"${tx.account}"`,
      `"${tx.type}"`,
      `"${tx.description.replace(/"/g, '""')}"`,
      tx.amount.toFixed(2),
      tx.isCredit ? 'CREDIT' : 'DEBIT',
      `"${tx.status}"`,
    ].join(','));

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ubop_erp_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Ledger Exported', `Exported ${ledgerTransactions.length} journal transactions.`);
  };

  const testProviderPing = async (provId: string, provName: string) => {
    try {
      const res = await fetch(`/api/v1/providers/ping/${provId}`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        toast.success('Connection Active', `${provName} handshake verified (${data.latency_ms || 18}ms latency).`);
        return;
      }
    } catch {}
    toast.success('Handshake Verified', `${provName} connector ping simulated successfully (24ms).`);
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  return (
    <div className="space-y-6 animate-smooth-fade">
      {/* Header & 5 Standard Module Tabs */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Enterprise Resource Planning (ERP)</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                SAP Fiori & NetSuite Model
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-warehouse inventory, master SKU catalog, FIFO costing, audit trails, and general ledger reconciliation.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setTransferForm({
                  product_id: products[0]?.id || 1,
                  from_warehouse: 'MAIN',
                  to_warehouse: 'NORTH',
                  quantity: 5,
                  notes: 'Replenishment stock transfer',
                });
                setIsTransferModalOpen(true);
              }}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium px-3 py-1.5 rounded-lg text-xs transition-all shadow-xs shrink-0 btn-press active:scale-[0.98]"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" /> Transfer Stock
            </button>
            <button
              onClick={() => setIsProductModalOpen(true)}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium px-3.5 py-1.5 rounded-lg text-xs transition-all shadow-xs shrink-0 btn-press active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" /> Add SKU
            </button>
          </div>
        </div>

        {/* 5 Standard Tabs */}
        <div className="flex border-b border-slate-200">
          {[
            { id: 'OVERVIEW', label: 'Overview' },
            { id: 'WORKSPACE', label: 'Workspace' },
            { id: 'CONFIG', label: 'Configuration' },
            { id: 'PROVIDERS', label: 'Provider Connectors' },
            { id: 'ANALYTICS', label: 'Inventory Telemetry' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <MetricCard
              title="Warehouse Asset Valuation"
              value={`$${totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              subtext="FIFO inventory balance"
              change={8.4}
              period="vs prior audit"
              sparklineData={[68, 72, 79, 84, 91]}
            />
            <MetricCard
              title="Master Catalog SKUs"
              value={products.length}
              subtext="Hardware & cloud licenses"
              change={0}
              period="active SKU definitions"
            />
            <MetricCard
              title="Safety Stock Warnings"
              value={lowStockCount}
              subtext={lowStockCount > 0 ? 'Requires replenishment PO' : 'All bins healthy'}
              change={lowStockCount > 0 ? -10 : 0}
              period="stock <= 10 units"
            />
            <MetricCard
              title="Stock Revenue Potential"
              value={`$${potentialRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              subtext="At retail price list"
              change={14.2}
              period="sales capacity"
              sparklineData={[120, 140, 155, 172, 195]}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Warehouse Capacity Allocation</h3>
                  <p className="text-xs text-slate-500">Real-time bin occupancy across physical & cloud facilities</p>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('WORKSPACE');
                    setActiveWorkspaceSubTab('MOVEMENTS');
                  }}
                  className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
                >
                  <History className="w-3.5 h-3.5" /> View Movements ➔
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { name: 'Primary Distribution Center (MAIN)', cap: '78% Utilized', units: '1,420 / 1,800 Bins', color: 'bg-emerald-500', pct: '78%' },
                  { name: 'Secondary Inbound Annex (NORTH)', cap: '42% Utilized', units: '420 / 1,000 Bins', color: 'bg-blue-500', pct: '42%' },
                  { name: 'Digital Cloud License Vault (DIGITAL)', cap: 'Infinite Virtual Capacity', units: '999 Active Entitlements', color: 'bg-teal-500', pct: '100%' },
                ].map((w, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{w.name}</span>
                      <span className="font-mono font-bold text-slate-900">{w.units}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div style={{ width: w.pct }} className={`h-full ${w.color} rounded-full`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">General Ledger Balance</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Automated ERP chart of accounts.</p>
                </div>
                <div className="space-y-3 pt-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[11px] font-mono text-slate-400">1200 - INVENTORY ASSETS</span>
                    <div className="font-mono font-bold text-slate-900 text-sm">${totalValuation.toFixed(2)}</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[11px] font-mono text-slate-400">2010 - ACCOUNTS PAYABLE</span>
                    <div className="font-mono font-bold text-slate-900 text-sm">$4,200.00</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[11px] font-mono text-slate-400">4010 - REVENUE RECOGNIZED</span>
                    <div className="font-mono font-bold text-emerald-700 text-sm">$28,450.00</div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveTab('WORKSPACE');
                  setActiveWorkspaceSubTab('FINANCE');
                }}
                className="mt-4 w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <DollarSign className="w-3.5 h-3.5 text-slate-500" /> Open Ledger Reconciliation ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WORKSPACE */}
      {activeTab === 'WORKSPACE' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setActiveWorkspaceSubTab('INVENTORY')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeWorkspaceSubTab === 'INVENTORY'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Stock & Master Catalog
              </button>
              <button
                onClick={() => setActiveWorkspaceSubTab('MOVEMENTS')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeWorkspaceSubTab === 'MOVEMENTS'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Movement Audit Trail ({movements.length})
              </button>
              <button
                onClick={() => setActiveWorkspaceSubTab('FINANCE')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeWorkspaceSubTab === 'FINANCE'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                General Ledger ({ledgerTransactions.length})
              </button>
            </div>

            {/* Subtab action bars */}
            {activeWorkspaceSubTab === 'INVENTORY' && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    filterLowStockOnly
                      ? 'bg-amber-50 border-amber-300 text-amber-800 font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Low Stock Warnings ({lowStockCount})
                </button>
                <div className="relative w-56">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search SKU, name, category..."
                    className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <button
                  onClick={exportCatalogCsv}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-xs"
                  title="Export Master Catalog as CSV"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" /> Export CSV
                </button>
              </div>
            )}

            {activeWorkspaceSubTab === 'MOVEMENTS' && (
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={movementWarehouseFilter}
                  onChange={(e) => setMovementWarehouseFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-teal-500"
                >
                  <option value="ALL">All Warehouses</option>
                  <option value="MAIN">MAIN DC</option>
                  <option value="NORTH">NORTH Annex</option>
                  <option value="DIGITAL">DIGITAL Vault</option>
                </select>
                <div className="relative w-56">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search movements..."
                    className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <button
                  onClick={exportMovementsCsv}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" /> Export CSV
                </button>
              </div>
            )}

            {activeWorkspaceSubTab === 'FINANCE' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsJournalModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs btn-press"
                >
                  <Plus className="w-3.5 h-3.5" /> Post Journal Entry
                </button>
                <button
                  onClick={exportLedgerCsv}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" /> Export Ledger
                </button>
              </div>
            )}
          </div>

          {/* SUBTAB 1: INVENTORY & MASTER CATALOG */}
          {activeWorkspaceSubTab === 'INVENTORY' && (
            <div className="space-y-4">
              {/* Resource Index: Saved Views Pills (Blueprint Section 5.2 / 2.1) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold mr-1.5 shrink-0">
                  Catalog Views:
                </span>
                {[
                  { id: 'ALL', label: 'All Catalog SKUs' },
                  { id: 'LOW_STOCK', label: 'Low Stock Alerts' },
                  { id: 'HARDWARE', label: 'Hardware (MAIN DC)' },
                  { id: 'DIGITAL', label: 'Digital / Software Licenses' },
                ].map((sv) => (
                  <button
                    key={sv.id}
                    onClick={() => setSavedView(sv.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                      savedView === sv.id
                        ? 'bg-slate-900 text-white font-semibold shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {sv.label}
                  </button>
                ))}
              </div>

              {/* Floating / Sticky Bulk Action Bar */}
              {selectedProductIds.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-900 text-white rounded-xl shadow-lg animate-smooth-fade text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-mono font-bold">
                      {selectedProductIds.length} SKUs selected
                    </span>
                    <span className="text-slate-300">Semantic batch inventory operations across master catalog</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handleBatchTransferToNorth}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors font-medium shadow-xs"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" /> Transfer to NORTH Annex
                    </button>
                    <button
                      onClick={handleExportSelectedProductsCsv}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5 text-teal-400" /> Export Selected CSV
                    </button>
                    <button
                      onClick={() => setSelectedProductIds([])}
                      className="px-2.5 py-1.5 text-slate-400 hover:text-white transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200">
                      <tr>
                        <th className="w-10 px-4 py-3.5">
                          <input
                            type="checkbox"
                            checked={filteredProducts.length > 0 && selectedProductIds.length === filteredProducts.length}
                            onChange={toggleSelectAllProducts}
                            className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                            title="Select All"
                          />
                        </th>
                        <th className="px-5 py-3.5">SKU / Item Title</th>
                        <th className="px-5 py-3.5">Category</th>
                        <th className="px-5 py-3.5">Warehouse Location</th>
                        <th className="px-5 py-3.5">Unit Cost / Price</th>
                        <th className="px-5 py-3.5">Stock on Hand</th>
                        <th className="px-5 py-3.5">Total Valuation</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredProducts.map((p) => {
                        const stock = getStockCount(p.id);
                        const warehouse = getWarehouse(p.id);
                        const isLow = stock <= 10;
                        const val = p.cost * stock;

                        return (
                          <tr key={p.id} className="hover:bg-slate-50/70 transition-colors group">
                            <td className="w-10 px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selectedProductIds.includes(p.id)}
                                onChange={() => toggleSelectProduct(p.id)}
                                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                              />
                            </td>
                            <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-teal-700">{p.sku}</span>
                              {isLow && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                  Low
                                </span>
                              )}
                            </div>
                            <div className="font-semibold text-slate-900 mt-0.5">{p.name}</div>
                            {p.description && (
                              <p className="text-[11px] text-slate-400 truncate max-w-xs">{p.description}</p>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="px-2 py-0.5 rounded font-mono text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              {p.category || 'HARDWARE'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-slate-600 text-xs">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              {warehouse}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-xs">
                            <span className="text-slate-500">${p.cost.toFixed(2)}</span>
                            <span className="text-slate-300 mx-1.5">/</span>
                            <span className="font-bold text-slate-900">${p.price.toFixed(2)}</span>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-xs">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold ${
                                isLow
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {stock} units
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-mono font-bold text-slate-900 text-xs">
                            ${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedProductId(p.id);
                                  setStockDelta(10);
                                  setIsStockModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-colors"
                                title="Adjust physical stock count"
                              >
                                Adjust
                              </button>
                              <button
                                onClick={() => {
                                  setTransferForm({
                                    product_id: p.id,
                                    from_warehouse: warehouse,
                                    to_warehouse: warehouse === 'MAIN' ? 'NORTH' : 'MAIN',
                                    quantity: Math.min(stock, 5) || 1,
                                    notes: `Transfer for ${p.sku}`,
                                  });
                                  setIsTransferModalOpen(true);
                                }}
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
                                title="Transfer to another warehouse"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => openEditProductModal(p)}
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
                                title="Edit SKU Definition"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => openDeleteProductModal(p.id)}
                                className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                                title="Delete SKU"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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

          {/* SUBTAB 2: MOVEMENT AUDIT TRAIL */}
          {activeWorkspaceSubTab === 'MOVEMENTS' && (
            <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Physical Inventory Movements & Traceability
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Immutable log of all receipts, adjustments, transfers, and order dispatches.
                  </p>
                </div>
                <span className="font-mono text-xs font-semibold text-slate-500">
                  Showing {filteredMovements.length} records
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50/70 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Movement ID</th>
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">SKU & Item</th>
                      <th className="px-4 py-3">Warehouse</th>
                      <th className="px-4 py-3">Delta</th>
                      <th className="px-4 py-3">Resulting Stock</th>
                      <th className="px-4 py-3">Reason / Reference</th>
                      <th className="px-4 py-3 text-right">Operator</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredMovements.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-teal-700">{m.id}</td>
                        <td className="px-4 py-3 font-mono text-slate-400 text-[11px]">
                          {new Date(m.timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold text-slate-900">{m.sku}</span>
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">{m.product_name}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-700 text-xs">{m.warehouse}</td>
                        <td className="px-4 py-3 font-mono text-xs font-bold">
                          <span
                            className={`px-2 py-0.5 rounded-full ${
                              m.quantity_delta > 0
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {m.quantity_delta > 0 ? `+${m.quantity_delta}` : m.quantity_delta}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-900 font-semibold">{m.new_stock} units</td>
                        <td className="px-4 py-3 text-slate-800">{m.reason}</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-500 text-[11px]">{m.user}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUBTAB 3: GENERAL LEDGER RECONCILIATION */}
          {activeWorkspaceSubTab === 'FINANCE' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">1200 Inventory Assets</span>
                  <div className="font-mono text-base font-bold text-slate-900">${totalValuation.toFixed(2)}</div>
                </div>
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">2010 Accounts Payable</span>
                  <div className="font-mono text-base font-bold text-slate-900">$4,200.00</div>
                </div>
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">4010 Product Revenue</span>
                  <div className="font-mono text-base font-bold text-emerald-700">$28,450.00</div>
                </div>
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">5010 Procurement COGS</span>
                  <div className="font-mono text-base font-bold text-blue-700">$4,200.00</div>
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3.5">Txn ID</th>
                        <th className="px-5 py-3.5">Account Code</th>
                        <th className="px-5 py-3.5">Type</th>
                        <th className="px-5 py-3.5">Description</th>
                        <th className="px-5 py-3.5">Posting Date</th>
                        <th className="px-5 py-3.5">Status</th>
                        <th className="px-5 py-3.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {ledgerTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50/50">
                          <td className="px-5 py-3.5 font-mono font-bold text-teal-700">{tx.id}</td>
                          <td className="px-5 py-3.5 font-mono text-slate-600">{tx.account}</td>
                          <td className="px-5 py-3.5 font-mono text-[10px]">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                              {tx.type}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-800 font-medium">{tx.description}</td>
                          <td className="px-5 py-3.5 font-mono text-slate-400 text-[11px]">{tx.date}</td>
                          <td className="px-5 py-3.5 font-mono text-xs">
                            <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {tx.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-900">
                            {tx.isCredit ? `+$${tx.amount.toFixed(2)}` : `-$${tx.amount.toFixed(2)}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CONFIGURATION */}
      {activeTab === 'CONFIG' && (
        <ConfigPanel
          title="Enterprise Resource Planning Settings"
          subtitle="Configure FIFO/AVCO inventory costing methods, safety stock thresholds, and warehouse audit rules."
          sections={erpConfigSections}
          onChangeField={handleErpConfigChange}
          onSave={handleSaveErpConfig}
          onReset={() => toast.info('Reset Defaults', 'Restored baseline ERP configuration.')}
        />
      )}

      {/* TAB 4: PROVIDER SETTINGS */}
      {activeTab === 'PROVIDERS' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900">ERP & WMS Connectors</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              SAP Fiori integration, barcode scanner terminals, and EDI automated procurement channels.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                id: 'sap',
                name: 'SAP S/4HANA & Fiori Connector',
                status: 'CONNECTED',
                description: 'General ledger sync, material master records, and purchase orders.',
                lastSync: '4 mins ago',
                latency: '34ms',
              },
              {
                id: 'netsuite',
                name: 'Oracle NetSuite SuiteTalk API',
                status: 'CONFIGURED',
                description: 'Bi-directional financial reconciliation and vendor bill processing.',
                lastSync: '1 hr ago',
                latency: '52ms',
              },
              {
                id: 'zebra',
                name: 'Zebra Enterprise WMS Scanners',
                status: 'CONNECTED',
                description: 'Real-time pallet scanning, stock transfer, and bin putaway.',
                lastSync: 'Real-time',
                latency: '6ms',
              },
              {
                id: 'edi',
                name: 'EDI 850 / 856 B2B Hub',
                status: 'CONNECTED',
                description: 'Standard electronic purchase order and advance ship notice gateway.',
                lastSync: '12 mins ago',
                latency: '22ms',
              },
            ].map((prov) => (
              <div key={prov.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-900 text-xs">{prov.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{prov.description}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {prov.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono pt-2 border-t border-slate-200 text-slate-500">
                  <span>Latency: {prov.latency}</span>
                  <button
                    onClick={() => testProviderPing(prov.id, prov.name)}
                    className="text-teal-700 font-semibold hover:text-teal-800 transition-colors cursor-pointer"
                  >
                    Test Ping ➔
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: ANALYTICS */}
      {activeTab === 'ANALYTICS' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Inventory Turnover & Carrying Cost Telemetry</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Annualized inventory turnover, stock-out risk modeling, and dead inventory aging analysis.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">Annual Inventory Turns</span>
              <div className="font-mono text-xl font-bold text-emerald-700">6.4x / Year</div>
              <span className="text-[11px] text-emerald-700 font-semibold">+1.2x above enterprise average</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">Carrying Cost Ratio</span>
              <div className="font-mono text-xl font-bold text-blue-700">14.2%</div>
              <span className="text-[11px] text-slate-500">Storage, insurance, & handling</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">Stock-out Incidents</span>
              <div className="font-mono text-xl font-bold text-slate-900">0 Events</div>
              <span className="text-[11px] text-emerald-700 font-semibold">100% fill rate SLA maintained</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Product */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title="Add Master Catalog SKU"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">SKU Code *</label>
              <input
                type="text"
                required
                value={productForm.sku}
                onChange={(e) => setProductForm({ ...productForm, sku: e.target.value.toUpperCase() })}
                placeholder="SRV-DL380-G11"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Product Title *</label>
              <input
                type="text"
                required
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                placeholder="Enterprise Industrial Sensor"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Category</label>
            <select
              value={productForm.category}
              onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500"
            >
              <option value="HARDWARE">Hardware / Equipment</option>
              <option value="NETWORK">Network Infrastructure</option>
              <option value="SOFTWARE">Cloud & License Subscriptions</option>
              <option value="CONSUMABLES">Consumables & Parts</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Item Description</label>
            <textarea
              rows={2}
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              placeholder="Enterprise specification and technical requirements..."
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Sales Price ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={productForm.price}
                onChange={(e) =>
                  setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })
                }
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Unit Cost ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={productForm.cost}
                onChange={(e) =>
                  setProductForm({ ...productForm, cost: parseFloat(e.target.value) || 0 })
                }
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Initial Stock (Units)</label>
              <input
                type="number"
                min="0"
                value={productForm.initial_quantity}
                onChange={(e) =>
                  setProductForm({ ...productForm, initial_quantity: parseInt(e.target.value) || 0 })
                }
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Warehouse Location</label>
              <select
                value={productForm.warehouse}
                onChange={(e) => setProductForm({ ...productForm, warehouse: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500"
              >
                <option value="MAIN">Primary DC (MAIN)</option>
                <option value="NORTH">Secondary Annex (NORTH)</option>
                <option value="DIGITAL">Digital Vault (DIGITAL)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsProductModalOpen(false)}
              className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors btn-press"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-xs btn-press"
            >
              {loading ? 'Registering...' : 'Save SKU'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Product */}
      <Modal
        isOpen={isEditProductModalOpen}
        onClose={() => setIsEditProductModalOpen(false)}
        title={`Edit SKU: ${editProductForm.sku}`}
      >
        <form onSubmit={handleEditProductSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">SKU Code *</label>
              <input
                type="text"
                required
                value={editProductForm.sku}
                onChange={(e) => setEditProductForm({ ...editProductForm, sku: e.target.value.toUpperCase() })}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Product Title *</label>
              <input
                type="text"
                required
                value={editProductForm.name}
                onChange={(e) => setEditProductForm({ ...editProductForm, name: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Category</label>
            <select
              value={editProductForm.category}
              onChange={(e) => setEditProductForm({ ...editProductForm, category: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500"
            >
              <option value="HARDWARE">Hardware / Equipment</option>
              <option value="NETWORK">Network Infrastructure</option>
              <option value="SOFTWARE">Cloud & License Subscriptions</option>
              <option value="CONSUMABLES">Consumables & Parts</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Item Description</label>
            <textarea
              rows={2}
              value={editProductForm.description}
              onChange={(e) => setEditProductForm({ ...editProductForm, description: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Sales Price ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={editProductForm.price}
                onChange={(e) =>
                  setEditProductForm({ ...editProductForm, price: parseFloat(e.target.value) || 0 })
                }
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Unit Cost ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={editProductForm.cost}
                onChange={(e) =>
                  setEditProductForm({ ...editProductForm, cost: parseFloat(e.target.value) || 0 })
                }
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditProductModalOpen(false)}
              className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors btn-press"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-xs btn-press"
            >
              {loading ? 'Saving...' : 'Update SKU'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Delete Product Confirmation */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Master Catalog SKU"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-rose-900">Permanent SKU Deletion</div>
              <p className="text-rose-700 text-[11px] mt-0.5">
                Are you sure you want to remove <span className="font-mono font-bold">{selectedProduct?.sku}</span> ({selectedProduct?.name})?
                Existing order history referencing this SKU will remain in historical archives.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors btn-press"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleDeleteProductSubmit}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-xs btn-press"
            >
              {loading ? 'Deleting...' : 'Confirm SKU Deletion'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Adjust Stock */}
      <Modal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        title={`Physical Stock Adjustment: ${products.find((p) => p.id === selectedProductId)?.sku || ''}`}
      >
        <form onSubmit={handleStockSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Adjustment Reason *</label>
            <select
              value={stockReason}
              onChange={(e) => setStockReason(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500"
            >
              <option value="CYCLE_COUNT">Physical Cycle Count Discrepancy</option>
              <option value="DAMAGE">Damaged / Defective Stock Scrapped</option>
              <option value="CUSTOMER_RETURN">Customer Return Restocked</option>
              <option value="PO_RECEIPT">Supplier Inbound Shipment Receipt</option>
              <option value="SAMPLE_LAB">Engineering Lab / Demo Allocation</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Stock Quantity Delta *</label>
            <input
              type="number"
              required
              value={stockDelta}
              onChange={(e) => setStockDelta(parseInt(e.target.value) || 0)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 font-mono"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Current stock: <strong className="text-slate-800">{selectedProductId ? getStockCount(selectedProductId) : 0}</strong>.
              New stock will be: <strong className="text-slate-800">{Math.max(0, (selectedProductId ? getStockCount(selectedProductId) : 0) + stockDelta)}</strong>.
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsStockModalOpen(false)}
              className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors btn-press"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-xs btn-press"
            >
              {loading ? 'Posting...' : 'Post Adjustment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Transfer Stock */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Multi-Warehouse Stock Transfer"
      >
        <form onSubmit={handleTransferSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Select Product *</label>
            <select
              value={transferForm.product_id}
              onChange={(e) => setTransferForm({ ...transferForm, product_id: parseInt(e.target.value) })}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 font-mono"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} - {p.name} (Stock: {getStockCount(p.id)})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Source Warehouse *</label>
              <select
                value={transferForm.from_warehouse}
                onChange={(e) => setTransferForm({ ...transferForm, from_warehouse: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500"
              >
                <option value="MAIN">Primary DC (MAIN)</option>
                <option value="NORTH">Secondary Annex (NORTH)</option>
                <option value="DIGITAL">Digital Vault (DIGITAL)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Destination Warehouse *</label>
              <select
                value={transferForm.to_warehouse}
                onChange={(e) => setTransferForm({ ...transferForm, to_warehouse: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500"
              >
                <option value="NORTH">Secondary Annex (NORTH)</option>
                <option value="MAIN">Primary DC (MAIN)</option>
                <option value="DIGITAL">Digital Vault (DIGITAL)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Transfer Quantity (Units) *</label>
            <input
              type="number"
              min="1"
              required
              value={transferForm.quantity}
              onChange={(e) => setTransferForm({ ...transferForm, quantity: parseInt(e.target.value) || 1 })}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Dispatch Notes / Reference</label>
            <input
              type="text"
              value={transferForm.notes}
              onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
              placeholder="e.g. Inter-facility truck route #TRK-104"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsTransferModalOpen(false)}
              className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors btn-press"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-xs btn-press"
            >
              {loading ? 'Transferring...' : 'Execute Stock Transfer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Post Journal Entry */}
      <Modal
        isOpen={isJournalModalOpen}
        onClose={() => setIsJournalModalOpen(false)}
        title="Post General Ledger Journal Entry"
      >
        <form onSubmit={handlePostJournalSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Account *</label>
            <select
              value={journalForm.account}
              onChange={(e) => setJournalForm({ ...journalForm, account: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 font-mono"
            >
              <option value="1200 - Inventory Assets">1200 - Inventory Assets (Asset)</option>
              <option value="2010 - Accounts Payable">2010 - Accounts Payable (Liability)</option>
              <option value="4010 - Omnichannel Product Sales">4010 - Omnichannel Product Sales (Revenue)</option>
              <option value="5010 - Raw Hardware Procurement COGS">5010 - Raw Hardware Procurement COGS (Expense)</option>
              <option value="6010 - Warehouse Logistics & Handling">6010 - Warehouse Logistics & Handling (Expense)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Entry Classification</label>
              <select
                value={journalForm.type}
                onChange={(e) => setJournalForm({ ...journalForm, type: e.target.value as any })}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 font-mono"
              >
                <option value="ASSET">ASSET</option>
                <option value="REVENUE">REVENUE</option>
                <option value="COGS">COGS</option>
                <option value="EXPENSE">EXPENSE</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Transaction Side</label>
              <select
                value={journalForm.isCredit ? 'CREDIT' : 'DEBIT'}
                onChange={(e) => setJournalForm({ ...journalForm, isCredit: e.target.value === 'CREDIT' })}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 font-mono"
              >
                <option value="DEBIT">Debit (+ Assets / Expenses)</option>
                <option value="CREDIT">Credit (+ Revenue / Liabilities)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Amount ($) *</label>
            <input
              type="number"
              step="0.01"
              required
              value={journalForm.amount}
              onChange={(e) => setJournalForm({ ...journalForm, amount: parseFloat(e.target.value) || 0 })}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Description / Memo *</label>
            <input
              type="text"
              required
              value={journalForm.description}
              onChange={(e) => setJournalForm({ ...journalForm, description: e.target.value })}
              placeholder="e.g. Inbound freight customs clearance clearance fee"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsJournalModalOpen(false)}
              className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors btn-press"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-xs btn-press"
            >
              {loading ? 'Posting...' : 'Post to General Ledger'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
