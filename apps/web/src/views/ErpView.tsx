import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Product, InventoryItem } from '../types';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { MetricCard } from '../components/MetricCard';
import { ConfigPanel, ConfigSection } from '../components/ConfigPanel';

interface ErpViewProps {
  products: Product[];
  inventory: InventoryItem[];
  onCreateProduct: (product: any) => Promise<void>;
  onAdjustStock: (adj: any) => Promise<void>;
}

export const ErpView: React.FC<ErpViewProps> = ({
  products,
  inventory,
  onCreateProduct,
  onAdjustStock,
}) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'WORKSPACE' | 'CONFIG' | 'PROVIDERS' | 'ANALYTICS'>('WORKSPACE');
  const [activeWorkspaceSubTab, setActiveWorkspaceSubTab] = useState<'INVENTORY' | 'FINANCE'>('INVENTORY');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

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

  const [stockDelta, setStockDelta] = useState(10);
  const [loading, setLoading] = useState(false);

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
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStock = !filterLowStockOnly || stock <= 10;
    return matchesSearch && matchesStock;
  });

  // Calculate ERP Metrics
  const lowStockCount = products.filter((p) => getStockCount(p.id) <= 10).length;
  const totalValuation = products.reduce((acc, p) => acc + p.cost * getStockCount(p.id), 0);
  const potentialRevenue = products.reduce((acc, p) => acc + p.price * getStockCount(p.id), 0);

  // Mock Ledger Transactions
  const ledgerTransactions = [
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
      account: '5010 - Raw Hardware Material Procurement',
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
  ];

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

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;
    setLoading(true);
    try {
      await onAdjustStock({
        product_id: selectedProductId,
        quantity_delta: stockDelta,
        reason: 'Manual warehouse count update',
      });
      setIsStockModalOpen(false);
      toast.success(
        'Stock Adjusted',
        `Adjusted product #${selectedProductId} by ${stockDelta > 0 ? `+${stockDelta}` : stockDelta} units.`
      );
    } catch {
      toast.error('Adjustment Failed', 'Could not record inventory count change.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-smooth-fade">
      {/* Header & 5 Standard Module Tabs */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Enterprise Resource Planning (ERP)</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                ERP Core
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-warehouse inventory, master SKU catalog, FIFO costing, and ledger reconciliation.
            </p>
          </div>

          <div className="flex items-center gap-2">
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
            { id: 'PROVIDERS', label: 'Provider Settings' },
            { id: 'ANALYTICS', label: 'Analytics' },
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
              subtext="Hardware & licenses"
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
                <h3 className="text-sm font-bold text-slate-900">Warehouse Capacity Allocation</h3>
                <span className="font-mono text-xs text-slate-500">2 Physical Hubs + 1 Cloud</span>
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
                  <p className="text-xs text-slate-500 mt-0.5">ERP chart of accounts.</p>
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
                </div>
              </div>
              <button
                onClick={() => setActiveTab('WORKSPACE')}
                className="mt-4 w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
              >
                Open SKU Workspace ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WORKSPACE */}
      {activeTab === 'WORKSPACE' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
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
                onClick={() => setActiveWorkspaceSubTab('FINANCE')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeWorkspaceSubTab === 'FINANCE'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                General Ledger Reconciliation
              </button>
            </div>

            {activeWorkspaceSubTab === 'INVENTORY' && (
              <div className="flex items-center gap-2">
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
                <div className="relative w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search SKU, product..."
                    className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            )}
          </div>

          {activeWorkspaceSubTab === 'INVENTORY' ? (
            <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5">SKU / Item Title</th>
                      <th className="px-5 py-3.5">Category</th>
                      <th className="px-5 py-3.5">Warehouse Location</th>
                      <th className="px-5 py-3.5">Unit Cost / Price</th>
                      <th className="px-5 py-3.5">Stock on Hand</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredProducts.map((p) => {
                      const stock = getStockCount(p.id);
                      const warehouse = getWarehouse(p.id);
                      const isLow = stock <= 10;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-5 py-3.5">
                            <span className="font-mono font-bold text-teal-700">{p.sku}</span>
                            <div className="font-semibold text-slate-900 mt-0.5">{p.name}</div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="px-2 py-0.5 rounded font-mono text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              {p.category || 'HARDWARE'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-slate-600 text-xs">
                            {warehouse}
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
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => {
                                setSelectedProductId(p.id);
                                setIsStockModalOpen(true);
                              }}
                              className="px-3 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-colors"
                            >
                              Adjust Stock
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5">Txn ID</th>
                      <th className="px-5 py-3.5">Account Code</th>
                      <th className="px-5 py-3.5">Description</th>
                      <th className="px-5 py-3.5">Posting Date</th>
                      <th className="px-5 py-3.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {ledgerTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50">
                        <td className="px-5 py-3.5 font-mono font-bold text-teal-700">{tx.id}</td>
                        <td className="px-5 py-3.5 font-mono text-slate-600">{tx.account}</td>
                        <td className="px-5 py-3.5 text-slate-800 font-medium">{tx.description}</td>
                        <td className="px-5 py-3.5 font-mono text-slate-400 text-[11px]">{tx.date}</td>
                        <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-900">
                          {tx.isCredit ? `+$${tx.amount.toFixed(2)}` : `-$${tx.amount.toFixed(2)}`}
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
                    onClick={() => toast.success('Connection Verified', `${prov.name} handshake active.`)}
                    className="text-teal-700 font-semibold hover:text-teal-800"
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
                onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                placeholder="SRV-DL380-G11"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 font-mono"
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Sales Price ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={productForm.price}
                onChange={(e) =>
                  setProductForm({ ...productForm, price: parseFloat(e.target.value) })
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
                value={productForm.cost}
                onChange={(e) =>
                  setProductForm({ ...productForm, cost: parseFloat(e.target.value) })
                }
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 font-mono"
              />
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

      {/* Modal: Adjust Stock */}
      <Modal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        title="Physical Stock Adjustment"
      >
        <form onSubmit={handleStockSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Stock Quantity Delta *</label>
            <input
              type="number"
              required
              value={stockDelta}
              onChange={(e) => setStockDelta(parseInt(e.target.value))}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 font-mono"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Enter positive value to add stock, negative to relieve stock.
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
    </div>
  );
};
