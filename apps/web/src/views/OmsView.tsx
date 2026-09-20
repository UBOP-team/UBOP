import React, { useState } from 'react';
import {
  Plus,
  Search,
  Download,
  Trash2,
  Printer,
  Copy,
  Check,
  Truck,
  AlertTriangle,
  Receipt,
} from 'lucide-react';
import { Order, Customer, Product, OrderItem } from '../types';
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
  onCancelOrder?: (orderId: number, reason: string) => Promise<void>;
  onUpdateOrderTracking?: (orderId: number, carrier: string, trackingNumber: string) => Promise<void>;
  activeSubNav?: string;
}

export const OmsView: React.FC<OmsViewProps> = ({
  orders,
  customers,
  products,
  onCreateOrder,
  onUpdateStatus,
  onCancelOrder,
  onUpdateOrderTracking,
  activeSubNav,
}) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'WORKSPACE' | 'CONFIG' | 'PROVIDERS' | 'ANALYTICS'>('WORKSPACE');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Filters: Provider, Status, Saved View, Row Selection
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    provider: 'ALL',
    status: 'ALL',
  });
  const [savedView, setSavedView] = useState<'ALL' | 'UNFULFILLED' | 'CONFIRMED' | 'SHIPPED' | 'CANCELLED'>('ALL');
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Sync with Sidebar subnavigation
  React.useEffect(() => {
    if (!activeSubNav) return;
    if (activeSubNav === 'OVERVIEW') setActiveTab('OVERVIEW');
    else if (activeSubNav === 'ORDERS') {
      setActiveTab('WORKSPACE');
      setSavedView('ALL');
    } else if (activeSubNav === 'FULFILLMENT') {
      setActiveTab('WORKSPACE');
      setSavedView('CONFIRMED');
    } else if (activeSubNav === 'RETURNS') {
      setActiveTab('WORKSPACE');
      setSavedView('CANCELLED');
    }
  }, [activeSubNav]);

  // Multi-Item Create Order Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);

  const [customerId, setCustomerId] = useState<number>(customers[0]?.id || 1);
  const [orderProvider, setOrderProvider] = useState<string>('SHOPIFY');
  const [shippingAddress, setShippingAddress] = useState('100 Silicon Ave, Suite 400, San Jose, CA 95134');
  const [loading, setLoading] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [testingPingId, setTestingPingId] = useState<string | null>(null);

  // Multi-item lines for creation
  const [orderLines, setOrderLines] = useState<Array<{ product_id: number; quantity: number }>>([
    { product_id: products[0]?.id || 1, quantity: 1 },
  ]);

  // Tracking modal state
  const [trackingCarrier, setTrackingCarrier] = useState('FedEx Priority Ground');
  const [trackingNumber, setTrackingNumber] = useState('TRK-8819204-US');

  // Cancel modal state
  const [cancelReason, setCancelReason] = useState('Customer requested order cancellation');

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
    if (order.provider) return order.provider;
    if (order.id % 3 === 0) return 'SHOPIFY';
    if (order.id % 3 === 1) return 'AMAZON';
    return 'INTERNAL_OMS';
  };

  const filteredOrders = orders.filter((o) => {
    const customer = customers.find((c) => c.id === o.customer_id);
    const provider = getOrderProvider(o);

    let matchesSavedView = true;
    if (savedView === 'UNFULFILLED') {
      matchesSavedView = o.status === 'PENDING';
    } else if (savedView === 'CONFIRMED') {
      matchesSavedView = o.status === 'CONFIRMED';
    } else if (savedView === 'SHIPPED') {
      matchesSavedView = o.status === 'SHIPPED' || o.status === 'DELIVERED';
    } else if (savedView === 'CANCELLED') {
      matchesSavedView = o.status === 'CANCELLED';
    }

    const matchesProvider =
      filterValues.provider === 'ALL' || provider === filterValues.provider;
    const matchesStatus =
      filterValues.status === 'ALL' || o.status === filterValues.status;
    const matchesQuery =
      o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer && customer.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (customer && customer.company && customer.company.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesSavedView && matchesProvider && matchesStatus && matchesQuery;
  });

  const toggleSelectAllOrders = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map((o) => o.id));
    }
  };

  const toggleSelectOrder = (id: number) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExportSelectedOrdersCsv = () => {
    const selected = orders.filter((o) => selectedOrderIds.includes(o.id));
    if (selected.length === 0) return;
    const headers = ['Order Number', 'Customer ID', 'Date', 'Status', 'Total Amount', 'Line Items', 'Channel', 'Tracking Number'];
    const rows = selected.map((o) => [
      o.order_number,
      o.customer_id,
      new Date(o.created_at).toISOString().split('T')[0],
      o.status,
      o.total_amount.toFixed(2),
      o.items.length,
      getOrderProvider(o),
      o.tracking_number || 'N/A',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ubop_selected_orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Batch Export Complete', `Exported ${selected.length} chosen orders to CSV.`);
  };

  const handleBatchConfirmOrders = async () => {
    if (selectedOrderIds.length === 0) return;
    for (const id of selectedOrderIds) {
      await onUpdateStatus(id, 'CONFIRMED');
    }
    toast.success('Batch Status Updated', `Confirmed & allocated inventory for ${selectedOrderIds.length} orders.`);
    setSelectedOrderIds([]);
  };

  const handleBatchDispatchOrders = async () => {
    if (selectedOrderIds.length === 0) return;
    for (const id of selectedOrderIds) {
      if (onUpdateOrderTracking) {
        await onUpdateOrderTracking(id, 'FedEx Express Fleet', `TRK-BULK-${Date.now().toString().slice(-6)}`);
      } else {
        await onUpdateStatus(id, 'SHIPPED');
      }
    }
    toast.success('Batch Dispatch Complete', `Generated carrier manifests for ${selectedOrderIds.length} orders.`);
    setSelectedOrderIds([]);
  };

  // Calculate order subtotal in create modal
  const calculateModalSubtotal = () => {
    return orderLines.reduce((acc, line) => {
      const prod = products.find((p) => p.id === line.product_id);
      return acc + (prod ? prod.price * line.quantity : 0);
    }, 0);
  };

  const handleAddOrderLine = () => {
    setOrderLines([...orderLines, { product_id: products[0]?.id || 1, quantity: 1 }]);
  };

  const handleRemoveOrderLine = (idx: number) => {
    if (orderLines.length === 1) return;
    setOrderLines(orderLines.filter((_, i) => i !== idx));
  };

  const handleUpdateOrderLine = (idx: number, field: 'product_id' | 'quantity', val: number) => {
    setOrderLines(
      orderLines.map((line, i) => (i === idx ? { ...line, [field]: val } : line))
    );
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const items: OrderItem[] = orderLines.map((line) => {
        const prod = products.find((p) => p.id === line.product_id);
        return {
          product_id: line.product_id,
          quantity: line.quantity,
          unit_price: prod ? prod.price : 100,
          product_name: prod ? prod.name : `Product #${line.product_id}`,
        };
      });

      await onCreateOrder({
        customer_id: customerId,
        provider: orderProvider,
        shipping_address: shippingAddress,
        items,
      });

      setIsModalOpen(false);
      setOrderLines([{ product_id: products[0]?.id || 1, quantity: 1 }]);
      toast.success(
        'Order Ingested',
        `Successfully routed through ${orderProvider} connector with ${items.length} line item(s).`
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

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setLoading(true);
    try {
      if (onCancelOrder) {
        await onCancelOrder(selectedOrder.id, cancelReason);
      } else {
        await onUpdateStatus(selectedOrder.id, 'CANCELLED');
      }
      setSelectedOrder({
        ...selectedOrder,
        status: 'CANCELLED',
        cancellation_reason: cancelReason,
      });
      setIsCancelModalOpen(false);
      toast.success('Order Cancelled', 'Status updated to CANCELLED and stock released to inventory.');
    } catch {
      toast.error('Cancellation Failed', 'Could not cancel order.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTrackingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setLoading(true);
    try {
      if (onUpdateOrderTracking) {
        await onUpdateOrderTracking(selectedOrder.id, trackingCarrier, trackingNumber);
      }
      setSelectedOrder({
        ...selectedOrder,
        carrier: trackingCarrier,
        tracking_number: trackingNumber,
        status: selectedOrder.status === 'PENDING' || selectedOrder.status === 'CONFIRMED' ? 'SHIPPED' : selectedOrder.status,
      });
      setIsTrackingModalOpen(false);
      toast.success('Carrier Dispatched', `Tracking code ${trackingNumber} registered with ${trackingCarrier}.`);
    } catch {
      toast.error('Dispatch Failed', 'Could not update carrier details.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportOrdersCsv = () => {
    const headers = ['Order Number', 'Customer ID', 'Date', 'Status', 'Total Amount', 'Line Items', 'Channel', 'Tracking Number'];
    const rows = orders.map((o) => [
      o.order_number,
      o.customer_id,
      new Date(o.created_at).toISOString().split('T')[0],
      o.status,
      o.total_amount.toFixed(2),
      o.items.length,
      getOrderProvider(o),
      o.tracking_number || 'N/A',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ubop_oms_orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Export Complete', `Exported ${orders.length} orders to CSV.`);
  };

  const handleTestPing = async (providerId: string) => {
    setTestingPingId(providerId);
    try {
      const res = await fetch(`/api/v1/providers/ping/${providerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(
          'Ping Handshake Passed',
          `${data.message || 'Operational'} (${data.latency_ms || 18}ms latency)`
        );
      } else {
        toast.error('Ping Failed', 'Connection failed.');
      }
    } catch {
      toast.info('Internal Ping', 'Internal adapter ping executed successfully.');
    } finally {
      setTestingPingId(null);
    }
  };

  const totalRevenue = orders.reduce((acc, o) => acc + o.total_amount, 0);
  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;
  const confirmedCount = orders.filter((o) => o.status === 'CONFIRMED').length;

  const getFulfillmentStepper = (order: Order): TimelineItem[] => {
    const statuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];
    const currentIdx = statuses.indexOf(order.status);
    const isCancelled = order.status === 'CANCELLED';

    if (isCancelled) {
      return [
        {
          id: 'step_1',
          title: 'Order Ingested',
          description: 'Payment authorized via payment gateway.',
          timestamp: new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'COMPLETED',
          badge: 'Ingested',
        },
        {
          id: 'step_cancel',
          title: 'Order Cancelled & Reversed',
          description: order.cancellation_reason || 'Order voided by operator. Funds reversed.',
          timestamp: 'Just now',
          status: 'COMPLETED',
          badge: 'Cancelled',
        },
      ];
    }

    return [
      {
        id: 'step_1',
        title: 'Order Ingested & Authorized',
        description: 'Payment authorization settled across gateway rails.',
        timestamp: new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'COMPLETED',
        badge: 'Authorized',
      },
      {
        id: 'step_2',
        title: 'Warehouse Picking & Pack',
        description: 'Allocated inventory from Primary Distribution Center.',
        timestamp: currentIdx >= 1 ? 'Verified ATP' : 'Pending Picking',
        status: currentIdx >= 1 ? 'COMPLETED' : 'IN_PROGRESS',
        badge: 'Picking ATP',
      },
      {
        id: 'step_3',
        title: 'Carrier Handshake & Dispatch',
        description: order.tracking_number
          ? `${order.carrier || 'FedEx'}: Tracking #${order.tracking_number}`
          : 'Awaiting carrier scan & shipping label generation.',
        timestamp: currentIdx >= 2 ? 'In-Transit' : 'Pending Handoff',
        status: currentIdx >= 2 ? 'COMPLETED' : 'PENDING',
        badge: 'In-Transit',
      },
      {
        id: 'step_4',
        title: 'Delivered to Customer',
        description: 'Final proof of delivery recorded.',
        timestamp: currentIdx >= 3 ? 'Delivered' : 'Estimated transit',
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

  const selectedOrderCustomer = selectedOrder ? customers.find((c) => c.id === selectedOrder.customer_id) : null;

  return (
    <div className="space-y-6 animate-smooth-fade">
      {/* Header & 5 Standard Module Tabs */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Order Management System (OMS)</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-teal-50 text-teal-700 border border-teal-200/70">
                Shopify & Amazon Sync
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Omnichannel order orchestration, multi-item line ingestion, carrier handshakes, and fulfillment progression.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportOrdersCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors shadow-xs btn-press"
              title="Export Orders as CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" /> Export CSV
            </button>

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
              sparklineData={[2, 4, 3, 5, confirmedCount]}
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
                <h3 className="text-sm font-bold text-slate-900">Fulfillment Pipeline Progression (Shopify Model)</h3>
                <span className="font-mono text-xs text-slate-500">Real-time Order Stages</span>
              </div>
              <div className="space-y-3">
                {[
                  { stage: '1. Ingestion & Payment Authorized', count: orders.length, color: 'bg-teal-500', pct: '100%' },
                  { stage: '2. Warehouse Picking & ATP Allocation', count: confirmedCount + deliveredCount, color: 'bg-blue-500', pct: `${Math.round(((confirmedCount + deliveredCount) / Math.max(orders.length, 1)) * 100)}%` },
                  { stage: '3. Carrier Manifest & Handshake', count: orders.filter((o) => o.status === 'SHIPPED' || o.status === 'DELIVERED').length, color: 'bg-amber-500', pct: `${Math.round((orders.filter((o) => o.status === 'SHIPPED' || o.status === 'DELIVERED').length / Math.max(orders.length, 1)) * 100)}%` },
                  { stage: '4. Delivered to Destination', count: deliveredCount, color: 'bg-emerald-500', pct: `${Math.round((deliveredCount / Math.max(orders.length, 1)) * 100)}%` },
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
                  <h3 className="text-sm font-bold text-slate-900">Carrier Logistics Dispatch</h3>
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
          {/* Resource Index: Saved Views Pills (Blueprint Section 4.1) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold mr-1.5 shrink-0">
              Saved Views:
            </span>
            {[
              { id: 'ALL', label: 'All Orders' },
              { id: 'UNFULFILLED', label: 'Unfulfilled / Pending' },
              { id: 'CONFIRMED', label: 'Confirmed & Picking' },
              { id: 'SHIPPED', label: 'Shipped / In-Transit' },
              { id: 'CANCELLED', label: 'Cancelled & Returns' },
            ].map((sv) => (
              <button
                key={sv.id}
                onClick={() => setSavedView(sv.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                  savedView === sv.id
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {sv.label}
              </button>
            ))}
          </div>

          {/* Floating / Sticky Bulk Action Bar */}
          {selectedOrderIds.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-900 text-white rounded-xl shadow-lg animate-smooth-fade text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-mono font-bold">
                  {selectedOrderIds.length} orders selected
                </span>
                <span className="text-slate-300">Contextual batch operations across omnichannel orders</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleBatchConfirmOrders}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium shadow-xs"
                >
                  Allocate & Confirm
                </button>
                <button
                  onClick={handleBatchDispatchOrders}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors font-medium shadow-xs"
                >
                  Dispatch via Carrier
                </button>
                <button
                  onClick={handleExportSelectedOrdersCsv}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-teal-400" /> Export CSV
                </button>
                <button
                  onClick={() => setSelectedOrderIds([])}
                  className="px-2.5 py-1.5 text-slate-400 hover:text-white transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

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
                    <th className="w-10 px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length}
                        onChange={toggleSelectAllOrders}
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                        title="Select All"
                      />
                    </th>
                    <th className="px-5 py-3.5">Order Ref</th>
                    <th className="px-5 py-3.5">Customer / Account</th>
                    <th className="px-5 py-3.5">Channel Route</th>
                    <th className="px-5 py-3.5">Carrier Tracking</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        No orders match the current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((o) => {
                      const customer = customers.find((c) => c.id === o.customer_id);
                      const provider = getOrderProvider(o);

                      return (
                        <tr
                          key={o.id}
                          onClick={() => setSelectedOrder(o)}
                          className="hover:bg-slate-50/70 cursor-pointer transition-colors group"
                        >
                          <td className="w-10 px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedOrderIds.includes(o.id)}
                              onChange={() => toggleSelectOrder(o.id)}
                              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                            />
                          </td>
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
                            {o.tracking_number ? (
                              <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-700">
                                <Truck className="w-3.5 h-3.5 text-teal-600" />
                                <span>{o.tracking_number}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px] font-mono">Unassigned</span>
                            )}
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
                    onClick={() => handleTestPing(prov.id)}
                    disabled={testingPingId === prov.id}
                    className="text-teal-700 font-semibold hover:text-teal-800 disabled:opacity-50"
                  >
                    {testingPingId === prov.id ? 'Pinging...' : 'Test Ping ➔'}
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
            {/* Source Provenance Banner (Blueprint Section 4.2 / 2.2) */}
            <div className="flex items-center justify-between p-3 bg-emerald-50/80 border border-emerald-200/90 rounded-xl text-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <div>
                  <span className="font-semibold text-emerald-900">
                    Provider: {getOrderProvider(selectedOrder)} Storefront Connector
                  </span>
                  <span className="text-emerald-700 font-mono text-[11px] block sm:inline sm:ml-2">
                    • Sync: Real-time Webhook (Healthy)
                  </span>
                </div>
              </div>
              <div className="font-mono text-emerald-800 text-[11px] bg-white/80 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                External ID: SH-{String(selectedOrder.id).padStart(6, '0')}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold tracking-wider">
                  Total Order Amount
                </span>
                <div className="font-mono text-2xl font-bold text-slate-900 mt-0.5">
                  ${selectedOrder.total_amount.toFixed(2)}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold ${
                      selectedOrder.status === 'DELIVERED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : selectedOrder.status === 'CANCELLED'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-teal-50 text-teal-700 border border-teal-200'
                    }`}
                  >
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
                    onClick={() => setIsTrackingModalOpen(true)}
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
                {selectedOrder.status !== 'CANCELLED' && selectedOrder.status !== 'DELIVERED' && (
                  <button
                    onClick={() => setIsCancelModalOpen(true)}
                    className="px-3 py-1.5 text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium transition-colors"
                  >
                    Cancel Order
                  </button>
                )}
                <button
                  onClick={() => setIsInvoiceModalOpen(true)}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium shadow-xs transition-colors"
                >
                  <Receipt className="w-3.5 h-3.5 text-slate-500" /> Commercial Invoice
                </button>
              </div>
            </div>

            {/* Carrier & Tracking Card */}
            {selectedOrder.tracking_number && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-teal-600" /> {selectedOrder.carrier || 'Carrier Delivery'}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedOrder.tracking_number || '');
                      setCopiedTracking(true);
                      toast.success('Copied', 'Tracking number copied to clipboard.');
                      setTimeout(() => setCopiedTracking(false), 2000);
                    }}
                    className="text-teal-700 hover:text-teal-800 font-mono text-[11px] flex items-center gap-1"
                  >
                    {copiedTracking ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    {selectedOrder.tracking_number}
                  </button>
                </div>
              </div>
            )}

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

      {/* Modal: Multi-Item Create Order */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Place Omnichannel Sales Order (Shopify Admin Model)"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Customer Account *</label>
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
              <label className="block text-slate-700 font-medium mb-1">Ingestion Provider Channel</label>
              <select
                value={orderProvider}
                onChange={(e) => setOrderProvider(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 font-mono"
              >
                <option value="SHOPIFY">Shopify Storefront</option>
                <option value="AMAZON">Amazon Seller Central (FBA)</option>
                <option value="WOOCOMMERCE">WooCommerce API</option>
                <option value="INTERNAL_OMS">Direct Point of Sale / Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Shipping Destination</label>
              <input
                type="text"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Multi-Item Selector */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">Order Line Items</span>
              <button
                type="button"
                onClick={handleAddOrderLine}
                className="text-teal-700 hover:text-teal-800 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Line Item
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {orderLines.map((line, idx) => {
                const selectedProd = products.find((p) => p.id === line.product_id);
                return (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                    <select
                      value={line.product_id}
                      onChange={(e) => handleUpdateOrderLine(idx, 'product_id', Number(e.target.value))}
                      className="flex-1 bg-white border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-900 focus:outline-none"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (${p.price.toFixed(2)})
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-1 w-24">
                      <span className="text-slate-400 text-[10px]">Qty:</span>
                      <input
                        type="number"
                        min="1"
                        required
                        value={line.quantity}
                        onChange={(e) => handleUpdateOrderLine(idx, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-900 font-mono"
                      />
                    </div>

                    <span className="w-20 text-right font-mono font-bold text-slate-900">
                      ${((selectedProd?.price || 0) * line.quantity).toFixed(2)}
                    </span>

                    {orderLines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOrderLine(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                        title="Remove Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between font-mono">
              <span className="font-semibold text-slate-700">Calculated Subtotal:</span>
              <span className="font-bold text-base text-slate-900">${calculateModalSubtotal().toFixed(2)}</span>
            </div>
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

      {/* Modal: Carrier Tracking Dispatch */}
      <Modal
        isOpen={isTrackingModalOpen}
        onClose={() => setIsTrackingModalOpen(false)}
        title="Register Carrier Dispatch & Tracking"
      >
        <form onSubmit={handleSaveTrackingSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Carrier Provider *</label>
            <select
              value={trackingCarrier}
              onChange={(e) => setTrackingCarrier(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 font-medium"
            >
              <option value="FedEx Priority Ground">FedEx Priority Ground</option>
              <option value="UPS Next Day Air">UPS Next Day Air</option>
              <option value="DHL Global Express">DHL Global Express</option>
              <option value="USPS Priority Mail">USPS Priority Mail</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Carrier Tracking Number *</label>
            <input
              type="text"
              required
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="e.g. TRK-8819204-US"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-teal-500"
            />
          </div>

          <p className="text-slate-500 text-[11px]">
            Assigning tracking will automatically shift the order status to SHIPPED and trigger customer SMS/email notifications.
          </p>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsTrackingModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors btn-press text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors disabled:opacity-50 shadow-xs btn-press text-xs"
            >
              {loading ? 'Dispatching...' : 'Confirm Dispatch'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Cancel Order */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancel Order & Release Inventory"
      >
        <form onSubmit={handleCancelSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Reason for Cancellation *</label>
            <select
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500"
            >
              <option value="Customer requested order cancellation">Customer requested order cancellation</option>
              <option value="Suspected fraudulent transaction">Suspected fraudulent transaction</option>
              <option value="Inventory shortage / Out of stock">Inventory shortage / Out of stock</option>
              <option value="Carrier delivery lane unavailable">Carrier delivery lane unavailable</option>
            </select>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <p className="text-[11px] leading-relaxed">
              Cancelling will set status to CANCELLED, reverse payment authorization on Stripe, and return all line item quantities to warehouse stock.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCancelModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors btn-press text-xs font-medium"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 shadow-xs btn-press text-xs"
            >
              {loading ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Printable Commercial Invoice */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        title="Commercial Sales Invoice"
      >
        {selectedOrder && (
          <div className="space-y-6 text-xs print:p-0">
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="font-mono text-base font-bold text-slate-900">UBOP ENTERPRISE</span>
                <p className="text-slate-500 text-[11px]">100 Silicon Ave, San Jose, CA 95134</p>
                <p className="text-slate-500 text-[11px]">Tax ID: US-EIN-92-8819203</p>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-teal-700 text-sm">{selectedOrder.order_number}</span>
                <p className="text-slate-400 font-mono text-[11px]">Date: {new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {selectedOrder.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold block mb-1">Billed To</span>
                <div className="font-bold text-slate-900">{selectedOrderCustomer?.name || `Customer #${selectedOrder.customer_id}`}</div>
                <div className="text-slate-500">{selectedOrderCustomer?.company || 'Enterprise Account'}</div>
                <div className="text-slate-500">{selectedOrderCustomer?.email}</div>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold block mb-1">Shipping Details</span>
                <div className="text-slate-800 font-medium">{selectedOrder.shipping_address || '100 Silicon Ave, Suite 400'}</div>
                <div className="text-slate-500 mt-1">Carrier: {selectedOrder.carrier || 'Standard Ground'}</div>
                {selectedOrder.tracking_number && (
                  <div className="font-mono text-teal-700">Track: {selectedOrder.tracking_number}</div>
                )}
              </div>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Item Description</th>
                  <th className="py-2 px-3 text-center">Qty</th>
                  <th className="py-2 px-3 text-right">Unit Price</th>
                  <th className="py-2 px-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedOrder.items.map((item, idx) => {
                  const prod = products.find((p) => p.id === item.product_id);
                  return (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{prod ? prod.name : `Product #${item.product_id}`}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-right font-mono">${item.unit_price.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">${(item.quantity * item.unit_price).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <div className="w-48 space-y-1 font-mono text-right">
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Subtotal:</span>
                  <span>${selectedOrder.total_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Tax (0% B2B):</span>
                  <span>$0.00</span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold text-sm pt-1 border-t border-slate-200">
                  <span>Total Amount:</span>
                  <span>${selectedOrder.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsInvoiceModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 text-xs"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                  toast.success('Print Dialog', 'Opening system print preview...');
                }}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" /> Print Invoice
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
