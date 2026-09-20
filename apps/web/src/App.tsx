import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './views/DashboardView';
import { CrmView } from './views/CrmView';
import { ErpView } from './views/ErpView';
import { OmsView } from './views/OmsView';
import { ProvidersHubView } from './views/ProvidersHubView';
import { WorkflowView } from './views/WorkflowView';
import { SettingsView } from './views/SettingsView';
import { BiView } from './views/BiView';
import { ToastProvider } from './components/Toast';
import { CommandPalette } from './components/CommandPalette';
import {
  Customer,
  Product,
  InventoryItem,
  Order,
  KpiSummary,
  WorkflowRule,
  WorkflowLog,
  IntegrationProvider,
  JournalEntry,
} from './types';

const MainApp: React.FC = () => {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [moduleSubNav, setModuleSubNav] = useState<Record<string, string>>({
    crm: 'OVERVIEW',
    oms: 'ORDERS',
    erp: 'INVENTORY',
    bi: 'OVERVIEW',
    workflow: 'FLOW_CANVAS',
    providers: 'MARKETPLACE',
  });
  const [loading, setLoading] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // KPIs
  const [kpis, setKpis] = useState<KpiSummary>({
    total_revenue: 10850.0,
    total_orders: 1,
    avg_order_value: 10850.0,
    total_customers: 2,
    low_stock_count: 1,
  });

  // Providers Ecosystem
  const [providers, setProviders] = useState<IntegrationProvider[]>([
    {
      id: 'stripe',
      name: 'Stripe Payments',
      category: 'PAYMENTS',
      description: 'Accept global credit cards, Apple Pay, Google Pay, and localized payment rails.',
      status: 'CONNECTED',
      environment: 'PRODUCTION',
      iconType: 'CreditCard',
      accentColor: 'from-indigo-500 to-purple-600',
      apiKey: 'sk_live_51Msz9918230912401',
      webhookUrl: 'https://api.ubop.internal/api/v1/webhooks/stripe',
      signingSecret: 'whsec_99182390141',
      autoSync: true,
      latencyMs: 18,
      lastTested: 'Just now',
    },
    {
      id: 'paypal',
      name: 'PayPal Commerce',
      category: 'PAYMENTS',
      description: 'Alternative payment methods, Pay in 4 installment billing, and international buyer wallet.',
      status: 'CONFIGURED',
      environment: 'SANDBOX',
      iconType: 'CreditCard',
      accentColor: 'from-blue-600 to-cyan-500',
      apiKey: 'client_id_sandbox_9921',
      webhookUrl: 'https://api.ubop.internal/api/v1/webhooks/paypal',
      autoSync: false,
      latencyMs: 42,
    },
    {
      id: 'vnpay',
      name: 'VNPay QR & Banking',
      category: 'PAYMENTS',
      description: 'Direct domestic payment gateway, QR-Pay, and VietQR instant bank transfer integration.',
      status: 'CONFIGURED',
      environment: 'SANDBOX',
      iconType: 'CreditCard',
      accentColor: 'from-red-600 to-rose-500',
      apiKey: 'vnp_TmnCode_UBOP_DEV',
      webhookUrl: 'https://api.ubop.internal/api/v1/webhooks/vnpay',
      autoSync: true,
      latencyMs: 31,
    },
    {
      id: 'slack',
      name: 'Slack Operations',
      category: 'COMMUNICATIONS',
      description: 'Stream event-driven alerts, urgent restock notifications, and order updates to Slack channels.',
      status: 'CONNECTED',
      environment: 'PRODUCTION',
      iconType: 'MessageSquare',
      accentColor: 'from-emerald-500 to-teal-500',
      webhookUrl: 'https://hooks.slack.com/services/T00/B00/X00',
      autoSync: true,
      latencyMs: 24,
      lastTested: '1 min ago',
    },
    {
      id: 'sendgrid',
      name: 'SendGrid Email API',
      category: 'COMMUNICATIONS',
      description: 'Deliver transactional emails, order receipts, and automated customer lifecycle notices.',
      status: 'CONNECTED',
      environment: 'PRODUCTION',
      iconType: 'Mail',
      accentColor: 'from-blue-500 to-indigo-600',
      apiKey: 'SG.991823091.xxxxxxxx',
      autoSync: true,
      latencyMs: 28,
    },
    {
      id: 'twilio',
      name: 'Twilio SMS & WhatsApp',
      category: 'COMMUNICATIONS',
      description: 'Instant SMS order status updates and customer WhatsApp conversational messaging.',
      status: 'AVAILABLE',
      environment: 'SANDBOX',
      iconType: 'Phone',
      accentColor: 'from-rose-500 to-pink-600',
      autoSync: false,
    },
    {
      id: 'shipstation',
      name: 'ShipStation Logistics',
      category: 'LOGISTICS',
      description: 'Multi-carrier shipping label generation, automated tracking numbers, and warehouse routing.',
      status: 'CONNECTED',
      environment: 'PRODUCTION',
      iconType: 'Truck',
      accentColor: 'from-teal-500 to-green-600',
      apiKey: 'ss_api_key_881920',
      autoSync: true,
      latencyMs: 35,
    },
    {
      id: 'hubspot',
      name: 'HubSpot CRM Sync',
      category: 'CRM',
      description: 'Bi-directional synchronization of enterprise leads, deals, contacts, and customer activity.',
      status: 'CONFIGURED',
      environment: 'SANDBOX',
      iconType: 'Users',
      accentColor: 'from-orange-500 to-amber-600',
      apiKey: 'pat-na1-8819204-xxxxxxxx',
      autoSync: true,
      latencyMs: 44,
    },
  ]);

  // Customers
  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: 1,
      name: 'Apex Enterprises',
      email: 'contact@apex.io',
      company: 'Apex Global Holdings',
      phone: '+1 555-0199',
      status: 'ACTIVE',
      created_at: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
      total_spent: 10850.0,
      orders_count: 1,
    },
    {
      id: 2,
      name: 'Starlight Corp',
      email: 'ops@starlight.co',
      company: 'Starlight Group LLC',
      phone: '+1 212-701-4455',
      status: 'LEAD',
      created_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
      total_spent: 0.0,
      orders_count: 0,
    },
  ]);

  // Products
  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      sku: 'SRV-DL380-G11',
      name: 'Enterprise Rack Server Pro Dual Xeon',
      description: 'Scalable 2U server rack with hardware encryption and redundant power supplies.',
      category: 'HARDWARE',
      price: 4500.0,
      cost: 2800.0,
      created_at: new Date(Date.now() - 3600000 * 24 * 60).toISOString(),
    },
    {
      id: 2,
      sku: 'SW-CISCO-48',
      name: '48-Port Gigabit Core Switch',
      description: 'Managed enterprise switch with 10Gbps SFP+ uplinks and PoE+ support.',
      category: 'NETWORK',
      price: 1850.0,
      cost: 1100.0,
      created_at: new Date(Date.now() - 3600000 * 24 * 45).toISOString(),
    },
    {
      id: 3,
      sku: 'LIC-UBOP-ENT',
      name: 'UBOP Enterprise 1-Year Cloud License',
      description: 'Unlimited modules, 24/7 dedicated support, and custom provider adapter connectors.',
      category: 'SOFTWARE',
      price: 12000.0,
      cost: 500.0,
      created_at: new Date(Date.now() - 3600000 * 24 * 90).toISOString(),
    },
  ]);

  // Inventory
  const [inventory, setInventory] = useState<InventoryItem[]>([
    { id: 1, product_id: 1, warehouse: 'MAIN', quantity: 23, reorder_level: 10 },
    { id: 2, product_id: 2, warehouse: 'MAIN', quantity: 7, reorder_level: 10 },
    { id: 3, product_id: 3, warehouse: 'DIGITAL', quantity: 999, reorder_level: 0 },
  ]);

  // Orders
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 1,
      order_number: 'ORD-2026-0919-01',
      customer_id: 1,
      customer_name: 'Apex Enterprises',
      customer_email: 'contact@apex.io',
      status: 'CONFIRMED',
      total_amount: 10850.0,
      created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
      carrier: 'FedEx Priority Overnight',
      tracking_number: 'FX-8891-2309-US',
      items: [
        { product_id: 1, quantity: 2, unit_price: 4500.0, product_name: 'Enterprise Rack Server Pro Dual Xeon' },
        { product_id: 2, quantity: 1, unit_price: 1850.0, product_name: '48-Port Gigabit Core Switch' },
      ],
    },
  ]);

  // Workflow Rules
  const [workflowRules, setWorkflowRules] = useState<WorkflowRule[]>([
    {
      id: 1,
      name: 'Auto-Notify Ops on Inbound Orders',
      event_pattern: 'order.created',
      action_type: 'NOTIFY',
      action_payload: '{"channel": "#ops-fulfillment", "priority": "high"}',
      is_active: true,
      created_at: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
    },
    {
      id: 2,
      name: 'Safety Reorder Alert on Stock Depletion',
      event_pattern: 'inventory.stock_adjusted',
      action_type: 'NOTIFY',
      action_payload: '{"channel": "#procurement-emergency", "threshold": 10}',
      is_active: true,
      created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    },
  ]);

  // Workflow Logs
  const [workflowLogs, setWorkflowLogs] = useState<WorkflowLog[]>([
    {
      id: 1,
      rule_name: 'Auto-Notify Ops on Inbound Orders',
      event_name: 'order.created',
      status: 'SUCCESS',
      output: 'Dispatched notification card to Slack channel #ops-fulfillment for ORD-2026-0919-01.',
      created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    },
  ]);

  // Refresh data from API
  const refreshData = async () => {
    setLoading(true);
    try {
      const [kpiRes, custRes, prodRes, invRes, ordRes, ruleRes, logRes] =
        await Promise.allSettled([
          fetch('/api/v1/dashboard/kpis').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/v1/crm/customers').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/v1/erp/products').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/v1/erp/inventory').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/v1/oms/orders').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/v1/workflow/rules').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/v1/workflow/logs').then((r) => (r.ok ? r.json() : null)),
        ]);

      if (kpiRes.status === 'fulfilled' && kpiRes.value) setKpis(kpiRes.value);
      if (custRes.status === 'fulfilled' && custRes.value && custRes.value.length > 0) setCustomers(custRes.value);
      if (prodRes.status === 'fulfilled' && prodRes.value && prodRes.value.length > 0) setProducts(prodRes.value);
      if (invRes.status === 'fulfilled' && invRes.value && invRes.value.length > 0) setInventory(invRes.value);
      if (ordRes.status === 'fulfilled' && ordRes.value && ordRes.value.length > 0) setOrders(ordRes.value);
      if (ruleRes.status === 'fulfilled' && ruleRes.value && ruleRes.value.length > 0) setWorkflowRules(ruleRes.value);
      if (logRes.status === 'fulfilled' && logRes.value && logRes.value.length > 0) setWorkflowLogs(logRes.value);
    } catch {
      // Keep optimistic state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Provider Handlers
  const handleUpdateProvider = (updated: IntegrationProvider) => {
    setProviders((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleAddCustomProvider = (newProvider: IntegrationProvider) => {
    setProviders((prev) => [newProvider, ...prev]);
  };

  // Customer Handlers
  const handleCreateCustomer = async (custData: Partial<Customer>) => {
    try {
      const res = await fetch('/api/v1/crm/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(custData),
      });
      if (res.ok) {
        const created = await res.json();
        setCustomers((prev) => [created, ...prev]);
        setKpis((prev) => ({ ...prev, total_customers: prev.total_customers + 1 }));
        return;
      }
    } catch {}

    const localNew: Customer = {
      id: Date.now(),
      name: custData.name || 'New Customer',
      email: custData.email || '',
      company: custData.company,
      phone: custData.phone,
      status: (custData.status as any) || 'ACTIVE',
      created_at: new Date().toISOString(),
      total_spent: 0,
      orders_count: 0,
    };
    setCustomers((prev) => [localNew, ...prev]);
    setKpis((prev) => ({ ...prev, total_customers: prev.total_customers + 1 }));
  };

  const handleUpdateCustomer = async (customerId: number, data: Partial<Customer>) => {
    try {
      await fetch(`/api/v1/crm/customers/${customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch {}

    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, ...data } : c))
    );
  };

  const handleDeleteCustomer = async (customerId: number) => {
    try {
      await fetch(`/api/v1/crm/customers/${customerId}`, {
        method: 'DELETE',
      });
    } catch {}

    setCustomers((prev) => prev.filter((c) => c.id !== customerId));
    setKpis((prev) => ({ ...prev, total_customers: Math.max(0, prev.total_customers - 1) }));
  };

  // Product & ERP Handlers
  const handleCreateProduct = async (prodData: any) => {
    try {
      const res = await fetch('/api/v1/erp/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prodData),
      });
      if (res.ok) {
        const created = await res.json();
        setProducts((prev) => [created, ...prev]);
        setInventory((prev) => [
          ...prev,
          {
            id: Date.now(),
            product_id: created.id,
            warehouse: prodData.warehouse || 'MAIN',
            quantity: prodData.initial_quantity || 0,
            reorder_level: 10,
          },
        ]);
        return;
      }
    } catch {}

    const localId = Date.now();
    const localProd: Product = {
      id: localId,
      sku: prodData.sku,
      name: prodData.name,
      description: prodData.description,
      category: prodData.category || 'HARDWARE',
      price: prodData.price,
      cost: prodData.cost,
      created_at: new Date().toISOString(),
    };
    setProducts((prev) => [localProd, ...prev]);
    setInventory((prev) => [
      ...prev,
      {
        id: localId,
        product_id: localId,
        warehouse: prodData.warehouse || 'MAIN',
        quantity: prodData.initial_quantity || 0,
        reorder_level: 10,
      },
    ]);
  };

  const handleUpdateProduct = async (productId: number, data: any) => {
    try {
      await fetch(`/api/v1/erp/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch {}

    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, ...data } : p))
    );
  };

  const handleDeleteProduct = async (productId: number) => {
    try {
      await fetch(`/api/v1/erp/products/${productId}`, {
        method: 'DELETE',
      });
    } catch {}

    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setInventory((prev) => prev.filter((i) => i.product_id !== productId));
  };

  const handleAdjustStock = async (adj: any) => {
    try {
      await fetch('/api/v1/erp/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adj),
      });
    } catch {}

    setInventory((prev) =>
      prev.map((item) =>
        item.product_id === adj.product_id
          ? { ...item, quantity: Math.max(0, item.quantity + adj.quantity_delta) }
          : item
      )
    );
  };

  const handleTransferStock = async (transfer: {
    product_id: number;
    from_warehouse: string;
    to_warehouse: string;
    quantity: number;
  }) => {
    setInventory((prev) => {
      const existing = [...prev];
      const sourceIdx = existing.findIndex(
        (i) => i.product_id === transfer.product_id && i.warehouse === transfer.from_warehouse
      );
      if (sourceIdx !== -1) {
        existing[sourceIdx] = {
          ...existing[sourceIdx],
          quantity: Math.max(0, existing[sourceIdx].quantity - transfer.quantity),
        };
      }
      const destIdx = existing.findIndex(
        (i) => i.product_id === transfer.product_id && i.warehouse === transfer.to_warehouse
      );
      if (destIdx !== -1) {
        existing[destIdx] = {
          ...existing[destIdx],
          quantity: existing[destIdx].quantity + transfer.quantity,
        };
      } else {
        existing.push({
          id: Date.now(),
          product_id: transfer.product_id,
          warehouse: transfer.to_warehouse,
          quantity: transfer.quantity,
          reorder_level: 10,
        });
      }
      return existing;
    });
  };

  const handlePostJournalEntry = async (_entry: JournalEntry) => {
    // Stored in ledger state
  };

  // Order Handlers
  const handleCreateOrder = async (orderData: any) => {
    try {
      const res = await fetch('/api/v1/oms/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      if (res.ok) {
        const created = await res.json();
        setOrders((prev) => [created, ...prev]);
        setKpis((prev) => ({
          ...prev,
          total_orders: prev.total_orders + 1,
          total_revenue: prev.total_revenue + created.total_amount,
        }));
        return;
      }
    } catch {}

    const totalAmount = orderData.items.reduce(
      (acc: number, item: any) => acc + item.quantity * item.unit_price,
      0
    );
    const localOrder: Order = {
      id: Date.now(),
      order_number: `ORD-2026-${Date.now().toString().slice(-4)}`,
      customer_id: orderData.customer_id,
      customer_name: customers.find((c) => c.id === orderData.customer_id)?.name || 'Direct Enterprise',
      status: 'CONFIRMED',
      total_amount: totalAmount,
      created_at: new Date().toISOString(),
      items: orderData.items,
    };
    setOrders((prev) => [localOrder, ...prev]);
    setKpis((prev) => ({
      ...prev,
      total_orders: prev.total_orders + 1,
      total_revenue: prev.total_revenue + totalAmount,
    }));
  };

  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    try {
      await fetch(`/api/v1/oms/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch {}

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: status as any } : o))
    );
  };

  const handleCancelOrder = async (orderId: number, reason: string) => {
    try {
      await fetch(`/api/v1/oms/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
    } catch {}

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status: 'CANCELLED', cancellation_reason: reason } : o
      )
    );

    // Release inventory
    const targetOrder = orders.find((o) => o.id === orderId);
    if (targetOrder) {
      targetOrder.items.forEach((item) => {
        handleAdjustStock({
          product_id: item.product_id,
          quantity_delta: item.quantity,
          reason: `Restock from cancelled order ${targetOrder.order_number}`,
        });
      });
    }
  };

  const handleUpdateOrderTracking = async (
    orderId: number,
    carrier: string,
    trackingNumber: string
  ) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, carrier, tracking_number: trackingNumber, status: 'SHIPPED' }
          : o
      )
    );
  };

  // Workflow Handlers
  const handleCreateRule = async (ruleData: any) => {
    try {
      const res = await fetch('/api/v1/workflow/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleData),
      });
      if (res.ok) {
        const created = await res.json();
        setWorkflowRules((prev) => [...prev, created]);
        return;
      }
    } catch {}
    setWorkflowRules((prev) => [
      ...prev,
      { ...ruleData, id: Date.now(), created_at: new Date().toISOString() },
    ]);
  };

  const handleToggleRule = async (ruleId: number, isActive: boolean) => {
    try {
      await fetch(`/api/v1/workflow/rules/${ruleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isActive }),
      });
    } catch {}

    setWorkflowRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, is_active: isActive } : r))
    );
  };

  const handleDeleteRule = async (ruleId: number) => {
    try {
      await fetch(`/api/v1/workflow/rules/${ruleId}`, {
        method: 'DELETE',
      });
    } catch {}

    setWorkflowRules((prev) => prev.filter((r) => r.id !== ruleId));
  };

  const handleTriggerExecution = async (eventData?: any) => {
    const eventName = eventData?.trigger || 'inventory.stock_adjusted';
    try {
      await fetch('/api/v1/workflow/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: eventName, payload: eventData?.payload }),
      });
    } catch {}

    setWorkflowLogs((prev) => [
      {
        id: Date.now(),
        rule_name: 'Interactive Pipeline Simulator',
        event_name: eventName,
        status: 'SUCCESS',
        output: `Event evaluated across modular monolith boundaries. Dispatched action successfully.`,
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const getTabTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Command Center: Real-Time Executive Operations';
      case 'crm':
        return 'CRM: Customer 360 & Pipeline Management';
      case 'erp':
        return 'ERP: Master Inventory & Procurement';
      case 'oms':
        return 'OMS: Order Orchestration & Fulfillment';
      case 'bi':
        return 'BI: Business Intelligence & Telemetry';
      case 'providers':
        return 'Integrations & Provider Ecosystem';
      case 'workflow':
        return 'Workflow & Event Automation Engine';
      case 'settings':
        return 'Platform Administration & Topology';
      default:
        return 'UBOP Platform';
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-teal-500 selection:text-white">
      {/* Sidebar navigation */}
      <Sidebar
        currentTab={currentTab}
        currentSubTab={moduleSubNav[currentTab]}
        onTabChange={(tab, subTab) => {
          setCurrentTab(tab);
          if (subTab) {
            setModuleSubNav((prev) => ({ ...prev, [tab]: subTab }));
          }
        }}
        connectedProvidersCount={providers.filter((p) => p.status === 'CONNECTED').length}
      />

      {/* Main content body */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={getTabTitle()}
          onRefresh={refreshData}
          loading={loading}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />

        {/* Command Palette */}
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onNavigate={(tab, subTab) => {
            setCurrentTab(tab);
            if (subTab) {
              setModuleSubNav((prev) => ({ ...prev, [tab]: subTab }));
            }
          }}
          onAction={(actionId) => {
            if (actionId === 'create-sku') {
              setCurrentTab('erp');
              setModuleSubNav((prev) => ({ ...prev, erp: 'INVENTORY' }));
            } else if (actionId === 'create-order') {
              setCurrentTab('oms');
              setModuleSubNav((prev) => ({ ...prev, oms: 'ORDERS' }));
            } else if (actionId === 'create-customer') {
              setCurrentTab('crm');
              setModuleSubNav((prev) => ({ ...prev, crm: 'CUSTOMERS' }));
            } else if (actionId === 'test-all-ping') {
              setCurrentTab('providers');
            }
          }}
          customers={customers}
          orders={orders}
          products={products}
          providers={providers}
        />

        <main className="flex-1 p-8 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              kpis={kpis}
              recentOrders={orders}
              onSelectOrder={() => setCurrentTab('oms')}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'crm' && (
            <CrmView
              customers={customers}
              orders={orders}
              onCreateCustomer={handleCreateCustomer}
              onUpdateCustomer={handleUpdateCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              onSelectCustomerForOrder={() => setCurrentTab('oms')}
              activeSubNav={moduleSubNav.crm}
              onSubNavChange={(sub) => setModuleSubNav((prev) => ({ ...prev, crm: sub }))}
            />
          )}

          {currentTab === 'erp' && (
            <ErpView
              products={products}
              inventory={inventory}
              onCreateProduct={handleCreateProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onAdjustStock={handleAdjustStock}
              onTransferStock={handleTransferStock}
              onPostJournalEntry={handlePostJournalEntry}
              activeSubNav={moduleSubNav.erp}
            />
          )}

          {currentTab === 'oms' && (
            <OmsView
              orders={orders}
              customers={customers}
              products={products}
              onCreateOrder={handleCreateOrder}
              onUpdateStatus={handleUpdateOrderStatus}
              onCancelOrder={handleCancelOrder}
              onUpdateOrderTracking={handleUpdateOrderTracking}
              activeSubNav={moduleSubNav.oms}
            />
          )}

          {currentTab === 'bi' && (
            <BiView
              kpis={kpis}
              orders={orders}
              customers={customers}
              products={products}
              inventory={inventory}
              activeSubNav={moduleSubNav.bi}
            />
          )}

          {currentTab === 'providers' && (
            <ProvidersHubView
              providers={providers}
              onUpdateProvider={handleUpdateProvider}
              onAddCustomProvider={handleAddCustomProvider}
              activeSubNav={moduleSubNav.providers}
            />
          )}

          {currentTab === 'workflow' && (
            <WorkflowView
              rules={workflowRules}
              logs={workflowLogs}
              onCreateRule={handleCreateRule}
              onToggleRule={handleToggleRule}
              onDeleteRule={handleDeleteRule}
              onTriggerExecution={handleTriggerExecution}
              activeSubNav={moduleSubNav.workflow}
            />
          )}

          {currentTab === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
};
