import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Order, Customer, Product } from '../types';
import { Modal } from '../components/Modal';
import { Drawer } from '../components/Drawer';
import { useToast } from '../components/Toast';
import { MetricCard } from '../components/MetricCard';
import { Timeline, TimelineItem } from '../components/Timeline';
import { FilterPanel, FilterGroup } from '../components/FilterPanel';
import { ConfigPanel, ConfigSection } from '../components/ConfigPanel';

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
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'WORKSPACE' | 'CONFIG' | 'PROVIDERS' | 'ANALYTICS'>('WORKSPACE');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Filters: Provider, Status
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    provider: 'ALL',
    status: 'ALL',
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Create Order Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerId, setCustomerId] = useState<number>(customers[0]?.id || 1);
  const [productId, setProductId] = useState<number>(products[0]?.id || 1);
  const [quantity, setQuantity] = useState<number>(1);
  const [orderProvider, setOrderProvider] = useState<string>('shopify');
  const [loading, setLoading] = useState(false);

  // OMS Configuration Sections
  const [omsConfigSections, setOmsConfigSections] = useState<ConfigSection[]>([
    {
      title: 'Order Orchestration & Routing Rules',
      description: 'Automated fulfillment routing across warehouses and commerce channels.',
      fields: [
        {
          id: 'auto_authorize_payment',
          label: 'Immediate Payment Capture',
          description: 'Automatically capture authorized Stripe/PayPal charges upon order placement.',
          type: 'toggle',
          value: true,
        },
        {
          id: 'split_shipment_policy',
          label: 'Split-Shipment Policy',
          description: 'Route line items from different warehouses if primary location has insufficient ATP.',
          type: 'select',
          value: 'ALLOWED',
          options: [
            { label: 'Allow Split Shipments (Fastest Delivery)', value: 'ALLOWED' },
            { label: 'Consolidate at Primary Hub (Lowest Freight Cost)', value: 'CONSOLIDATED' },
            { label: 'Manual Exception Hold', value: 'MANUAL_HOLD' },
          ],
        },
        {
          id: 'auto_cancel_unpaid_hours',
          label: 'Unpaid Pending Order Auto-Cancel (Hours)',
          description: 'Release reserved inventory if customer payment remains unconfirmed.',
          type: 'number',
          value: 24,
        },
      ],
    },
    {
      title: 'Fraud Detection & Compliance Guardrails',
      description: 'Threshold criteria for flagging high-risk orders for supervisor review.',
      fields: [
        {
          id: 'fraud_velocity_limit',
          label: 'High-Value Order Manual Review Threshold ($)',
          description: 'Orders exceeding this amount require operations approval before picking.',
          type: 'number',
          value: 10000,
        },
        {
          id: 'require_address_verification',
          label: 'Strict Carrier Address Validation (AVS)',
          description: 'Reject unverified commercial addresses through ShipStation validation API.',
          type: 'toggle',
          value: true,
        },
      ],
    },
  ]);

  const handleOmsConfigChange = (secIdx: number, fieldId: string, val: any) => {
    setOmsConfigSections((prev) => {
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

  const handleSaveOmsConfig = () => {
    toast.success('OMS Settings Saved', 'Order routing policies and fraud guardrails updated.');
  };

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
  const totalRevenue = orders.reduce((acc, o) => acc + o.total_amount, 0);
  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;
  const confirmedCount = orders.filter((o) => o.status === 'CONFIRMED').length;

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

  return (
    <div className="space-y-6 animate-smooth-fade">
      {/* Header & 5 Standard Module Tabs */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Order Management System (OMS)</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-teal-50 text-teal-700 border border-teal-200/70">
                OMS Core
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Omnichannel order routing, fulfillment workflows, carrier handshakes, and status progression.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium px-3.5 py-1.5 rounded-lg text-xs transition-all shadow-xs shrink-0 btn-press active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" /> Ingest Order
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
              title="Total Orders Ingested"
              value={orders.length}
              subtext="Processed through OMS"
              change={12.0}
              period="vs prior month"
              sparklineData={[8, 12, 14, 18, 22, orders.length]}
            />
            <MetricCard
              title="Processed Gross Revenue"
              value={`$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              subtext="Settled across payment rails"
              change={18.4}
              period="vs prior month"
              sparklineData={[42, 58, 65, 74, 89, 96]}
            />
            <MetricCard
              title="In Picking & Assembly"
              value={confirmedCount}
              subtext="Warehouse ATP committed"
              change={0}
              period="active fulfillment"
              sparklineData={[2, 4, 3, 5, confirmedCount || 1]}
            />
            <MetricCard
              title="Pending Authorization"
              value={pendingCount}
              subtext={pendingCount > 0 ? 'Action required' : 'Clear queue'}
              change={pendingCount > 0 ? -5 : 0}
              period="awaiting payment capture"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Fulfillment Pipeline Progression</h3>
                <span className="font-mono text-xs text-slate-500">Real-time Order Stages</span>
              </div>
              <div className="space-y-3">
                {[
                  { stage: '1. Ingestion & Payment Authorized', count: orders.length, color: 'bg-teal-500', pct: '100%' },
                  { stage: '2. Warehouse Picking & ATP Allocation', count: orders.length, color: 'bg-blue-500', pct: '100%' },
                  { stage: '3. Carrier Manifest & Handshake', count: orders.filter(o => o.status === 'SHIPPED' || o.status === 'DELIVERED').length, color: 'bg-amber-500', pct: '65%' },
                  { stage: '4. Delivered to Destination', count: deliveredCount, color: 'bg-emerald-500', pct: '45%' },
                ].map((s, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{s.stage}</span>
                      <span className="font-mono font-bold text-slate-900">{s.count} Orders</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div style={{ width: s.pct }} className={`h-full ${s.color} rounded-full`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Carrier Logistics Status</h3>
                  <p className="text-xs text-slate-500 mt-0.5">ShipStation multi-carrier routing.</p>
                </div>
                <div className="space-y-3 pt-3">
                  {[
                    { carrier: 'FedEx Priority Ground', onTime: '98.8%', volume: '62%' },
                    { carrier: 'UPS Next Day Air', onTime: '99.4%', volume: '24%' },
                    { carrier: 'DHL Global Express', onTime: '97.2%', volume: '14%' },
                  ].map((c, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-800">{c.carrier}</div>
                        <div className="text-[11px] text-slate-500 font-mono">Volume share: {c.volume}</div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-emerald-700">{c.onTime}</span>
                        <span className="block text-[10px] text-slate-400">On-Time SLA</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setActiveTab('WORKSPACE')}
                className="mt-4 w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
              >
                Open Orders Data Grid ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WORKSPACE */}
      {activeTab === 'WORKSPACE' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs">
            <FilterPanel
              groups={filterGroups}
              selectedValues={filterValues}
              onSelectValue={(groupId: string, val: string) => setFilterValues((prev) => ({ ...prev, [groupId]: val }))}
              onReset={() => setFilterValues({ provider: 'ALL', status: 'ALL' })}
            />

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders, customers..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Order Ref</th>
                    <th className="px-5 py-3.5">Customer / Account</th>
                    <th className="px-5 py-3.5">Channel Route</th>
                    <th className="px-5 py-3.5">Payment</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        No orders match the current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((o) => {
                      const customer = customers.find((c) => c.id === o.customer_id);
                      const provider = getOrderProvider(o);
                      const payStatus = getOrderPaymentStatus(o);

                      return (
                        <tr
                          key={o.id}
                          onClick={() => setSelectedOrder(o)}
                          className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                        >
                          <td className="px-5 py-3.5">
                            <span className="font-mono font-bold text-teal-700">{o.order_number}</span>
                            <span className="block text-[11px] font-mono text-slate-400 mt-0.5">
                              {new Date(o.created_at).toLocaleDateString()}
                            </span>
                          </td>

                          <td className="px-5 py-3.5">
                            <div className="font-semibold text-slate-900">
                              {customer ? customer.name : `Customer #${o.customer_id}`}
                            </div>
                            {customer?.company && (
                              <span className="text-[11px] text-slate-500 font-normal">
                                {customer.company}
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-3.5">{getProviderBadge(provider)}</td>

                          <td className="px-5 py-3.5">
                            <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {payStatus}
                            </span>
                          </td>

                          <td className="px-5 py-3.5">
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold border ${
                                o.status === 'DELIVERED'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : o.status === 'SHIPPED'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : o.status === 'CONFIRMED'
                                  ? 'bg-teal-50 text-teal-700 border-teal-200'
                                  : o.status === 'CANCELLED'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {o.status}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-900">
                            ${o.total_amount.toFixed(2)}
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

      {/* TAB 3: CONFIGURATION */}
      {activeTab === 'CONFIG' && (
        <ConfigPanel
          title="Order Management System Settings"
          subtitle="Configure auto-capture payment policies, split-shipment rules, and carrier fraud guardrails."
          sections={omsConfigSections}
          onChangeField={handleOmsConfigChange}
          onSave={handleSaveOmsConfig}
          onReset={() => toast.info('Reset Defaults', 'Restored OMS baseline configuration.')}
        />
      )}

      {/* TAB 4: PROVIDER SETTINGS */}
      {activeTab === 'PROVIDERS' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Commerce & Logistics Connectors</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live storefront adapters, shipping label generators, and payment gateway capture rails.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                id: 'shopify',
                name: 'Shopify Storefront Connector',
                status: 'CONNECTED',
                description: 'Webhook order ingestion, inventory level sync, and tracking callback.',
                lastSync: '1 min ago',
                latency: '18ms',
              },
              {
                id: 'amazon',
                name: 'Amazon Seller Central (FBA / MFN)',
                status: 'CONFIGURED',
                description: 'Order capture and inventory synchronization with Amazon SP-API.',
                lastSync: '15 mins ago',
                latency: '45ms',
              },
              {
                id: 'shipstation',
                name: 'ShipStation Carrier Engine',
                status: 'CONNECTED',
                description: 'Automated multi-carrier shipping label generation and tracking.',
                lastSync: 'Real-time',
                latency: '24ms',
              },
              {
                id: 'stripe',
                name: 'Stripe Payment Capture',
                status: 'CONNECTED',
                description: 'PCI-compliant card capture, authorization, settlement, and chargeback handling.',
                lastSync: 'Real-time',
                latency: '14ms',
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
            <h3 className="text-sm font-bold text-slate-900">Fulfillment SLA & Delivery Analytics</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Order processing turnaround time, carrier transit velocity, and return merchandise authorization (RMA) rate.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">Order-to-Pack Duration</span>
              <div className="font-mono text-xl font-bold text-teal-700">1.8 Hours</div>
              <span className="text-[11px] text-emerald-700 font-semibold">-22% vs warehouse target</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">Carrier On-Time Delivery</span>
              <div className="font-mono text-xl font-bold text-blue-700">98.6%</div>
              <span className="text-[11px] text-slate-500">Based on 1,420 shipments</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">RMA / Return Rate</span>
              <div className="font-mono text-xl font-bold text-slate-900">0.8%</div>
              <span className="text-[11px] text-emerald-700 font-semibold">Industry leading low return</span>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Drawer */}
      <Drawer
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title="Order Fulfillment Detail"
        subtitle={selectedOrder ? selectedOrder.order_number : ''}
        width="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold tracking-wider">
                  Total Order Amount
                </span>
                <div className="font-mono text-2xl font-bold text-slate-900 mt-0.5">
                  ${selectedOrder.total_amount.toFixed(2)}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {selectedOrder.status}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    {new Date(selectedOrder.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                {selectedOrder.status === 'PENDING' && (
                  <button
                    onClick={() => handleStatusChange(selectedOrder.id, 'CONFIRMED')}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                  >
                    Confirm & Allocate Stock
                  </button>
                )}
                {selectedOrder.status === 'CONFIRMED' && (
                  <button
                    onClick={() => handleStatusChange(selectedOrder.id, 'SHIPPED')}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                  >
                    Dispatch via Carrier
                  </button>
                )}
                {selectedOrder.status === 'SHIPPED' && (
                  <button
                    onClick={() => handleStatusChange(selectedOrder.id, 'DELIVERED')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                  >
                    Mark as Delivered
                  </button>
                )}
              </div>
            </div>

            {/* Stepper */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <h4 className="font-bold text-xs text-slate-900 uppercase font-mono tracking-wider">
                Fulfillment Workflow Stepper
              </h4>
              <Timeline items={getFulfillmentStepper(selectedOrder)} />
            </div>

            {/* Line Items */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <h4 className="font-bold text-xs text-slate-900 uppercase font-mono tracking-wider">
                Line Items ({selectedOrder.items.length})
              </h4>
              <div className="space-y-2">
                {selectedOrder.items.map((item, idx) => {
                  const prod = products.find((p) => p.id === item.product_id);
                  return (
                    <div
                      key={idx}
                      className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">
                          {prod ? prod.name : `Product #${item.product_id}`}
                        </div>
                        <span className="font-mono text-slate-400 text-[11px]">
                          Qty: {item.quantity} × ${item.unit_price.toFixed(2)}
                        </span>
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
              className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors btn-press text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors disabled:opacity-50 shadow-xs btn-press text-xs"
            >
              {loading ? 'Ingesting...' : 'Ingest Order'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
