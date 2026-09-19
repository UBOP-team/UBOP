import React, { useState } from 'react';
import { ShieldCheck, Cpu, Database, Server, Shield, Key, History } from 'lucide-react';
import { PermissionMatrix } from '../components/PermissionMatrix';

export const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'RBAC' | 'ARCHITECTURE' | 'AUDIT'>('RBAC');

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
    <div className="space-y-6">
      {/* Settings Top Subnavigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('RBAC')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'RBAC'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Shield className="w-4 h-4" />
          Role & Permission Matrix
        </button>

        <button
          onClick={() => setActiveTab('ARCHITECTURE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'ARCHITECTURE'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Cpu className="w-4 h-4" />
          Architecture & Adapter Layer
        </button>

        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'AUDIT'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          Security Audit Trail
        </button>
      </div>

      {/* Tab 1: RBAC Permission Matrix */}
      {activeTab === 'RBAC' && <PermissionMatrix />}

      {/* Tab 2: System Architecture */}
      {activeTab === 'ARCHITECTURE' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-100">System Architecture & Adapter Layer</h2>
            <p className="text-xs text-slate-400 mt-1">
              Inspect core modular monolith topology, active provider adapter bindings, and infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <Cpu className="w-5 h-5 text-teal-400" />
                <h3 className="font-semibold text-slate-100 text-sm">Architecture Style</h3>
              </div>
              <p className="text-xs text-slate-400">
                Modular Monolith with strict boundary enforcement, in-memory EventBus and DI services.
              </p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <Database className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-slate-100 text-sm">Persistence Layer</h3>
              </div>
              <p className="text-xs text-slate-400">
                Async SQLAlchemy 2.0 with connection pooling, PostgreSQL 17 / aiosqlite support.
              </p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <Server className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-slate-100 text-sm">FastAPI & Async IO</h3>
              </div>
              <p className="text-xs text-slate-400">
                Python 3.12/3.14 running Starlette async ASGI engine with automatic OpenAPI documentation.
              </p>
            </div>
          </div>

          {/* Provider Adapters Table */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-400" /> Registered Provider Adapters
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">Decoupled Adapter Layer</span>
            </div>

            <div className="divide-y divide-slate-800/60 text-xs">
              {adapters.map((adapter) => (
                <div key={adapter.name} className="p-4 flex items-center justify-between hover:bg-slate-900/40">
                  <div>
                    <div className="font-semibold text-slate-200">{adapter.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{adapter.type}</div>
                    <code className="text-[10px] text-slate-500 font-mono mt-1 block">{adapter.contract}</code>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono text-slate-400">
                      {adapter.latency}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {adapter.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Security Audit Trail */}
      {activeTab === 'AUDIT' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Immutable Audit Trail & Governance Log</h2>
            <p className="text-xs text-slate-400 mt-1">
              Tamper-evident logs of administrative actions, provider handshakes, and access control changes.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <Key className="w-4 h-4 text-cyan-400" /> Recent Security Events
              </h3>
              <span className="text-[11px] font-mono text-slate-500">SHA-256 Checksum Verified</span>
            </div>

            <div className="divide-y divide-slate-800/60 text-xs">
              {auditEvents.map((evt) => (
                <div key={evt.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-900/40">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                        {evt.action}
                      </span>
                      <span className="font-medium text-slate-200">{evt.resource}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Triggered by <span className="text-slate-400">{evt.actor}</span> from IP {evt.ip}
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-slate-500 whitespace-nowrap">
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
