import React, { useState } from 'react';
import { Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Customer, Product } from '../../types';
import { Modal } from '../Modal';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  products: Product[];
  onSubmit: (orderData: any) => Promise<void>;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  onClose,
  customers,
  products,
  onSubmit,
}) => {
  const [customerId, setCustomerId] = useState<number>(customers[0]?.id || 1);
  const [sourceType, setSourceType] = useState('INTERNAL');
  const [shippingAddress, setShippingAddress] = useState('100 Silicon Ave, Suite 400, San Jose, CA 95134');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const [lines, setLines] = useState<Array<{ product_id: number; quantity: number }>>([
    { product_id: products[0]?.id || 1, quantity: 1 },
  ]);

  const addLine = () => {
    setLines((prev) => [...prev, { product_id: products[0]?.id || 1, quantity: 1 }]);
  };

  const removeLine = (idx: number) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateLine = (idx: number, field: 'product_id' | 'quantity', val: number) => {
    setLines((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: val } : item))
    );
  };

  // Compute live subtotal
  const subtotal = lines.reduce((sum, item) => {
    const prod = products.find((p) => p.id === item.product_id);
    return sum + (prod?.price || 0) * item.quantity;
  }, 0);

  const tax = Math.round(subtotal * 0.08);
  const grandTotal = subtotal + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const selectedCustomer = customers.find((c) => c.id === customerId);
      const itemsPayload = lines.map((line) => {
        const prod = products.find((p) => p.id === line.product_id);
        return {
          product_id: line.product_id,
          sku: prod?.sku || `SKU-${line.product_id}`,
          product_name: prod?.name || 'Commercial SKU',
          quantity: line.quantity,
          unit_price: prod?.price || 0,
        };
      });

      await onSubmit({
        customer_id: customerId,
        customer_name: selectedCustomer?.name || 'Direct Enterprise',
        customer_email: selectedCustomer?.email || 'contact@example.com',
        source_type: sourceType,
        shipping_address: shippingAddress,
        notes,
        tax_total: tax,
        items: itemsPayload,
      });
      onClose();
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Commercial Order">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Customer & Channel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Customer Account</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 border border-slate-300 rounded-md outline-none focus:ring-1 focus:ring-blue-500"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Origin Channel</label>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="INTERNAL">Internal Commercial Desk</option>
              <option value="SHOPIFY">Shopify Storefront Connector</option>
              <option value="AMAZON">Amazon SP-API</option>
            </select>
          </div>
        </div>

        {/* Shipping address */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Shipping Destination</label>
          <input
            type="text"
            required
            value={shippingAddress}
            onChange={(e) => setShippingAddress(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Multi-item lines */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="font-semibold text-slate-700">Order Line Items</label>
            <button
              type="button"
              onClick={addLine}
              className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Product Line
            </button>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
            {lines.map((line, idx) => {
              const prod = products.find((p) => p.id === line.product_id);
              const lineTotal = (prod?.price || 0) * line.quantity;

              return (
                <div key={idx} className="p-2.5 bg-white flex items-center gap-2">
                  <div className="flex-1">
                    <select
                      value={line.product_id}
                      onChange={(e) => updateLine(idx, 'product_id', parseInt(e.target.value, 10))}
                      className="w-full p-1.5 border border-slate-300 rounded text-xs outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.sku} — {p.name} (₫{p.price.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-20">
                    <input
                      type="number"
                      min="1"
                      value={line.quantity}
                      onChange={(e) => updateLine(idx, 'quantity', Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full p-1.5 border border-slate-300 rounded text-center text-xs outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="w-28 text-right font-mono font-medium text-slate-800">
                    ₫{lineTotal.toLocaleString()}
                  </div>
                  {lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLine(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Operational notes */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Operational Notes (Optional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Call customer before dock delivery"
            className="w-full px-3 py-2 border border-slate-300 rounded-md outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Financial Summary */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal:</span>
            <span className="font-mono">₫{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Estimated VAT (8%):</span>
            <span className="font-mono">₫{tax.toLocaleString()}</span>
          </div>
          <div className="border-t border-slate-200/80 pt-1 flex justify-between font-bold text-slate-900 text-sm">
            <span>Grand Total:</span>
            <span className="text-blue-600 font-mono">₫{grandTotal.toLocaleString()}</span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-slate-600 hover:text-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-xs inline-flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            {loading ? 'Creating Order...' : 'Create Commercial Order'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
