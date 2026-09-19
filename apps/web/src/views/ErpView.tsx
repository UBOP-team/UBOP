import React, { useState } from 'react';
import { Plus, SlidersHorizontal, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Product, InventoryItem } from '../types';
import { Modal } from '../components/Modal';

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
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const [productForm, setProductForm] = useState({
    sku: '',
    name: '',
    description: '',
    price: 0,
    cost: 0,
    initial_quantity: 10,
    warehouse: 'MAIN',
  });

  const [stockDelta, setStockDelta] = useState(10);
  const [loading, setLoading] = useState(false);

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
        price: 0,
        cost: 0,
        initial_quantity: 10,
        warehouse: 'MAIN',
      });
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
    } finally {
      setLoading(false);
    }
  };

  const getStockCount = (productId: number) => {
    const item = inventory.find((i) => i.product_id === productId);
    return item ? item.quantity : 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Enterprise Resource Planning & Stock</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time product master catalog, multi-warehouse levels, and inventory ledger.
          </p>
        </div>
        <button
          onClick={() => setIsProductModalOpen(true)}
          className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold px-4 py-2 rounded-xl text-xs transition-colors shadow-lg shadow-teal-500/10"
        >
          <Plus className="w-4 h-4" /> New Product
        </button>
      </div>

      {/* Catalog Table */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
              <tr>
                <th className="px-6 py-3.5">SKU & Item Name</th>
                <th className="px-6 py-3.5">Unit Price / Cost</th>
                <th className="px-6 py-3.5">Inventory Level</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    No products cataloged yet.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const stock = getStockCount(p.id);
                  const isLow = stock <= 10;
                  return (
                    <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
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
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {isLow ? (
                            <AlertCircle className="w-3 h-3 text-amber-400" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          )}
                          {stock} in stock
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedProductId(p.id);
                            setIsStockModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-medium transition-colors"
                        >
                          <SlidersHorizontal className="w-3 h-3" /> Adjust
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

      {/* Modal: New Product */}
      <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title="Add Product to ERP Catalog">
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
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
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
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
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
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Unit Cost ($)</label>
              <input
                type="number"
                step="0.01"
                value={productForm.cost}
                onChange={(e) => setProductForm({ ...productForm, cost: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Initial Quantity</label>
              <input
                type="number"
                value={productForm.initial_quantity}
                onChange={(e) => setProductForm({ ...productForm, initial_quantity: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Warehouse</label>
              <input
                type="text"
                value={productForm.warehouse}
                onChange={(e) => setProductForm({ ...productForm, warehouse: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
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
              className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold transition-colors disabled:opacity-50"
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
            Enter a positive amount to restock, or negative amount to deduct:
          </p>
          <div>
            <label className="block text-slate-400 font-medium mb-1">Quantity Delta</label>
            <input
              type="number"
              required
              value={stockDelta}
              onChange={(e) => setStockDelta(parseInt(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
            />
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
              className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Apply Stock Change'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
