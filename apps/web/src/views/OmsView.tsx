import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
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
      (customer && customer.company && customer.company.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesProvider && matchesStatus && matchesQuery;
  });

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const selectedProduct = products.find((p) => p.id === productId);
      const unitPrice = selectedProduct?.price || 100;
      await onCreateOrder({
        customer_id: customerId,
        provider: orderProvider.toUpperCase(),
        items: [
          {
            product_id: productId,
            quantity,
            unit_price: unitPrice,
          },
        ],
      });
      setIsModalOpen(false);
      toast.success(
        'Order Ingested',
        `Successfully routed through ${orderProvider.toUpperCase()} connector.`
      );
    } catch {
      toast.error('Order Failed', 'Could not create order.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: number, status: Order['status']) => {
    try {
      await onUpdateStatus(orderId, status);
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status });
      }
      toast.success('Status Updated', `Order marked as ${status}`);
    } catch {
      toast.error('Update Failed', 'Could not advance fulfillment status.');
    }
  };

  // Metrics
  const ordersTodayCount = orders.length;
  const totalRevenue = orders.reduce((acc, o) => acc + o.total_amount, 0);
  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;
  const fulfillmentRate = orders.length > 0 ? Math.round((deliveredCount / orders.length) * 100) : 100;

  // Horizontal Stepper for Drawer
  const getFulfillmentStepper = (order: Order): TimelineItem[] => {
    const statuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];
    const currentIdx = statuses.indexOf(order.status);

    return [
      {
        id: 'step_1',
        title: 'Order Ingested & Authorized',
        description: 'Authorized payment and logged transaction.',
        timestamp: 'Sep 19, 10:14',
        status: 'COMPLETED',
        badge: 'Authorized',
      },
      {
        id: 'step_2',
        title: 'Warehouse Picking & Pack',
        description: 'Allocated inventory from Primary Distribution Center.',
        timestamp: 'Sep 19, 11:30',
        status: currentIdx >= 1 ? 'COMPLETED' : 'IN_PROGRESS',
        badge: 'Picking ATP',
      },
      {
        id: 'step_3',
        title: 'Carrier Handshake & Dispatch',
        description: 'Handed off to logistics provider with tracking code.',
        timestamp: currentIdx >= 2 ? 'Sep 19, 14:00' : 'Pending Handoff',
        status: currentIdx >= 2 ? 'COMPLETED' : 'PENDING',
        badge: 'In-Transit',
      },
      {
        id: 'step_4',
        title: 'Delivered to Customer',
        description: 'Final delivery confirmation received via webhook.',
        timestamp: currentIdx >= 3 ? 'Sep 19, 16:45' : 'Estimated tomorrow',
        status: currentIdx >= 3 ? 'COMPLETED' : 'PENDING',
        badge: 'Proof of Delivery',
      },
    ];
  };

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case 'SHOPIFY':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-[10px] font-semibold">
            Shopify
          </span>
        );
      case 'AMAZON':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-mono text-[10px] font-semibold">
            Amazon
          </span>
        );
      case 'WOOCOMMERCE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-mono text-[10px] font-semibold">
            WooCommerce
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-mono text-[10px] font-semibold">
            Internal OMS
          </span>
        );
    }
  };

  const getPaymentBadge = (payStatus: string) => {
    switch (payStatus) {
      case 'PAID':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-[10px] font-medium">
            Paid
          </span>
        );
      case 'AUTHORIZED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-mono text-[10px] font-medium">
            Authorized
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-mono text-[10px] font-medium">
            Refunded
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-smooth-fade">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Order Management System (OMS)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Unified omnichannel orders, provider routing, and end-to-end fulfillment.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-all shadow-xs shrink-0 btn-press"
        >
          <Plus className="w-4 h-4" /> Create Omnichannel Order
        </button>
      </div>

      {/* Order Dashboard Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Orders Today"
          value={ordersTodayCount}
          change={18.4}
          period="vs yesterday"
          colorScheme="teal"
          sparklineData={[14, 18, 12, 19, 24, ordersTodayCount]}
        />
        <MetricCard
          title="Revenue"
          value={`$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          change={22.8}
          period="vs prior 30 days"
          colorScheme="emerald"
          sparklineData={[12000, 15000, 18000, 24000, totalRevenue]}
        />
        <MetricCard
          title="Pending Orders"
          value={pendingCount}
          change={-5.0}
          period="fulfillment queue"
          colorScheme="amber"
        />
        <MetricCard
          title="Fulfillment Rate"
          value={`${fulfillmentRate}%`}
          change={3.2}
          target="98.5%"
          period="on-time dispatch"
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
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 text-xs">All Orders</span>
            <span className="font-mono text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-xs">
              {filteredOrders.length} records
            </span>
          </div>

          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter order number or buyer..."
              className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 shadow-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200">
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
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
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
                      className="hover:bg-slate-50/70 cursor-pointer transition-colors group"
                    >
                      <td className="px-5 py-3.5 font-mono font-bold text-teal-700 group-hover:underline">
                        {o.order_number}
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">
                          {customer?.name || `Customer #${o.customer_id}`}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {customer?.company || 'Direct Account'}
                        </div>
                      </td>

                      <td className="px-5 py-3.5">{getProviderBadge(provider)}</td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold ${
                            o.status === 'DELIVERED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : o.status === 'SHIPPED'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : o.status === 'CONFIRMED'
                              ? 'bg-teal-50 text-teal-700 border border-teal-200'
                              : o.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">{getPaymentBadge(paymentStatus)}</td>

                      <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
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

      {/* Order Detail Slide-over Drawer */}
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
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
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
                <span className="text-base font-bold text-emerald-700 font-mono">
                  ${selectedOrder.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* ORDER DETAIL TIMELINE:
                Order Created -> Payment Confirmed -> Packed -> Shipped -> Delivered */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <span className="font-semibold text-slate-800 block text-xs">
                Fulfillment Lifecycle Progress
              </span>
              <Timeline items={getFulfillmentStepper(selectedOrder)} mode="horizontal_stepper" />
            </div>

            {/* Advance Fulfillment Quick Actions */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <span className="font-semibold text-slate-800 block text-xs">
                Advance Fulfillment State
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleStatusChange(selectedOrder.id, 'CONFIRMED')}
                  className="px-3 py-2 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-lg text-xs font-semibold transition-colors btn-press"
                >
                  Confirm Order
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange(selectedOrder.id, 'SHIPPED')}
                  className="px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-semibold transition-colors btn-press"
                >
                  Mark Shipped
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange(selectedOrder.id, 'DELIVERED')}
                  className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors btn-press"
                >
                  Mark Delivered
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange(selectedOrder.id, 'CANCELLED')}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-xs font-semibold transition-colors btn-press"
                >
                  Cancel Order
                </button>
              </div>
            </div>

            {/* Order Items Table */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
              <span className="font-semibold text-slate-800 block text-xs">Line Items</span>
              <div className="divide-y divide-slate-200">
                {selectedOrder.items?.map((item, idx) => {
                  const prod = products.find((p) => p.id === item.product_id);
                  return (
                    <div key={idx} className="py-2 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-900">
                          {prod?.name || item.product_name || `Product #${item.product_id}`}
                        </span>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Quantity: {item.quantity} × ${item.unit_price}
                        </div>
                      </div>
                      <span className="font-mono font-bold text-slate-900">
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
            <label className="block text-slate-700 font-medium mb-1">Select Customer Account *</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(Number(e.target.value))}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500"
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
              <label className="block text-slate-700 font-medium mb-1">Catalog Item SKU *</label>
              <select
                value={productId}
                onChange={(e) => setProductId(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} - ${p.price}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Quantity *</label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Ingestion Provider Channel</label>
            <select
              value={orderProvider}
              onChange={(e) => setOrderProvider(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 font-mono"
            >
              <option value="shopify">Shopify Storefront (Live Sync)</option>
              <option value="amazon">Amazon Seller Central (FBA)</option>
              <option value="woocommerce">WooCommerce API</option>
              <option value="internal_oms">Direct Point of Sale / Admin</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors btn-press"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-xs btn-press"
            >
              {loading ? 'Ingesting...' : 'Ingest Order'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
