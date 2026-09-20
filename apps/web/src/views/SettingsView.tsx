import React, { useState } from 'react';
import {
  ShieldCheck,
  Cpu,
  Database,
  Server,
  Shield,
  Key,
  History,
  Building,
  Save,
} from 'lucide-react';
import { PermissionMatrix } from '../components/PermissionMatrix';
import { useToast } from '../components/Toast';

export const SettingsView: React.FC = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'RBAC' | 'ORG' | 'ARCHITECTURE' | 'AUDIT'>('RBAC');

  const [orgConfig, setOrgConfig] = useState({
    companyName: 'Apex Enterprise Global Inc',
    legalName: 'Apex Enterprise Holdings LLC',
    taxId: 'US-EIN-92-8819203',
    timezone: 'UTC+7 (Asia/Bangkok)',
    baseCurrency: 'USD ($)',
    fiscalYearStart: 'January',
    contactEmail: 'ops-lead@apex.io',
    retentionDays: 90,
  });

  const handleSaveOrg = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Organization Settings Saved', 'Company profile and fiscal preferences persisted.');
  };

  const adapters = [
    {
      name: 'CustomerProvider',
      type: 'Internal DB Adapter',
      contract: 'app.providers.contracts.CustomerProvider',
      status: 'Active',
      latency: '4ms',
    },
    {
      name: 'InventoryProvider',
      type: 'Warehouse Stock Adapter',
      contract: 'app.providers.contracts.InventoryProvider',
      status: 'Active',
      latency: '6ms',
    },
    {
      name: 'PaymentProvider',
      type: 'Internal Gateway (Stripe-ready)',
      contract: 'app.providers.contracts.PaymentProvider',
      status: 'Active',
      latency: '28ms',
    },
    {
      name: 'NotificationProvider',
      type: 'EventBus / Webhook Adapter',
      contract: 'app.providers.contracts.NotificationProvider',
      status: 'Active',
      latency: '12ms',
    },
  ];

  const auditEvents = [
    {
      id: 'aud_1',
      actor: 'admin@ubop.internal',
      action: 'ROLE_POLICY_UPDATE',
      resource: 'Role: OPS_MANAGER (Added OMS_FULFILL)',
      ip: '10.0.4.12',
      timestamp: 'Today at 18:24:10',
    },
    {
      id: 'aud_2',
      actor: 'system.eventbus',
      action: 'PROVIDER_HANDSHAKE_PONG',
      resource: 'Shopify Storefront Connector verified',
      ip: '127.0.0.1',
      timestamp: 'Today at 18:15:02',
    },
    {
      id: 'aud_3',
      actor: 'integration.lead',
      action: 'CUSTOM_ADAPTER_CREATED',
      resource: 'Internal Warehouse WMS Adapter registered',
      ip: '10.0.8.99',
      timestamp: 'Today at 17:42:19',
    },
    {
      id: 'aud_4',
      actor: 'finance.lead',
      action: 'LEDGER_PERIOD_RECONCILE',
      resource: 'Financial Ledger Period FY26-Q3 balanced',
      ip: '10.0.2.55',
      timestamp: 'Today at 16:30:00',
    },
  ];

  return (
    <div className="space-y-6 animate-smooth-fade">
      {/* Settings Top Subnavigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Platform Administration & Governance</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-based access controls, organizational topology, provider contracts, and cryptographic audit logs.
          </p>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'RBAC', label: 'Role & Permission Matrix', icon: Shield },
            { id: 'ORG', label: 'Organization & Profile', icon: Building },
            { id: 'ARCHITECTURE', label: 'Architecture & Topology', icon: Cpu },
            { id: 'AUDIT', label: 'Security Audit Trail', icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap btn-press ${
                  active
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: RBAC Permission Matrix */}
      {activeTab === 'RBAC' && <PermissionMatrix />}

      {/* Tab 2: Organization Profile */}
      {activeTab === 'ORG' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs max-w-3xl space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Enterprise Tenant & Legal Profile</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Identity parameters applied across all enterprise modules, invoices, and EDI manifests.
            </p>
          </div>

          <form onSubmit={handleSaveOrg} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Company Display Name *</label>
                <input
                  type="text"
                  required
                  value={orgConfig.companyName}
                  onChange={(e) => setOrgConfig({ ...orgConfig, companyName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Legal Registered Entity *</label>
                <input
                  type="text"
                  required
                  value={orgConfig.legalName}
                  onChange={(e) => setOrgConfig({ ...orgConfig, legalName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Corporate Tax ID / EIN</label>
                <input
                  type="text"
                  value={orgConfig.taxId}
                  onChange={(e) => setOrgConfig({ ...orgConfig, taxId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Operations Contact Email</label>
                <input
                  type="email"
                  value={orgConfig.contactEmail}
                  onChange={(e) => setOrgConfig({ ...orgConfig, contactEmail: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Operating Timezone</label>
                <select
                  value={orgConfig.timezone}
                  onChange={(e) => setOrgConfig({ ...orgConfig, timezone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500"
                >
                  <option value="UTC+7 (Asia/Bangkok)">UTC+7 (Asia/Bangkok / Ho Chi Minh)</option>
                  <option value="UTC+0 (Europe/London)">UTC+0 (Europe/London / GMT)</option>
                  <option value="UTC-5 (America/New_York)">UTC-5 (America/New_York / EST)</option>
                  <option value="UTC-8 (America/Los_Angeles)">UTC-8 (America/Los_Angeles / PST)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Base Fiscal Currency</label>
                <select
                  value={orgConfig.baseCurrency}
                  onChange={(e) => setOrgConfig({ ...orgConfig, baseCurrency: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 font-mono"
                >
                  <option value="USD ($)">USD ($) - US Dollar</option>
                  <option value="EUR (€)">EUR (€) - Euro</option>
                  <option value="VND (₫)">VND (₫) - Vietnam Dong</option>
                  <option value="GBP (£)">GBP (£) - British Pound</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Audit Retention (Days)</label>
                <input
                  type="number"
                  min="30"
                  max="365"
                  value={orgConfig.retentionDays}
                  onChange={(e) => setOrgConfig({ ...orgConfig, retentionDays: parseInt(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium px-4 py-2 rounded-lg transition-colors shadow-xs btn-press text-xs"
              >
                <Save className="w-3.5 h-3.5" /> Save Organization Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: System Architecture */}
      {activeTab === 'ARCHITECTURE' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center gap-3 mb-2">
                <Cpu className="w-5 h-5 text-teal-600" />
                <h3 className="font-semibold text-slate-900 text-sm">Architecture Style</h3>
              </div>
              <p className="text-xs text-slate-500">
                Modular Monolith with strict boundary enforcement, in-memory EventBus and DI services.
              </p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center gap-3 mb-2">
                <Database className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-slate-900 text-sm">Persistence Layer</h3>
              </div>
              <p className="text-xs text-slate-500">
                Async SQLAlchemy 2.0 with connection pooling, PostgreSQL 17 / aiosqlite support.
              </p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center gap-3 mb-2">
                <Server className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-slate-900 text-sm">FastAPI & Async IO</h3>
              </div>
              <p className="text-xs text-slate-500">
                Python 3.12/3.14 running Starlette async ASGI engine with automatic OpenAPI documentation.
              </p>
            </div>
          </div>

          {/* Provider Adapters Table */}
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600" /> Registered Provider Adapters
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">Decoupled Adapter Layer</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {adapters.map((adapter) => (
                <div key={adapter.name} className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                  <div>
                    <div className="font-semibold text-slate-900">{adapter.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{adapter.type}</div>
                    <code className="text-[10px] text-slate-400 font-mono mt-1 block">{adapter.contract}</code>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono text-slate-500">
                      {adapter.latency}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {adapter.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Security Audit Trail */}
      {activeTab === 'AUDIT' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-900 flex items-center gap-2">
                <Key className="w-4 h-4 text-cyan-600" /> Recent Security & Governance Events
              </h3>
              <span className="text-[11px] font-mono text-slate-500">SHA-256 Checksum Verified</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {auditEvents.map((evt) => (
                <div key={evt.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/70 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200">
                        {evt.action}
                      </span>
                      <span className="font-medium text-slate-900">{evt.resource}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Triggered by <span className="text-slate-700 font-medium">{evt.actor}</span> from IP {evt.ip}
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
                    {evt.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
