import { ShieldCheck, Cpu, Database, Server } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const adapters = [
    {
      name: 'CustomerProvider',
      type: 'Internal DB Adapter',
      contract: 'app.providers.contracts.CustomerProvider',
      status: 'Active',
    },
    {
      name: 'InventoryProvider',
      type: 'Warehouse Stock Adapter',
      contract: 'app.providers.contracts.InventoryProvider',
      status: 'Active',
    },
    {
      name: 'PaymentProvider',
      type: 'Internal Gateway (Stripe-ready)',
      contract: 'app.providers.contracts.PaymentProvider',
      status: 'Active',
    },
    {
      name: 'NotificationProvider',
      type: 'EventBus / Webhook Adapter',
      contract: 'app.providers.contracts.NotificationProvider',
      status: 'Active',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">System Architecture & Adapter Layer</h2>
        <p className="text-xs text-slate-400 mt-1">
          Inspect core modular monolith topology, active provider adapter bindings, and infrastructure.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <Cpu className="w-5 h-5 text-teal-400" />
            <h3 className="font-semibold text-slate-100 text-sm">Architecture Style</h3>
          </div>
          <p className="text-xs text-slate-400">
            Modular Monolith with strict boundary enforcement, in-memory EventBus and DI services.
          </p>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-slate-100 text-sm">Persistence Layer</h3>
          </div>
          <p className="text-xs text-slate-400">
            Async SQLAlchemy 2.0 with connection pooling, PostgreSQL 17 / aiosqlite support.
          </p>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5">
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
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-400" /> Registered Provider Adapters
          </h3>
          <span className="text-[11px] text-slate-500">Decoupled Adapter Layer</span>
        </div>

        <div className="divide-y divide-slate-800/60 text-xs">
          {adapters.map((adapter) => (
            <div key={adapter.name} className="p-4 flex items-center justify-between hover:bg-slate-900/40">
              <div>
                <div className="font-semibold text-slate-200">{adapter.name}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{adapter.type}</div>
                <code className="text-[10px] text-slate-500 font-mono mt-1 block">{adapter.contract}</code>
              </div>
              <div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {adapter.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
