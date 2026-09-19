import React, { useState } from 'react';
import { Plus, Package, Clock, CheckCircle, Truck, XCircle } from 'lucide-react';
import { Order, Customer, Product } from '../types';
import { Modal } from '../components/Modal';

interface OmsViewProps {
  orders: Order[];
  customers: Customer[];
  products: Product[];
  onCreateOrder: (order: any) => Promise<void>;
  onUpdateStatus: (orderId: number, status: string) => Promise<void>;
}

export const OmsView: React.FC<OmsViewProps> = ({
  orders,
  customers,
  products,
  onCreateOrder,
  onUpdateStatus,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerId, setCustomerId] = useState<number>(customers[0]?.id || 1);
  const [productId, setProductId] = useState<number>(products[0]?.id || 1);
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const selectedProd = products.find((p) => p.id === productId);
      const unitPrice = selectedProd ? selectedProd.price : 100.0;
      await onCreateOrder({
        customer_id: customerId,
        items: [
          {
            product_id: productId,
            quantity: quantity,
            unit_price: unitPrice,
          },
        ],
      });
      setIsModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono text-[10px] font-semibold">
            <Clock className="w-3 h-3" /> PENDING
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono text-[10px] font-semibold">
            <CheckCircle className="w-3 h-3" /> CONFIRMED
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono text-[10px] font-semibold">
            <Truck className="w-3 h-3" /> SHIPPED
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px] font-semibold">
            <CheckCircle className="w-3 h-3" /> DELIVERED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono text-[10px] font-semibold">
            <XCircle className="w-3 h-3" /> CANCELLED
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Order Management & Fulfillment</h2>
          <p className="text-xs text-slate-400 mt-1">
            End-to-end sales lifecycle, status state transitions, and real-time event publishing.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold px-4 py-2 rounded-xl text-xs transition-colors shadow-lg shadow-teal-500/10"
        >
          <Plus className="w-4 h-4" /> Create Order
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Order Number</th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Total Amount</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Created Date</th>
                <th className="px-6 py-3.5 text-right">Transition Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No orders submitted yet. Click "Create Order" to start.
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const customer = customers.find((c) => c.id === o.customer_id);
                  return (
                    <tr key={o.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-100 font-mono flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-teal-400" />
                          {o.order_number}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{o.items.length} line items</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-200">
                          {customer ? customer.name : `Customer #${o.customer_id}`}
                        </div>
                        {customer && <div className="text-[11px] text-slate-500">{customer.email}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-100 text-sm">${o.total_amount.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(o.status)}</td>
                      <td className="px-6 py-4 text-slate-500 font-mono text-[11px]">
                        {new Date(o.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <select
                          value={o.status}
                          onChange={(e) => onUpdateStatus(o.id, e.target.value)}
                          className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-teal-500 cursor-pointer"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Order */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Sales Order">
        <form onSubmit={handleCreateOrder} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Select Customer Account *</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(parseInt(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-slate-400 font-medium mb-1">Select Product *</label>
              <select
                value={productId}
                onChange={(e) => setProductId(parseInt(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} - ${p.price.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Quantity *</label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-slate-400">
            <div className="flex justify-between items-center text-xs">
              <span>Estimated Order Total:</span>
              <span className="font-bold text-slate-100 text-sm">
                $
                {((products.find((p) => p.id === productId)?.price || 0) * quantity).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Order'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
