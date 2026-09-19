import React, { useState } from 'react';
import {
  Plus,
  AlertCircle,
  CheckCircle2,
  Search,
  Boxes,
  Building2,
  DollarSign,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';
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
  const incomingShipments = 145; // Units in transit from suppliers
  const outgoingOrders = 38; // Units pending dispatch

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
      date: 'Sep 18, 2026',
      type: 'COGS',
      account: '5010 - Cost of Goods Sold',
      description: 'Inventory relief for ORD-2026-0919-01',
      amount: 4340.0,
      isCredit: false,
      status: 'POSTED',
    },
    {
      id: 'TXN-2026-0917-03',
      date: 'Sep 17, 2026',
      type: 'PAYROLL',
      account: '6010 - Warehouse Operations Wages',
      description: 'Bi-weekly fulfillment labor run',
      amount: 8200.0,
      isCredit: false,
      status: 'RECONCILED',
    },
    {
      id: 'TXN-2026-0915-04',
      date: 'Sep 15, 2026',
      type: 'SUPPLIER_PO',
      account: '2010 - Accounts Payable',
      description: 'Supplier PO #9019 Raw Materials',
      amount: 14500.0,
      isCredit: false,
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
      toast.error('Error', 'Could not add product.');
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
        warehouse: 'MAIN',
      });
      setIsStockModalOpen(false);
      toast.success('Stock Adjusted', `Inventory count updated successfully.`);
    } catch {
      toast.error('Error', 'Stock adjustment failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">
            Enterprise Resource Planning (ERP)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            SAP Fiori design layout: Real-time inventory ATP, warehouse bins, and financial general ledger.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeErpTab === 'INVENTORY' && (
            <button
              onClick={() => setIsProductModalOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-lg shadow-teal-500/10 shrink-0"
            >
              <Plus className="w-4 h-4" /> Add Catalog SKU
            </button>
          )}
        </div>
      </div>

      {/* SAP Fiori Sub-Navigation Tabs: Inventory vs Finance */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
        <button
          onClick={() => setActiveErpTab('INVENTORY')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeErpTab === 'INVENTORY'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Boxes className="w-4 h-4" />
          Warehouse & Inventory Management
        </button>

        <button
          onClick={() => setActiveErpTab('FINANCE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeErpTab === 'FINANCE'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Financial Ledger & Controlling
        </button>
      </div>

      {/* TAB 1: SAP FIORI INVENTORY */}
      {activeErpTab === 'INVENTORY' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Inventory Overview Cards (Total Products, Low Stock, Incoming, Outgoing) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Products"
              value={totalProductsCount}
              change={8.5}
              period="active SKUs"
              icon={Boxes}
              colorScheme="teal"
              sparklineData={[18, 22, 25, 28, totalProductsCount]}
            />
            <MetricCard
              title="Low Stock"
              value={lowStockCount}
              change={-12.0}
              period="reorder threshold < 10"
              icon={AlertCircle}
              colorScheme="rose"
            />
            <MetricCard
              title="Incoming"
              value={`${incomingShipments} Units`}
              change={24.0}
              period="supplier PO in-transit"
              icon={ArrowDownLeft}
              colorScheme="blue"
            />
            <MetricCard
              title="Outgoing"
              value={`${outgoingOrders} Orders`}
              change={14.2}
              period="picking & dispatch"
              icon={ArrowUpRight}
              colorScheme="amber"
            />
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filterLowStockOnly
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800'
                }`}
              >
                {filterLowStockOnly ? '✓ Showing Low Stock Only' : 'Filter Low Stock'}
              </button>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SKU or product title..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Inventory Table (SKU, Warehouse, Quantity, Status) */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">SKU / Item Name</th>
                    <th className="px-5 py-3.5">Warehouse Location</th>
                    <th className="px-5 py-3.5">Stock on Hand</th>
                    <th className="px-5 py-3.5">Availability Status</th>
                    <th className="px-5 py-3.5">Unit Price / Cost</th>
                    <th className="px-5 py-3.5 text-right">Quick Stock Adjustment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        No catalog items match criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const stock = getStockCount(p.id);
                      const warehouse = getWarehouse(p.id);
                      const isLow = stock <= 10;

                      return (
                        <tr key={p.id} className="hover:bg-slate-900/50 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="font-mono font-bold text-teal-400">{p.sku}</div>
                            <div className="font-semibold text-slate-100 text-xs mt-0.5">{p.name}</div>
                          </td>

                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-slate-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                              <Building2 className="w-3.5 h-3.5 text-slate-500" />
                              WH-{warehouse} (Bay A3)
                            </span>
                          </td>

                          <td className="px-5 py-3.5 font-mono font-bold text-base text-slate-100">
                            {stock}
                          </td>

                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold ${
                                isLow
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              {isLow ? (
                                <>
                                  <AlertCircle className="w-3 h-3" /> LOW STOCK
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3 h-3" /> AVAILABLE
                                </>
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 font-mono text-xs">
                            <div className="text-slate-100 font-bold">${p.price.toFixed(2)}</div>
                            <div className="text-[10px] text-slate-500">Cost: ${p.cost.toFixed(2)}</div>
                          </td>

                          <td className="px-5 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProductId(p.id);
                                setIsStockModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-teal-400 rounded-xl font-semibold text-xs transition-colors"
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

      {/* TAB 2: SAP FIORI FINANCE */}
      {activeErpTab === 'FINANCE' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Finance Overview Cards (Revenue, Cost, Profit, Transactions) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Revenue"
              value={`$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              change={16.4}
              period="gross billing"
              icon={DollarSign}
              colorScheme="emerald"
            />
            <MetricCard
              title="Cost of Goods (COGS)"
              value={`$${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              change={4.2}
              period="material & procurement"
              icon={Receipt}
              colorScheme="rose"
            />
            <MetricCard
              title="Gross Profit"
              value={`$${grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              change={22.5}
              target="60% margin"
              period={`${profitMargin}% margin`}
              icon={TrendingUp}
              colorScheme="teal"
            />
            <MetricCard
              title="Transactions"
              value={ledgerTransactions.length}
              change={8.0}
              period="ledger journal lines"
              icon={FileSpreadsheet}
              colorScheme="indigo"
            />
          </div>

          {/* Transactions Ledger Table */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <span className="font-bold text-slate-100 text-xs">General Ledger Transactions</span>
              <span className="text-[11px] font-mono text-slate-400">
                Period: Fiscal Year 2026 Q3 (Open)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900/60 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Transaction ID</th>
                    <th className="px-5 py-3.5">Account Code & Name</th>
                    <th className="px-5 py-3.5">Description</th>
                    <th className="px-5 py-3.5">Debit / Credit</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {ledgerTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-teal-400">{tx.id}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-100">{tx.account}</td>
                      <td className="px-5 py-3.5 text-slate-400">{tx.description}</td>
                      <td className="px-5 py-3.5 font-mono font-bold">
                        <span className={tx.isCredit ? 'text-emerald-400' : 'text-rose-400'}>
                          {tx.isCredit ? '+' : '-'}${tx.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-slate-500 text-[11px]">
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
        title="Register Product SKU in SAP Catalog"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">SKU Code *</label>
              <input
                type="text"
                required
                value={productForm.sku}
                onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                placeholder="SKU-PRO-001"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Product Title *</label>
              <input
                type="text"
                required
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                placeholder="Enterprise Industrial Sensor"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Sales Price ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={productForm.price}
                onChange={(e) =>
                  setProductForm({ ...productForm, price: parseFloat(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Unit Cost ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={productForm.cost}
                onChange={(e) =>
                  setProductForm({ ...productForm, cost: parseFloat(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsProductModalOpen(false)}
              className="px-4 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold rounded-lg transition-colors disabled:opacity-50"
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
            <label className="block text-slate-400 font-medium mb-1">Stock Quantity Delta *</label>
            <input
              type="number"
              required
              value={stockDelta}
              onChange={(e) => setStockDelta(parseInt(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Enter positive value to add stock, negative to relieve stock.
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsStockModalOpen(false)}
              className="px-4 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Posting...' : 'Post Adjustment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
