import React, { useState } from 'react';
import {
  Plus,
  SlidersHorizontal,
  AlertCircle,
  CheckCircle2,
  LayoutGrid,
  List,
  Search,
  Boxes,
  Minus,
} from 'lucide-react';
import { Product, InventoryItem } from '../types';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';

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
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);

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

  const filteredProducts = products.filter((p) => {
    const stock = getStockCount(p.id);
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStock = !filterLowStockOnly || stock <= 10;
    return matchesSearch && matchesStock;
  });

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
      toast.success('Stock Adjusted', `Inventory delta of ${stockDelta > 0 ? `+${stockDelta}` : stockDelta} applied.`);
    } catch {
      toast.error('Adjustment Failed', 'Insufficient stock or inventory error.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdjust = async (productId: number, delta: number) => {
    try {
      await onAdjustStock({
        product_id: productId,
        quantity_delta: delta,
        warehouse: 'MAIN',
      });
      toast.success('Stock Updated', `${delta > 0 ? `+${delta}` : delta} items updated.`);
    } catch {
      toast.error('Failed', 'Could not adjust stock level.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">ERP Catalog & Inventory</h2>
          <p className="text-xs text-slate-400 mt-1">
            Product catalog, multi-warehouse stock levels, reorder thresholds, and quick adjustments.
          </p>
        </div>
        <button
          onClick={() => setIsProductModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-semibold px-4 py-2 rounded-xl text-xs transition-all shadow-lg shadow-teal-500/10 shrink-0"
        >
          <Plus className="w-4 h-4" /> New Product
        </button>
      </div>

      {/* Filter and View Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-950/40 p-3 rounded-2xl border border-slate-800/80">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Low Stock Filter Button */}
          <button
            onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterLowStockOnly
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            Low Stock Alerts Only
          </button>

          {/* View Mode Toggle */}
          <div className="flex bg-slate-900 p-0.5 rounded-xl border border-slate-800 ml-auto sm:ml-0">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'table' ? 'bg-slate-800 text-teal-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'grid' ? 'bg-slate-800 text-teal-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search SKU or product name..."
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>
      </div>

      {/* Grid Mode View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((p) => {
            const stock = getStockCount(p.id);
            const isLow = stock <= 10;
            const stockPercentage = Math.min(100, Math.round((stock / 30) * 100));

            return (
              <div
                key={p.id}
                className="bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all backdrop-blur-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center font-bold">
                      <Boxes className="w-5 h-5" />
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold ${
                        isLow
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {isLow ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                      {stock} in stock
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-100 text-sm">{p.name}</h3>
                  <span className="font-mono text-xs text-teal-400 block mt-0.5">{p.sku}</span>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">{p.description || 'Enterprise catalog item.'}</p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800/80">
                  {/* Stock Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Stock Capacity</span>
                      <span className="font-mono">{stock} / 30 units</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isLow ? 'bg-amber-400' : 'bg-teal-400'
                        }`}
                        style={{ width: `${stockPercentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-base font-bold text-slate-100">${p.price.toFixed(2)}</div>
                      <div className="text-[10px] text-slate-500">Cost: ${p.cost.toFixed(2)}</div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleQuickAdjust(p.id, -1)}
                        className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-rose-400 transition-colors"
                        title="Deduct 1"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleQuickAdjust(p.id, 1)}
                        className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-teal-400 transition-colors"
                        title="Add 1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProductId(p.id);
                          setIsStockModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Adjust
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table Mode View */
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">SKU & Item Name</th>
                  <th className="px-6 py-3.5">Unit Price / Cost</th>
                  <th className="px-6 py-3.5">Inventory Level</th>
                  <th className="px-6 py-3.5">Quick Adjust</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No products found.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const stock = getStockCount(p.id);
                    const isLow = stock <= 10;
                    return (
                      <tr key={p.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-100">{p.name}</div>
                          <div className="text-[11px] text-teal-400 font-mono mt-0.5">{p.sku}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-200">${p.price.toFixed(2)}</div>
                          <div className="text-[11px] text-slate-500">Cost: ${p.cost.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[11px] font-semibold ${
                              isLow
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {isLow ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                            {stock} in stock
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleQuickAdjust(p.id, -1)}
                              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-slate-300 hover:text-rose-400 text-xs font-mono transition-colors"
                            >
                              -1
                            </button>
                            <button
                              onClick={() => handleQuickAdjust(p.id, 1)}
                              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-slate-300 hover:text-teal-400 text-xs font-mono transition-colors"
                            >
                              +1
                            </button>
                            <button
                              onClick={() => handleQuickAdjust(p.id, 10)}
                              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-slate-300 hover:text-teal-400 text-xs font-mono transition-colors"
                            >
                              +10
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedProductId(p.id);
                              setIsStockModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded-xl text-xs font-semibold transition-colors"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" /> Adjust Custom
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
      )}

      {/* Modal: New Product */}
      <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title="Catalog New Product">
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                placeholder="Enterprise Software License"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Unit Price ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Unit Cost ($)</label>
              <input
                type="number"
                step="0.01"
                value={productForm.cost}
                onChange={(e) => setProductForm({ ...productForm, cost: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Initial Quantity</label>
              <input
                type="number"
                value={productForm.initial_quantity}
                onChange={(e) =>
                  setProductForm({ ...productForm, initial_quantity: parseInt(e.target.value) || 0 })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Warehouse</label>
              <input
                type="text"
                value={productForm.warehouse}
                onChange={(e) => setProductForm({ ...productForm, warehouse: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsProductModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Catalog Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Adjust Stock */}
      <Modal isOpen={isStockModalOpen} onClose={() => setIsStockModalOpen(false)} title="Adjust Warehouse Inventory">
        <form onSubmit={handleStockSubmit} className="space-y-4 text-xs">
          <p className="text-slate-400">
            Enter a positive amount to restock, or negative amount to deduct from warehouse:
          </p>
          <div>
            <label className="block text-slate-400 font-medium mb-1">Quantity Delta</label>
            <input
              type="number"
              required
              value={stockDelta}
              onChange={(e) => setStockDelta(parseInt(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsStockModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold transition-colors disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Apply Stock Change'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
