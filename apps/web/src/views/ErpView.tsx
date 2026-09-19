import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Product, InventoryItem } from '../types';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { MetricCard } from '../components/MetricCard';

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
  const [activeErpTab, setActiveErpTab] = useState<'INVENTORY' | 'FINANCE'>('INVENTORY');
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

  // Calculate SAP Fiori Inventory Metrics
  const totalProductsCount = products.length;
  const lowStockCount = products.filter((p) => getStockCount(p.id) <= 10).length;
  const incomingShipments = 145;
  const outgoingOrders = 38;

  // Calculate SAP Fiori Finance Metrics
  const totalRevenue = products.reduce((acc, p) => acc + p.price * 12, 48250.0);
  const totalCost = products.reduce((acc, p) => acc + p.cost * 12, 19300.0);
  const grossProfit = totalRevenue - totalCost;
  const profitMargin = Math.round((grossProfit / totalRevenue) * 100);

  // Mock General Ledger Transactions
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
      toast.success('Product Added', `${productForm.name} added to catalog.`);
    } catch {
      toast.error('Error', 'Failed to register product SKU.');
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
        delta: stockDelta,
      });
      setIsStockModalOpen(false);
      toast.success('Stock Adjusted', `Inventory count updated successfully.`);
    } catch {
      toast.error('Error', 'Failed to adjust physical stock.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Enterprise Resource Planning (ERP)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time inventory ATP, warehouse bins, and financial general ledger.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeErpTab === 'INVENTORY' && (
            <button
              onClick={() => setIsProductModalOpen(true)}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium px-3.5 py-1.5 rounded-lg text-xs transition-all shadow-xs shrink-0 btn-press"
            >
              <Plus className="w-3.5 h-3.5" /> Add Catalog SKU
            </button>
          )}
        </div>
      </div>

      {/* Sub-Navigation Tabs: Inventory vs Finance */}
      <div className="flex items-center gap-1 border-b border-slate-200/80 pb-2">
        <button
          onClick={() => setActiveErpTab('INVENTORY')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeErpTab === 'INVENTORY'
              ? 'bg-slate-900 text-white font-semibold shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Inventory & Stock ATP
        </button>

        <button
          onClick={() => setActiveErpTab('FINANCE')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeErpTab === 'FINANCE'
              ? 'bg-slate-900 text-white font-semibold shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          General Ledger & Accounting
        </button>
      </div>

      {/* TAB 1: INVENTORY */}
      {activeErpTab === 'INVENTORY' && (
        <div className="space-y-6 animate-smooth-fade">
          {/* Inventory Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <MetricCard
              title="Total Products"
              value={totalProductsCount}
              change={8.5}
              period="active SKUs"
              sparklineData={[18, 22, 25, 28, totalProductsCount]}
            />
            <MetricCard
              title="Low Stock"
              value={lowStockCount}
              change={-12.0}
              period="threshold < 10"
            />
            <MetricCard
              title="Incoming Stock"
              value={`${incomingShipments} Units`}
              change={24.0}
              period="supplier in-transit"
              sparklineData={[80, 110, 130, 145]}
            />
            <MetricCard
              title="Outgoing Orders"
              value={`${outgoingOrders} Orders`}
              change={14.2}
              period="picking & dispatch"
              sparklineData={[20, 26, 32, 38]}
            />
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all btn-press ${
                  filterLowStockOnly
                    ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {filterLowStockOnly ? '✓ Showing Low Stock Only' : 'Filter Low Stock'}
              </button>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SKU or product title..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">SKU / Item Name</th>
                    <th className="px-5 py-3.5">Warehouse Location</th>
                    <th className="px-5 py-3.5">Stock on Hand</th>
                    <th className="px-5 py-3.5">Availability Status</th>
                    <th className="px-5 py-3.5">Unit Price / Cost</th>
                    <th className="px-5 py-3.5 text-right">Quick Stock Adjustment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        No catalog items match criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const stock = getStockCount(p.id);
                      const warehouse = getWarehouse(p.id);
                      const isLow = stock <= 10;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="font-mono font-bold text-teal-700">{p.sku}</div>
                            <div className="font-semibold text-slate-900 text-xs mt-0.5">{p.name}</div>
                          </td>

                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center font-mono text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                              WH-{warehouse} · Bay A3
                            </span>
                          </td>

                          <td className="px-5 py-3.5 font-mono font-bold text-base text-slate-900">
                            {stock}
                          </td>

                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold ${
                                isLow
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {isLow ? 'LOW STOCK' : 'AVAILABLE'}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 font-mono text-xs">
                            <div className="text-slate-900 font-bold">${p.price.toFixed(2)}</div>
                            <div className="text-[10px] text-slate-500">Cost: ${p.cost.toFixed(2)}</div>
                          </td>

                          <td className="px-5 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProductId(p.id);
                                setIsStockModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-teal-700 rounded-lg font-semibold text-xs transition-colors btn-press"
                            >
                              Adjust Stock
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FINANCE */}
      {activeErpTab === 'FINANCE' && (
        <div className="space-y-6 animate-smooth-fade">
          {/* Finance Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <MetricCard
              title="Revenue"
              value={`$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              change={16.4}
              period="gross billing"
              sparklineData={[32000, 38000, 42000, 48250]}
            />
            <MetricCard
              title="Cost of Goods (COGS)"
              value={`$${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              change={4.2}
              period="procurement"
              sparklineData={[15000, 16500, 18000, 19300]}
            />
            <MetricCard
              title="Gross Profit"
              value={`$${grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              change={22.5}
              target="60% margin"
              period={`${profitMargin}% margin`}
              sparklineData={[17000, 21500, 24000, 28950]}
            />
            <MetricCard
              title="Transactions"
              value={ledgerTransactions.length}
              change={8.0}
              period="journal lines"
            />
          </div>

          {/* Transactions Ledger Table */}
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs">General Ledger Transactions</span>
              <span className="text-[11px] font-mono text-slate-500">
                Period: Fiscal Year 2026 Q3 (Open)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Transaction ID</th>
                    <th className="px-5 py-3.5">Account Code & Name</th>
                    <th className="px-5 py-3.5">Description</th>
                    <th className="px-5 py-3.5">Debit / Credit</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {ledgerTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-teal-700">{tx.id}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900">{tx.account}</td>
                      <td className="px-5 py-3.5 text-slate-500">{tx.description}</td>
                      <td className="px-5 py-3.5 font-mono font-bold">
                        <span className={tx.isCredit ? 'text-emerald-700' : 'text-rose-700'}>
                          {tx.isCredit ? '+' : '-'}${tx.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-slate-400 text-[11px]">
                        {tx.date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Product */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title="Register Product SKU in Catalog"
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
                placeholder="SKU-PRO-001"
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
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-xs btn-press"
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
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-xs btn-press"
            >
              {loading ? 'Posting...' : 'Post Adjustment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
