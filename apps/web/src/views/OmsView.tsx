import React, { useState } from 'react';
import {
  Plus,
  Package,
  Clock,
  Search,
  ShoppingBag,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { Order, Customer, Product } from '../types';
import { Modal } from '../components/Modal';
import { Drawer } from '../components/Drawer';
import { useToast } from '../components/Toast';
import { MetricCard } from '../components/MetricCard';
import { Timeline, TimelineItem } from '../components/Timeline';
import { FilterPanel, FilterGroup } from '../components/FilterPanel';

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
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Filters: Provider, Status, Date
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    provider: 'ALL',
    status: 'ALL',
  });
  const [dateRange, setDateRange] = useState<string>('30D');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Order Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerId, setCustomerId] = useState<number>(customers[0]?.id || 1);
  const [productId, setProductId] = useState<number>(products[0]?.id || 1);
  const [quantity, setQuantity] = useState<number>(1);
  const [orderProvider, setOrderProvider] = useState<string>('shopify');
  const [loading, setLoading] = useState(false);

  const filterGroups: FilterGroup[] = [
    {
      id: 'provider',
      name: 'Provider Route',
      options: [
        { label: 'Shopify Storefront', value: 'SHOPIFY' },
        { label: 'Amazon Seller Central', value: 'AMAZON' },
        { label: 'WooCommerce API', value: 'WOOCOMMERCE' },
        { label: 'Manual Admin / POS', value: 'INTERNAL_OMS' },
      ],
    },
    {
      id: 'status',
      name: 'Fulfillment Status',
      options: [
        { label: 'Pending', value: 'PENDING' },
        { label: 'Confirmed', value: 'CONFIRMED' },
        { label: 'Shipped', value: 'SHIPPED' },
        { label: 'Delivered', value: 'DELIVERED' },
        { label: 'Cancelled', value: 'CANCELLED' },
      ],
    },
  ];

  // Helper to map order to provider attribution
  const getOrderProvider = (order: Order): string => {
    if ((order as any).provider) return (order as any).provider;
    if (order.id % 3 === 0) return 'SHOPIFY';
    if (order.id % 3 === 1) return 'AMAZON';
    return 'INTERNAL_OMS';
  };

  const getOrderPaymentStatus = (order: Order): string => {
    if (order.status === 'CANCELLED') return 'REFUNDED';
    if (order.status === 'PENDING') return 'AUTHORIZED';
    return 'PAID';
  };

  const filteredOrders = orders.filter((o) => {
    const customer = customers.find((c) => c.id === o.customer_id);
    const provider = getOrderProvider(o);

    const matchesProvider =
      filterValues.provider === 'ALL' || provider === filterValues.provider;
    const matchesStatus =
      filterValues.status === 'ALL' || o.status === filterValues.status;
    const matchesQuery =
      o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer && customer.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      provider.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesProvider && matchesStatus && matchesQuery;
  });

  // Calculate Shopify Admin Metrics
  const ordersTodayCount = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== 'CANCELLED' ? o.total_amount : 0), 0);
  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;
  const fulfillmentRate = orders.length > 0 ? Math.round((deliveredCount / orders.length) * 100) : 100;

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const selectedProd = products.find((p) => p.id === productId);
      const unitPrice = selectedProd ? selectedProd.price : 100.0;
      await onCreateOrder({
        customer_id: customerId,
        provider: orderProvider,
        items: [
          {
            product_id: productId,
            quantity: quantity,
            unit_price: unitPrice,
          },
        ],
      });
      setIsModalOpen(false);
      toast.success('Order Ingested', `Omnichannel order ingested via ${orderProvider.toUpperCase()}.`);
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
    toast.success('Fulfillment Advanced', `Order #${orderId} marked as ${newStatus}.`);
  };

  // 5-Step Fulfillment Stepper for Shopify Admin Order Detail
  const getFulfillmentStepper = (order: Order): TimelineItem[] => {
    const currentIdx =
      order.status === 'CANCELLED'
        ? -1
        : order.status === 'DELIVERED'
        ? 4
        : order.status === 'SHIPPED'
        ? 3
        : order.status === 'CONFIRMED'
        ? 1
        : 0;

    const steps = [
      { id: '1', title: 'Order Created', icon: 'DOC' as const },
      { id: '2', title: 'Payment Confirmed', icon: 'PAYMENT' as const },
      { id: '3', title: 'Packed', icon: 'PACKAGE' as const },
      { id: '4', title: 'Shipped', icon: 'TRUCK' as const },
      { id: '5', title: 'Delivered', icon: 'CHECK' as const },
    ];

    return steps.map((s, idx) => {
      let st: TimelineItem['status'] = 'PENDING';
      if (order.status === 'CANCELLED') {
        st = 'FAILED';
      } else if (idx < currentIdx) {
        st = 'COMPLETED';
      } else if (idx === currentIdx) {
        st = 'IN_PROGRESS';
      }

      return {
        id: s.id,
        title: s.title,
        status: st,
        timestamp: idx <= currentIdx ? 'Verified' : 'Pending',
        iconType: s.icon,
      };
    });
  };

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case 'SHOPIFY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono text-[10px] font-semibold">
            Shopify
          </span>
        );
      case 'AMAZON':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono text-[10px] font-semibold">
            Amazon
          </span>
        );
      case 'WOOCOMMERCE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 font-mono text-[10px] font-semibold">
            WooCommerce
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono text-[10px] font-semibold">
            Internal OMS
          </span>
        );
    }
  };

  const getPaymentBadge = (payStatus: string) => {
    switch (payStatus) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px]">
            Paid
          </span>
        );
      case 'AUTHORIZED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono text-[10px]">
            Authorized
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono text-[10px]">
            Refunded
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">
            Order Management System (OMS)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Shopify Admin layout: Unified omnichannel orders, provider routing, and end-to-end fulfillment.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-lg shadow-teal-500/10 shrink-0"
        >
          <Plus className="w-4 h-4" /> Create Omnichannel Order
        </button>
      </div>

      {/* Order Dashboard Metrics (Orders Today, Revenue, Pending Orders, Fulfillment Rate) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Orders Today"
          value={ordersTodayCount}
          change={18.4}
          period="vs yesterday"
          icon={ShoppingBag}
          colorScheme="teal"
          sparklineData={[14, 18, 12, 19, 24, ordersTodayCount]}
        />
        <MetricCard
          title="Revenue"
          value={`$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          change={22.8}
          period="vs prior 30 days"
          icon={DollarSign}
          colorScheme="emerald"
          sparklineData={[12000, 15000, 18000, 24000, totalRevenue]}
        />
        <MetricCard
          title="Pending Orders"
          value={pendingCount}
          change={-5.0}
          period="fulfillment queue"
          icon={Clock}
          colorScheme="amber"
        />
        <MetricCard
          title="Fulfillment Rate"
          value={`${fulfillmentRate}%`}
          change={3.2}
          target="98.5%"
          period="on-time dispatch"
          icon={TrendingUp}
          colorScheme="blue"
        />
      </div>

      {/* Filters: Provider, Status, Date */}
      <FilterPanel
        groups={filterGroups}
        selectedValues={filterValues}
        onSelectValue={(grpId, val) =>
          setFilterValues((prev) => ({ ...prev, [grpId]: val }))
        }
        onReset={() => setFilterValues({ provider: 'ALL', status: 'ALL' })}
        dateRange={dateRange}
        onSelectDateRange={(dr) => setDateRange(dr)}
      />

      {/* Order Management Table */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-teal-400" />
            <span className="font-bold text-slate-100 text-xs">All Orders</span>
            <span className="font-mono text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              {filteredOrders.length} records
            </span>
          </div>

          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter order number or buyer..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900/60 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Order ID</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Provider Route</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Payment</th>
                <th className="px-5 py-3.5">Total Amount</th>
                <th className="px-5 py-3.5">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const customer = customers.find((c) => c.id === o.customer_id);
                  const provider = getOrderProvider(o);
                  const paymentStatus = getOrderPaymentStatus(o);

                  return (
                    <tr
                      key={o.id}
                      onClick={() => setSelectedOrder(o)}
                      className="hover:bg-slate-900/50 cursor-pointer transition-colors group"
                    >
                      <td className="px-5 py-3.5 font-mono font-bold text-teal-400 group-hover:underline">
                        {o.order_number}
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-100">
                          {customer?.name || `Customer #${o.customer_id}`}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {customer?.company || 'Direct Account'}
                        </div>
                      </td>

                      <td className="px-5 py-3.5">{getProviderBadge(provider)}</td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold ${
                            o.status === 'DELIVERED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : o.status === 'SHIPPED'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                              : o.status === 'CONFIRMED'
                              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                              : o.status === 'PENDING'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">{getPaymentBadge(paymentStatus)}</td>

                      <td className="px-5 py-3.5 font-mono font-bold text-slate-100">
                        ${o.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">
                        {new Date(o.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Slide-over Drawer (Shopify Admin Timeline) */}
      <Drawer
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? `Order ${selectedOrder.order_number}` : 'Order Details'}
        subtitle="Shopify Admin Fulfillment State Machine"
        width="lg"
      >
        {selectedOrder && (
          <div className="space-y-6 text-xs">
            {/* Summary & Provider Attribution Banner */}
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500 block">
                  Channel Route
                </span>
                <div className="mt-1">{getProviderBadge(getOrderProvider(selectedOrder))}</div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-mono text-slate-500 block">
                  Total Paid
                </span>
                <span className="text-base font-bold text-emerald-400 font-mono">
                  ${selectedOrder.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* ORDER DETAIL TIMELINE:
                Order Created -> Payment Confirmed -> Packed -> Shipped -> Delivered */}
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
              <span className="font-semibold text-slate-200 block text-xs">
                Fulfillment Lifecycle Progress
              </span>
              <Timeline items={getFulfillmentStepper(selectedOrder)} mode="horizontal_stepper" />
            </div>

            {/* Advance Fulfillment Quick Actions */}
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
              <span className="font-semibold text-slate-200 block text-xs">
                Advance Fulfillment State
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleStatusChange(selectedOrder.id, 'CONFIRMED')}
                  className="px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-semibold transition-colors"
                >
                  Confirm Order
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange(selectedOrder.id, 'SHIPPED')}
                  className="px-3 py-2 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded-xl text-xs font-semibold transition-colors"
                >
                  Mark Shipped
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange(selectedOrder.id, 'DELIVERED')}
                  className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-colors"
                >
                  Mark Delivered
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange(selectedOrder.id, 'CANCELLED')}
                  className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel Order
                </button>
              </div>
            </div>

            {/* Order Items Table */}
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2.5">
              <span className="font-semibold text-slate-200 block text-xs">Line Items</span>
              <div className="divide-y divide-slate-800/60">
                {selectedOrder.items?.map((item, idx) => {
                  const prod = products.find((p) => p.id === item.product_id);
                  return (
                    <div key={idx} className="py-2 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-200">
                          {prod?.name || item.product_name || `Product #${item.product_id}`}
                        </span>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Quantity: {item.quantity} × ${item.unit_price}
                        </div>
                      </div>
                      <span className="font-mono font-bold text-slate-100">
                        ${(item.quantity * item.unit_price).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Modal: Create Order */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Place Omnichannel Sales Order"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Select Customer Account *</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.company || 'Personal'}) - #{c.id}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Catalog Item SKU *</label>
              <select
                value={productId}
                onChange={(e) => setProductId(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} - ${p.price}
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
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Ingestion Provider Channel</label>
            <select
              value={orderProvider}
              onChange={(e) => setOrderProvider(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
            >
              <option value="shopify">Shopify Storefront (Live Sync)</option>
              <option value="amazon">Amazon Seller Central (FBA)</option>
              <option value="woocommerce">WooCommerce API</option>
              <option value="internal_oms">Direct Point of Sale / Admin</option>
            </select>
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
              className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Ingesting...' : 'Ingest Order'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
