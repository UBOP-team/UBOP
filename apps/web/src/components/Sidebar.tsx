import React from 'react';
import {
  LayoutDashboard,
  Users,
  Boxes,
  ShoppingCart,
  GitFork,
  Radio,
  Settings,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  connectedProvidersCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  connectedProvidersCount = 4,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard & BI', icon: LayoutDashboard },
    { id: 'crm', label: 'CRM (Customers)', icon: Users },
    { id: 'erp', label: 'ERP (Catalog & Stock)', icon: Boxes },
    { id: 'oms', label: 'OMS (Orders)', icon: ShoppingCart },
    { id: 'providers', label: 'Integrations & Providers', icon: Radio, badge: `${connectedProvidersCount} live` },
    { id: 'workflow', label: 'Workflow Engine', icon: GitFork },
    { id: 'settings', label: 'System Topology', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between p-4 h-screen sticky top-0 shrink-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-slate-800/80">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 via-teal-400 to-emerald-400 flex items-center justify-center font-black text-xl text-slate-950 shadow-lg shadow-teal-500/20">
            U
          </div>
          <div>
            <h1 className="font-extrabold text-base text-slate-100 tracking-tight flex items-center gap-1.5">
              UBOP
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/30">
                PRO
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Business Operations</p>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? 'bg-gradient-to-r from-teal-500/15 to-emerald-500/5 text-teal-300 border border-teal-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${active ? 'text-teal-400' : 'text-slate-500'}`} />
                  {item.label}
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold uppercase ${
                      active
                        ? 'bg-teal-500 text-slate-950'
                        : 'bg-slate-900 text-teal-400 border border-teal-500/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status */}
      <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800/80 text-xs">
        <div className="flex items-center justify-between text-slate-300 mb-1.5">
          <span className="flex items-center gap-1.5 font-semibold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Platform Engine
          </span>
          <span className="text-[10px] bg-slate-950 text-slate-400 border border-slate-800 px-1.5 py-0.5 rounded-md font-mono font-medium">
            v0.1.0
          </span>
        </div>
        <p className="text-slate-500 text-[10px]">FastAPI • React 19 • Decoupled Adapters</p>
      </div>
    </aside>
  );
};
