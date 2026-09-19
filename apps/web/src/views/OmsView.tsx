import React, { useState } from 'react';
import {
  Plus,
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  Search,
  Download,
} from 'lucide-react';
import { Order, Customer, Product } from '../types';
import { Modal } from '../components/Modal';
import { Drawer } from '../components/Drawer';
import { useToast } from '../components/Toast';

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
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerId, setCustomerId] = useState<number>(customers[0]?.id || 1);
  const [productId, setProductId] = useState<number>(products[0]?.id || 1);
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  const statusFilters = ['ALL', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  const filteredOrders = orders.filter((o) => {
    const customer = customers.find((c) => c.id === o.customer_id);
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const matchesQuery =
      o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer && customer.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesQuery;
  });

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
      toast.success('Order Created', `Order placed successfully for Customer #${customerId}.`);
    } catch {
      toast.error('Error', 'Failed to place order.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    await onUpdateStatus(orderId, newStatus);
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus as any });
    }
    toast.success('Status Updated', `Order transitioned to ${newStatus}.`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono text-[10px] font-semibold">
            <Clock className="w-3 h-3" /> PENDING
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 font-mono text-[10px] font-semibold">
            <CheckCircle className="w-3 h-3" /> CONFIRMED
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 font-mono text-[10px] font-semibold">
            <Truck className="w-3 h-3" /> SHIPPED
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono text-[10px] font-semibold">
            <CheckCircle className="w-3 h-3" /> DELIVERED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 font-mono text-[10px] font-semibold">
            <XCircle className="w-3 h-3" /> CANCELLED
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  const steps = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Order Management & Fulfillment (OMS)</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-channel orders, automated warehouse dispatch, and delivery state transitions.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-semibold px-4 py-2 rounded-xl text-xs transition-all shadow-lg shadow-teal-500/10 shrink-0"
        >
          <Plus className="w-4 h-4" /> Create Order
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-950/40 p-3 rounded-2xl border border-slate-800/80">
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {statusFilters.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order # or customer..."
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Order Number</th>
                <th className="px-6 py-3.5">Customer / Account</th>
                <th className="px-6 py-3.5">Amount & Items</th>
                <th className="px-6 py-3.5">Fulfillment Status</th>
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-6 py-3.5 text-right">Quick Transition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No orders match the current criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const customer = customers.find((c) => c.id === o.customer_id);
                  return (
                    <tr
                      key={o.id}
                      onClick={() => setSelectedOrder(o)}
                      className="hover:bg-slate-900/50 cursor-pointer transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-100 font-mono flex items-center gap-1.5 group-hover:text-teal-400 transition-colors">
                          <Package className="w-3.5 h-3.5 text-teal-400" />
                          {o.order_number}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-200">
                          {customer ? customer.name : `Customer #${o.customer_id}`}
                        </div>
                        {customer && <div className="text-[11px] text-slate-500">{customer.email}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-100 text-sm">${o.total_amount.toFixed(2)}</div>
                        <div className="text-[11px] text-slate-500">{o.items.length} line items</div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(o.status)}</td>
                      <td className="px-6 py-4 text-slate-500 font-mono text-[11px]">
                        {new Date(o.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={o.status}
                          onChange={(e) => handleStatusChange(o.id, e.target.value)}
                          className="bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-2.5 py-1 text-xs focus:outline-none focus:border-teal-500 cursor-pointer"
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

      {/* Slide-over Drawer: Order Details & Fulfillment Stepper */}
      <Drawer
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? selectedOrder.order_number : 'Order Details'}
        subtitle="Full item breakdown, customer information, and event history."
        width="xl"
      >
        {selectedOrder && (
          <div className="space-y-6 text-xs">
            {/* Header Card */}
            <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500 block mb-0.5">
                  Order Valuation
                </span>
                <div className="text-2xl font-bold text-slate-100">
                  ${selectedOrder.total_amount.toFixed(2)}
                </div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Placed on {new Date(selectedOrder.created_at).toLocaleString()}
                </div>
              </div>
              <div>{getStatusBadge(selectedOrder.status)}</div>
            </div>

            {/* Interactive Fulfillment Stepper */}
            {selectedOrder.status !== 'CANCELLED' && (
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
                <span className="font-semibold text-slate-200 block mb-3">Lifecycle Progress</span>
                <div className="flex items-center justify-between relative">
                  {steps.map((step, idx) => {
                    const isDone = steps.indexOf(selectedOrder.status) >= idx;
                    const isCurrent = selectedOrder.status === step;
                    return (
                      <div key={step} className="flex-1 flex flex-col items-center relative z-10">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] transition-all ${
                            isCurrent
                              ? 'bg-teal-500 text-slate-950 ring-4 ring-teal-500/20 shadow-lg'
                              : isDone
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {isDone ? <CheckCircle className="w-3.5 h-3.5" /> : idx + 1}
                        </div>
                        <span
                          className={`text-[10px] font-mono mt-1.5 uppercase ${
                            isDone ? 'text-slate-200 font-semibold' : 'text-slate-500'
                          }`}
                        >
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Line Items Breakdown */}
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
              <span className="font-semibold text-slate-200 block mb-3">Manifest & Items</span>
              <div className="space-y-2">
                {selectedOrder.items.map((item, idx) => {
                  const product = products.find((p) => p.id === item.product_id);
                  return (
                    <div
                      key={idx}
                      className="p-3 bg-slate-900/60 border border-slate-800/60 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center">
                          <Package className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200">
                            {product ? product.name : `Product #${item.product_id}`}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            Qty: {item.quantity} × ${item.unit_price.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className="font-bold text-slate-100 font-mono">
                        ${(item.quantity * item.unit_price).toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Domain Event Audit Trail */}
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
              <span className="font-semibold text-slate-200 block mb-2">EventBus Dispatch Trail</span>
              <div className="space-y-2 text-[11px] font-mono text-slate-400">
                <div className="flex items-center justify-between">
                  <span className="text-teal-400">• order.created</span>
                  <span className="text-slate-500">Payload broadcast to CRM & ERP</span>
                </div>
                {selectedOrder.status !== 'PENDING' && (
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-400">• order.status_updated</span>
                    <span className="text-slate-500">Transitioned to {selectedOrder.status}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Action */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  toast.success('Invoice Downloaded', `Generated invoice PDF for ${selectedOrder.order_number}`);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Download Invoice
              </button>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Modal: Create Order */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Sales Order">
        <form onSubmit={handleCreateOrder} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Select Customer Account *</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(parseInt(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-slate-400">
            <div className="flex justify-between items-center text-xs">
              <span>Calculated Order Amount:</span>
              <span className="font-bold text-teal-400 text-sm font-mono">
                $
                {((products.find((p) => p.id === productId)?.price || 0) * quantity).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold transition-colors disabled:opacity-50 shadow-lg shadow-teal-500/10"
            >
              {loading ? 'Submitting...' : 'Submit Sales Order'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
